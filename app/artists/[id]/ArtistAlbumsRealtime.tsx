"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Collapse,
  Button,
  Tag,
  message,
  Spin,
  Avatar,
  Empty,
} from "antd";
import {
  SaveOutlined,
  CheckCircleOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";

type Track = {
  trackId: number;
  trackName: string;
  artistName: string;
  trackNumber: number | null;
  trackTimeMillis: number | null;
  saved: boolean;
  dbTrackId?: number;
  trackStatus?: {
    status: string;
    starred: boolean;
    ignored: boolean;
  };
};

type Album = {
  collectionId: number;
  collectionName: string;
  artworkUrl100: string;
  trackCount: number;
  releaseDate: string;
  tracks: Track[];
};

type ArtistAlbumsRealtimeProps = {
  artistId: number;
  artistName: string;
};

const formatDuration = (ms: number | null) => {
  if (!ms) return "-";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const STATUS_COLORS: Record<string, string> = {
  idea: "default",
  ready: "processing",
  recorded: "warning",
  posted: "success",
};

export default function ArtistAlbumsRealtime({
  artistId,
  artistName,
}: ArtistAlbumsRealtimeProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTracks, setSavingTracks] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAlbums();
  }, [artistId]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/artist/${artistId}/albums`);
      const data = await response.json();

      if (response.ok) {
        setAlbums(data.albums || []);
      } else {
        message.error(data.error || "Failed to fetch albums");
      }
    } catch (error) {
      console.error("Fetch albums error:", error);
      message.error("Failed to fetch albums from iTunes");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrack = async (
    track: Track,
    albumName: string,
    albumImage: string
  ) => {
    setSavingTracks((prev) => new Set(prev).add(track.trackId));

    try {
      const response = await fetch("/api/save/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.trackId,
          artistId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`Saved "${track.trackName}"`);
        // Refresh albums to update saved status
        await fetchAlbums();
      } else {
        message.error(data.error || "Failed to save track");
      }
    } catch (error) {
      console.error("Save track error:", error);
      message.error("Failed to save track");
    } finally {
      setSavingTracks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(track.trackId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-surface border-none bg-white/90">
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
          <span className="ml-3 text-slate-600">
            กำลังโหลดอัลบั้มจาก iTunes...
          </span>
        </div>
      </Card>
    );
  }

  if (albums.length === 0) {
    return (
      <Card className="glass-surface border-none bg-white/90">
        <Empty description="ไม่พบอัลบั้มบน iTunes สำหรับศิลปินคนนี้" />
      </Card>
    );
  }

  const collapseItems = albums.map((album) => {
    const savedTracksCount = album.tracks.filter((t) => t.saved).length;

    return {
      key: String(album.collectionId),
      label: (
        <div className="flex items-center gap-4">
          <Avatar
            src={album.artworkUrl100}
            size={64}
            shape="square"
            className="rounded-lg shadow-md"
          />
          <div className="flex-1">
            <div className="font-semibold text-slate-900">
              {album.collectionName}
            </div>
            <div className="text-sm text-slate-500">
              {album.trackCount} เพลงใน iTunes
              {savedTracksCount > 0 && (
                <span className="ml-2 text-emerald-600">
                  บันทึกแล้ว {savedTracksCount} เพลง
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {new Date(album.releaseDate).getFullYear()}
            </div>
          </div>
        </div>
      ),
      children: (
        <div className="space-y-2 pt-4">
          {album.tracks.map((track) => (
            <div
              key={track.trackId}
              className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white/70 p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-400">
                    {track.trackNumber || "-"}
                  </span>
                  <span className="font-medium text-slate-900">
                    {track.trackName}
                  </span>
                  {track.saved && (
                    <CheckCircleOutlined className="text-emerald-500" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatDuration(track.trackTimeMillis)}</span>
                  {track.trackStatus && (
                    <Tag
                      color={STATUS_COLORS[track.trackStatus.status]}
                      className="!text-xs"
                    >
                      {track.trackStatus.status}
                    </Tag>
                  )}
                  {track.trackStatus?.starred && (
                    <Tag color="gold" className="!text-xs">
                      ติดดาว
                    </Tag>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    const searchQuery = `${track.trackName} ${track.artistName}`;
                    window.open(
                      `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        searchQuery
                      )}`,
                      "_blank"
                    );
                  }}
                  icon={<YoutubeOutlined className="!text-lg !text-red-500" />}
                />
                <Button
                  type={track.saved ? "default" : "primary"}
                  size="small"
                  icon={
                    track.saved ? <CheckCircleOutlined /> : <SaveOutlined />
                  }
                  onClick={() =>
                    handleSaveTrack(
                      track,
                      album.collectionName,
                      album.artworkUrl100
                    )
                  }
                  loading={savingTracks.has(track.trackId)}
                  disabled={track.saved}
                  className={
                    track.saved
                      ? ""
                      : "!bg-emerald-500 !shadow-sm !shadow-emerald-500/30 hover:!bg-emerald-600"
                  }
                >
                  {track.saved ? "บันทึกแล้ว" : "บันทึก"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          อัลบั้มจาก iTunes ({albums.length})
        </h2>
        <Tag color="blue" className="!rounded-full">
          Live from iTunes
        </Tag>
      </div>

      <Collapse
        accordion
        className="glass-surface border-none bg-white/90"
        items={collapseItems}
      />
    </div>
  );
}
