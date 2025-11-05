"use client";

import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Collapse,
  Empty,
  Input,
  Segmented,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  StarFilled,
  StarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  YoutubeOutlined,
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { buildGuessSongText } from "@/lib/guessSongText";

type TrackStatusKey = "idea" | "ready" | "recorded" | "posted";

type SavedTrack = {
  id: number;
  name: string;
  albumName: string;
  duration: number | null;
  trackNumber: number | null;
  note: string;
  status: TrackStatusKey;
  starred: boolean;
  ignored: boolean;
  createdAt: string;
};

type SavedAlbum = {
  albumName: string;
  albumImage: string | null;
  tracks: SavedTrack[];
};

type ArtistSavedTracksByAlbumProps = {
  artistId: number;
  artistName: string;
};

const STATUS_CONFIG: Record<TrackStatusKey, { label: string; color: string }> =
  {
    idea: { label: "ไอเดีย", color: "default" },
    ready: { label: "พร้อมทำงาน", color: "blue" },
    recorded: { label: "อัดแล้ว", color: "orange" },
    posted: { label: "เผยแพร่แล้ว", color: "green" },
  };

const formatDuration = (ms: number | null) => {
  if (!ms) return "-";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function ArtistSavedTracksByAlbum({
  artistId,
  artistName,
}: ArtistSavedTracksByAlbumProps) {
  const { message, modal } = App.useApp();
  const [albums, setAlbums] = useState<SavedAlbum[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showIgnored, setShowIgnored] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTracks();
  }, [artistId]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/artist/${artistId}/tracks`);
      const data = await response.json();

      if (response.ok) {
        setAlbums(data.albums ?? []);
      } else {
        message.error(data.error || "ไม่สามารถโหลดเพลงที่บันทึกไว้ได้");
      }
    } catch (error) {
      console.error("Fetch saved tracks error:", error);
      message.error("ไม่สามารถโหลดเพลงที่บันทึกไว้ได้");
    } finally {
      setLoading(false);
    }
  };

  const setTrackUpdating = (trackId: number, updating: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (updating) {
        next.add(trackId);
      } else {
        next.delete(trackId);
      }
      return next;
    });
  };

  const updateTrackInState = (
    trackId: number,
    updater: (track: SavedTrack) => SavedTrack | null
  ) => {
    setAlbums((prev) =>
      prev
        .map((album) => {
          const updatedTracks = album.tracks
            .map((track) => (track.id === trackId ? updater(track) : track))
            .filter((track): track is SavedTrack => track !== null);

          return {
            ...album,
            tracks: updatedTracks,
          };
        })
        .filter((album) => album.tracks.length > 0)
    );
  };

  const handleStatusChange = async (
    track: SavedTrack,
    newStatus: TrackStatusKey
  ) => {
    setTrackUpdating(track.id, true);
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        message.error("ไม่สามารถเปลี่ยนสถานะได้");
        return;
      }

      updateTrackInState(track.id, (current) => ({
        ...current,
        status: newStatus,
      }));
      message.success("อัปเดตสถานะเรียบร้อย");
    } catch (error) {
      console.error("Update status error:", error);
      message.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setTrackUpdating(track.id, false);
    }
  };

  const handleToggleStar = async (track: SavedTrack) => {
    const newStarred = !track.starred;
    setTrackUpdating(track.id, true);
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starred: newStarred,
          ...(newStarred && { ignored: false }),
        }),
      });

      if (!response.ok) {
        message.error("ไม่สามารถเปลี่ยนสถานะติดดาวได้");
        return;
      }

      updateTrackInState(track.id, (current) => ({
        ...current,
        starred: newStarred,
        ignored: newStarred ? false : current.ignored,
      }));

      message.success(
        newStarred ? "เพิ่มเป็นเพลงติดดาวแล้ว" : "เอาออกจากเพลงติดดาวแล้ว"
      );
    } catch (error) {
      console.error("Toggle star error:", error);
      message.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะติดดาว");
    } finally {
      setTrackUpdating(track.id, false);
    }
  };

  const handleToggleIgnored = async (track: SavedTrack) => {
    const newIgnored = !track.ignored;
    setTrackUpdating(track.id, true);
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ignored: newIgnored,
          ...(newIgnored && { starred: false }),
        }),
      });

      if (!response.ok) {
        message.error("ไม่สามารถเปลี่ยนสถานะไม่สนใจได้");
        return;
      }

      updateTrackInState(track.id, (current) => ({
        ...current,
        ignored: newIgnored,
        starred: newIgnored ? false : current.starred,
      }));

      message.success(
        newIgnored
          ? "ย้ายเพลงไปที่รายการไม่สนใจแล้ว"
          : "นำเพลงออกจากรายการไม่สนใจแล้ว"
      );
    } catch (error) {
      console.error("Toggle ignored error:", error);
      message.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะไม่สนใจ");
    } finally {
      setTrackUpdating(track.id, false);
    }
  };

  const handleNoteChange = async (track: SavedTrack, note: string) => {
    setTrackUpdating(track.id, true);
    try {
      const response = await fetch(`/api/track/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        message.error("ไม่สามารถบันทึกโน้ตได้");
        return;
      }

      updateTrackInState(track.id, (current) => ({
        ...current,
        note,
      }));
      message.success("บันทึกโน้ตเรียบร้อย");
    } catch (error) {
      console.error("Update note error:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกโน้ต");
    } finally {
      setTrackUpdating(track.id, false);
    }
  };

  const handleDeleteTrack = (track: SavedTrack) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ลบเพลง "${track.name}" ออกจากระบบหรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: async () => {
        setTrackUpdating(track.id, true);
        try {
          const response = await fetch(`/api/track/${track.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            message.error("ไม่สามารถลบเพลงได้");
            return;
          }

          updateTrackInState(track.id, () => null);
          message.success("ลบเพลงเรียบร้อย");
        } catch (error) {
          console.error("Delete track error:", error);
          message.error("เกิดข้อผิดพลาดในการลบเพลง");
        } finally {
          setTrackUpdating(track.id, false);
        }
      },
    });
  };

  const handleCopyGuessText = async (track: SavedTrack) => {
    try {
      await navigator.clipboard.writeText(
        buildGuessSongText(track.name, artistName)
      );
      message.success("คัดลอกข้อความทายเพลงแล้ว");
    } catch (error) {
      console.error("Copy guess text error:", error);
      message.error("คัดลอกข้อความไม่สำเร็จ");
    }
  };

  const filteredAlbums = useMemo(() => {
    let filteredData = albums.map((album) => ({
      ...album,
      tracks: album.tracks.filter((track) => {
        // Filter by showIgnored
        if (!showIgnored && track.ignored) return false;

        // Filter by status/starred
        if (filter === "all") return true;
        if (filter === "starred") return track.starred;
        return track.status === filter;
      }),
    }));

    return filteredData.filter((album) => album.tracks.length > 0);
  }, [albums, filter, showIgnored]);

  const columns: ColumnsType<SavedTrack> = [
    {
      title: "เพลง",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 200,
      render: (name: string) => (
        <span className="font-medium text-gray-900">{name}</span>
      ),
    },
    {
      title: "อัลบั้ม",
      dataIndex: "albumName",
      key: "albumName",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "ความยาว",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number | null) => (
        <span className="font-mono text-sm text-gray-600">
          {formatDuration(duration)}
        </span>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: TrackStatusKey, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record, value)}
          size="small"
          style={{ width: 130 }}
          options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
        />
      ),
    },
    {
      title: "หมายเหตุ",
      dataIndex: "note",
      key: "note",
      width: 260,
      render: (_, record) => (
        <Input.TextArea
          value={record.note}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="บันทึกเพิ่มเติม..."
          onChange={(e) => {
            const value = e.target.value;
            setAlbums((prev) =>
              prev.map((album) => ({
                ...album,
                tracks: album.tracks.map((track) =>
                  track.id === record.id ? { ...track, note: value } : track
                ),
              }))
            );
          }}
          onBlur={(e) => {
            if (e.target.value !== record.note) {
              handleNoteChange(record, e.target.value);
            }
          }}
          onPressEnter={(e) => {
            e.currentTarget.blur();
          }}
        />
      ),
    },
    {
      title: "YouTube",
      key: "youtube",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => {
            const searchQuery = `${record.name} ${artistName}`;
            window.open(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(
                searchQuery
              )}`,
              "_blank"
            );
          }}
          icon={<YoutubeOutlined className="!text-lg !text-red-500" />}
        />
      ),
    },
    {
      title: "ติดดาว",
      key: "starred",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => handleToggleStar(record)}
          icon={
            record.starred ? (
              <StarFilled className="!text-lg !text-yellow-500" />
            ) : (
              <StarOutlined className="!text-lg !text-gray-300" />
            )
          }
        />
      ),
    },
    {
      title: "ไม่สนใจ",
      key: "ignored",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => handleToggleIgnored(record)}
          icon={
            record.ignored ? (
              <EyeInvisibleOutlined className="!text-lg !text-gray-500" />
            ) : (
              <EyeOutlined className="!text-lg !text-gray-300" />
            )
          }
        />
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          danger
          onClick={() => handleDeleteTrack(record)}
          icon={<DeleteOutlined />}
        />
      ),
    },
    {
      title: "",
      key: "copy",
      align: "center",
      render: (_, record) => (
        <Tooltip title="คัดลอกข้อความทายเพลง">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyGuessText(record)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className="glass-surface border-none bg-white/90">
        <div className="flex items-center justify-center gap-3 py-10">
          <Spin />
          <span className="text-sm text-slate-600">
            กำลังโหลดเพลงที่บันทึกไว้...
          </span>
        </div>
      </Card>
    );
  }

  if (albums.length === 0) {
    return (
      <Card className="glass-surface border-none bg-white/90">
        <Empty
          description="ยังไม่มีเพลงที่บันทึกไว้สำหรับศิลปินคนนี้"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button icon={<ReloadOutlined />} onClick={fetchTracks}>
            โหลดใหม่
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card className="glass-surface border-none bg-white/95">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">
              เพลงที่บันทึกไว้ (
              {filteredAlbums.reduce(
                (sum, album) => sum + album.tracks.length,
                0
              )}
              )
            </h3>
            <Button icon={<ReloadOutlined />} onClick={fetchTracks}>
              โหลดใหม่
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type={showIgnored ? "primary" : "default"}
              icon={showIgnored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => setShowIgnored(!showIgnored)}
              size="small"
              className="!self-start"
            >
              <span className="hidden sm:inline">
                {showIgnored ? "แสดงเพลงไม่สนใจ" : "ซ่อนเพลงไม่สนใจ"}
              </span>
              <span className="inline sm:hidden">
                {showIgnored ? "แสดง" : "ซ่อน"}ไม่สนใจ
              </span>
            </Button>
            <div className="overflow-x-auto">
              <Segmented
                value={filter}
                onChange={setFilter}
                size="small"
                options={[
                  { label: "ทั้งหมด", value: "all" },
                  { label: STATUS_CONFIG.idea.label, value: "idea" },
                  { label: STATUS_CONFIG.ready.label, value: "ready" },
                  { label: STATUS_CONFIG.recorded.label, value: "recorded" },
                  { label: STATUS_CONFIG.posted.label, value: "posted" },
                  { label: "ติดดาว", value: "starred" },
                ]}
              />
            </div>
          </div>
        </div>

        <Collapse
          accordion
          bordered={false}
          className="rounded-2xl bg-white/90 shadow"
          items={filteredAlbums.map((album) => ({
            key: album.albumName,
            label: (
              <div className="flex items-center gap-3">
                {album.albumImage && (
                  <img
                    src={album.albumImage}
                    alt={album.albumName}
                    className="h-12 w-12 rounded-lg object-cover shadow-sm"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {album.albumName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {album.tracks.length} เพลงที่บันทึกไว้
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {album.tracks.some((track) => track.starred) && (
                      <Tag color="gold" className="!rounded-full !text-xs">
                        มีเพลงติดดาว
                      </Tag>
                    )}
                    {album.tracks.some((track) => track.ignored) && (
                      <Tag color="default" className="!rounded-full !text-xs">
                        มีเพลงถูกซ่อน
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            ),
            children: (
              <Table<SavedTrack>
                dataSource={album.tracks}
                columns={columns}
                rowKey="id"
                pagination={false}
                loading={{
                  spinning: album.tracks.some((track) =>
                    updatingIds.has(track.id)
                  ),
                }}
                scroll={{ x: "max-content" }}
              />
            ),
          }))}
        />
      </div>
    </Card>
  );
}
