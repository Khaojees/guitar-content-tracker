"use client";

import { useState, type ReactNode } from "react";
import {
  Card,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Typography,
  message,
  Empty,
  Tag,
  Alert,
  Spin,
} from "antd";
import { SearchOutlined, SaveOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const ENTITY_OPTIONS = [
  { value: "musicArtist", label: "Artists" },
  { value: "song", label: "Songs" },
  { value: "album", label: "Albums" },
];

const ENTITY_LABEL: Record<string, string> = {
  musicArtist: "Artist",
  song: "Song",
  album: "Album",
};

type ExistingStatus = Record<string, any>;

type SearchEntity = "musicArtist" | "song" | "album";

type SearchResult = Record<string, any>;

type AlbumTrack = {
  trackId: number;
  trackName: string;
  trackNumber: number | null;
  trackTimeMillis: number | null;
};

type AlbumTrackState = {
  tracks?: AlbumTrack[];
  loading: boolean;
  error?: string;
};

const formatDuration = (milliseconds: number | null) => {
  if (!milliseconds) return "-";
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchEntity, setSearchEntity] = useState<SearchEntity>("musicArtist");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<ExistingStatus>({});
  const [expandedAlbums, setExpandedAlbums] = useState<Record<number, boolean>>(
    {}
  );
  const [albumTracks, setAlbumTracks] = useState<
    Record<number, AlbumTrackState>
  >({});

  const buildSavingKey = (type: string, id: string | number) => `${type}-${id}`;

  const fetchExistingStatus = async (
    entity: SearchEntity,
    items: SearchResult[]
  ) => {
    const ids = items
      .map((item) => {
        if (entity === "musicArtist") return item.artistId;
        if (entity === "album") return item.collectionId;
        return item.trackId;
      })
      .filter((id) => id !== undefined && id !== null);

    if (ids.length === 0) {
      return {};
    }

    try {
      const response = await fetch("/api/search/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, ids }),
      });
      const data = await response.json();
      return data.existing ?? {};
    } catch (error) {
      console.error("Existing status error:", error);
      return {};
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const entity = searchEntity;
    setLoading(true);
    setResults([]);
    setStatusMap({});

    try {
      const response = await fetch(
        `/api/search?term=${encodeURIComponent(searchTerm)}&entity=${entity}`
      );
      const data = await response.json();
      const list = data.results || [];

      if (searchEntity !== entity) {
        return;
      }

      setResults(list);
      setExpandedAlbums({});
      setAlbumTracks({});

      const existing = await fetchExistingStatus(entity, list);
      if (searchEntity === entity) {
        setStatusMap(existing);
      }
    } catch (error) {
      console.error("Search error:", error);
      message.error("Unable to search iTunes. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtist = async (artist: SearchResult) => {
    if (!artist?.artistId) return;
    const idKey = String(artist.artistId);
    const savingToken = buildSavingKey("musicArtist", idKey);
    setSavingKey(savingToken);

    try {
      const response = await fetch("/api/save/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.artistId,
          artistName: artist.artistName,
          imageUrl: artist.artworkUrl100 || artist.artworkUrl60,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data?.message === "Artist already exists") {
          message.info("Artist already exists in your library.");
        } else {
          message.success("Artist added successfully");
        }
        setStatusMap((prev) => ({
          ...prev,
          [idKey]: { artistId: data.artistId ?? null },
        }));
      } else {
        message.error(data.error || "Failed to add artist");
      }
    } catch (error) {
      console.error("Save artist error:", error);
      message.error("Unexpected error while importing artist");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAlbum = async (album: SearchResult) => {
    if (!album?.collectionId) return;
    const idKey = String(album.collectionId);
    const savingToken = buildSavingKey("album", idKey);
    setSavingKey(savingToken);

    try {
      const response = await fetch("/api/save/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: album.collectionId }),
      });
      const data = await response.json();

      if (response.ok) {
        const trackCount = data.createdTrackCount ?? 0;
        const trackLabel = trackCount === 1 ? "track" : "tracks";

        if (trackCount > 0 || data.createdAlbum) {
          message.success(
            `Imported album "${
              album.collectionName || "Album"
            }" (${trackCount} ${trackLabel} added)`
          );
        } else {
          message.info(
            `Album "${
              album.collectionName || "Album"
            }" is already up to date in your library.`
          );
        }

        setStatusMap((prev) => ({
          ...prev,
          [idKey]: { albumId: data.albumId },
        }));
      } else {
        message.error(data.error || "Failed to import album");
      }
    } catch (error) {
      console.error("Save album error:", error);
      message.error("Unexpected error while importing album");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveTrack = async (track: SearchResult) => {
    if (!track?.trackId) return;
    const idKey = String(track.trackId);
    const savingToken = buildSavingKey("song", idKey);
    setSavingKey(savingToken);

    try {
      const response = await fetch("/api/save/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.trackId }),
      });
      const data = await response.json();

      if (response.ok) {
        message.success(
          data.created
            ? `Imported track “${track.trackName || "Track"}”`
            : "Track already exists in your library"
        );
        setStatusMap((prev) => ({
          ...prev,
          [idKey]: { trackId: data.trackId },
        }));
      } else {
        message.error(data.error || "Failed to import track");
      }
    } catch (error) {
      console.error("Save track error:", error);
      message.error("Unexpected error while importing track");
    } finally {
      setSavingKey(null);
    }
  };

  const toggleAlbumDetails = async (collectionId: number) => {
    const currentlyExpanded = expandedAlbums[collectionId];
    if (currentlyExpanded) {
      setExpandedAlbums((prev) => ({ ...prev, [collectionId]: false }));
      return;
    }

    setExpandedAlbums((prev) => ({ ...prev, [collectionId]: true }));

    if (albumTracks[collectionId]?.tracks) {
      return;
    }

    setAlbumTracks((prev) => ({
      ...prev,
      [collectionId]: {
        ...(prev[collectionId] ?? {}),
        loading: true,
        error: undefined,
      },
    }));

    try {
      const response = await fetch(`/api/search/album/${collectionId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch album tracks");
      }

      setAlbumTracks((prev) => ({
        ...prev,
        [collectionId]: { tracks: data.tracks ?? [], loading: false },
      }));
    } catch (error) {
      console.error("Album tracks fetch error:", error);
      setAlbumTracks((prev) => ({
        ...prev,
        [collectionId]: {
          tracks: [],
          loading: false,
          error: "Unable to load tracks",
        },
      }));
      message.error("Unable to load album tracks right now.");
    }
  };

  const renderActions = (
    item: SearchResult,
    entity: SearchEntity,
    idKey: string | null,
    exists: boolean
  ) => {
    if (!idKey) return undefined;

    const loadingKey = buildSavingKey(entity, idKey);
    const isLoading = savingKey === loadingKey;

    if (entity === "musicArtist") {
      return [
        <Button
          key="save-artist"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSaveArtist(item)}
          loading={isLoading}
          disabled={exists}
          className="!bg-emerald-500 !shadow-sm !shadow-emerald-500/30 hover:!bg-emerald-600"
        >
          {exists ? "Added" : isLoading ? "Adding..." : "Add artist"}
        </Button>,
      ];
    }

    if (entity === "album") {
      return [
        <Button
          key="save-album"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSaveAlbum(item)}
          loading={isLoading}
          className="!bg-indigo-500 !shadow-sm !shadow-indigo-500/30 hover:!bg-indigo-600"
        >
          {isLoading ? "Adding..." : "Add album"}
        </Button>,
      ];
    }

    return [
      <Button
        key="save-track"
        type="primary"
        icon={<SaveOutlined />}
        onClick={() => handleSaveTrack(item)}
        loading={isLoading}
        disabled={exists}
        className="!bg-blue-500 !shadow-sm !shadow-blue-500/30 hover:!bg-blue-600"
      >
        {exists ? "Saved" : isLoading ? "Saving..." : "Add track"}
      </Button>,
    ];
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Title level={2} className="!mb-2 !text-slate-900">
          Search the iTunes catalog
        </Title>
        <Paragraph className="!mb-0 max-w-3xl text-slate-600">
          Look up artists, albums, or individual tracks from iTunes and add only
          the pieces you really need to your library. Perfect when you want to
          focus on a single release instead of pulling an entire discography.
        </Paragraph>
      </section>

      <Card className="glass-surface border-none bg-white/90">
        <form
          onSubmit={handleSearch}
          className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-end"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">
              Search term
            </label>
            <Input
              size="large"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Artist, album, or song keyword"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">
              Result type
            </label>
            <Select
              size="large"
              value={searchEntity}
              onChange={(value) => setSearchEntity(value as SearchEntity)}
              options={ENTITY_OPTIONS}
              className="w-full"
            />
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            htmlType="submit"
            loading={loading}
            className="md:!col-span-2"
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </Card>

      {results.length > 0 && (
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="text-slate-800">
                Found {results.length}{" "}
                {ENTITY_LABEL[searchEntity].toLowerCase()} result
                {results.length > 1 ? "s" : ""}
              </span>
              <Tag color="processing" className="!rounded-full !px-4 !py-1">
                {
                  ENTITY_OPTIONS.find((option) => option.value === searchEntity)
                    ?.label
                }
              </Tag>
            </div>
          }
          className="glass-surface border-none bg-white/90"
        >
          <List
            itemLayout="horizontal"
            dataSource={results}
            renderItem={(item: SearchResult) => {
              const entity = searchEntity;
              const idValue =
                entity === "musicArtist"
                  ? item.artistId
                  : entity === "album"
                  ? item.collectionId
                  : item.trackId;
              const idKey =
                idValue !== undefined && idValue !== null
                  ? String(idValue)
                  : null;
              const exists = idKey ? Boolean(statusMap[idKey]) : false;
              const actions = renderActions(item, entity, idKey, exists);

              const primaryName =
                entity === "song"
                  ? item.trackName ||
                    `${item.artistName ?? ""} - ${
                      item.collectionName ?? ""
                    }`.trim() ||
                    "Unknown track"
                  : entity === "album"
                  ? item.collectionName || "Untitled album"
                  : item.artistName || "Unknown artist";

              const subtitle =
                entity === "song"
                  ? [item.artistName, item.collectionName]
                      .filter(Boolean)
                      .join(" • ")
                  : entity === "album"
                  ? item.artistName || ""
                  : item.primaryGenreName || "";

              const descriptionItems: ReactNode[] = [];

              if (entity === "song") {
                if (item.artistName) {
                  descriptionItems.push(
                    <div key="artist">
                      Artist:{" "}
                      <span className="text-slate-700">{item.artistName}</span>
                    </div>
                  );
                }
                if (item.collectionName) {
                  descriptionItems.push(
                    <div key="album">
                      Album:{" "}
                      <span className="text-slate-700">
                        {item.collectionName}
                      </span>
                    </div>
                  );
                }
              }

              if (entity === "album") {
                if (item.artistName) {
                  descriptionItems.push(
                    <div key="artist">
                      Artist:{" "}
                      <span className="text-slate-700">{item.artistName}</span>
                    </div>
                  );
                }
                if (item.trackCount) {
                  descriptionItems.push(
                    <div key="track-count">
                      Tracks on iTunes:{" "}
                      <span className="text-slate-700">{item.trackCount}</span>
                    </div>
                  );
                }
              }

              if (entity === "musicArtist" && item.primaryGenreName) {
                descriptionItems.push(
                  <div key="genre">
                    Primary genre:{" "}
                    <span className="text-slate-700">
                      {item.primaryGenreName}
                    </span>
                  </div>
                );
              }

              if (item.primaryGenreName && entity !== "musicArtist") {
                descriptionItems.push(
                  <div key="genre">
                    Genre:{" "}
                    <span className="text-slate-700">
                      {item.primaryGenreName}
                    </span>
                  </div>
                );
              }

              if (item.artistLinkUrl) {
                descriptionItems.push(
                  <div key="itunes" className="truncate">
                    iTunes:{" "}
                    <a
                      href={item.artistLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:underline"
                    >
                      {item.artistLinkUrl}
                    </a>
                  </div>
                );
              }

              const albumState =
                entity === "album" && item.collectionId
                  ? albumTracks[item.collectionId]
                  : undefined;
              const albumExpanded =
                entity === "album" && item.collectionId
                  ? Boolean(expandedAlbums[item.collectionId])
                  : false;

              const trackList =
                albumState?.tracks?.slice().sort((a, b) => {
                  const aNumber = a.trackNumber ?? Number.MAX_SAFE_INTEGER;
                  const bNumber = b.trackNumber ?? Number.MAX_SAFE_INTEGER;
                  return aNumber - bNumber;
                }) ?? [];

              return (
                <List.Item
                  className="rounded-2xl border border-slate-200/60 bg-white/70 p-4"
                  actions={actions}
                >
                  <div className="flex w-full flex-col gap-3">
                    <List.Item.Meta
                      avatar={
                        item.artworkUrl100 ? (
                          <Avatar
                            src={item.artworkUrl100}
                            size={80}
                            shape="square"
                            className="rounded-2xl border border-slate-200/70 shadow-md"
                          />
                        ) : (
                          <Avatar
                            size={80}
                            shape="square"
                            className="rounded-2xl bg-indigo-500 text-lg font-semibold text-white"
                          >
                            {item.artistName?.slice(0, 2) || "dY"}
                          </Avatar>
                        )
                      }
                      title={
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-slate-900">
                              {primaryName}
                            </span>
                            {exists && (
                              <Tag
                                color="success"
                                className="!rounded-full !px-2 !text-xs"
                              >
                                In library
                              </Tag>
                            )}
                          </div>
                          {subtitle && (
                            <Text className="text-sm text-slate-500">
                              {subtitle}
                            </Text>
                          )}
                        </div>
                      }
                      description={
                        descriptionItems.length > 0 ? (
                          <div className="space-y-1 text-xs text-slate-500">
                            {descriptionItems.map((node) => node)}
                          </div>
                        ) : undefined
                      }
                    />

                    {entity === "album" && item.collectionId && (
                      <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                        <div className="flex items-center justify-between">
                          <Text className="font-medium text-slate-700">
                            Tracks in album preview
                          </Text>
                          <Button
                            size="small"
                            type="default"
                            onClick={() =>
                              toggleAlbumDetails(item.collectionId)
                            }
                          >
                            {albumExpanded ? "Hide tracks" : "Show tracks"}
                          </Button>
                        </div>
                        {albumExpanded && (
                          <div className="mt-3 space-y-2">
                            {albumState?.loading && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Spin size="small" /> Loading track list...
                              </div>
                            )}
                            {albumState?.error && !albumState.loading && (
                              <Alert
                                type="error"
                                message={albumState.error}
                                showIcon
                              />
                            )}
                            {!albumState?.loading && !albumState?.error && (
                              <div className="space-y-1">
                                {trackList.length === 0 ? (
                                  <Text type="secondary" className="text-xs">
                                    No tracks were returned from iTunes for this
                                    album.
                                  </Text>
                                ) : (
                                  trackList.map((track) => (
                                    <div
                                      key={track.trackId}
                                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"
                                    >
                                      <span>
                                        {track.trackNumber
                                          ? `${track.trackNumber}. `
                                          : ""}
                                        {track.trackName}
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-400">
                                        {formatDuration(track.trackTimeMillis)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {!loading && results.length === 0 && searchTerm && (
        <Card className="glass-surface border-none bg-white/90">
          <Empty
            description={`No results for "${searchTerm}"`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
}
