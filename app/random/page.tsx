"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Empty,
  Segmented,
  Select,
  Tooltip,
  App as AntApp,
} from "antd";
import {
  ThunderboltOutlined,
  StarFilled,
  StarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  YoutubeOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { buildGuessSongText } from "@/lib/guessSongText";

const { Title, Paragraph, Text } = Typography;

type RandomTrack = {
  id: number;
  name: string;
  status: "idea" | "ready" | "recorded" | "posted";
  duration: number | null;
  starred: boolean;
  ignored: boolean;
  artist: {
    id: number;
    name: string;
  };
  album: {
    name: string;
    imageUrl?: string | null;
  };
};

const STATUS_BADGE: Record<
  RandomTrack["status"],
  { label: string; className: string }
> = {
  idea: { label: "Idea", className: "bg-slate-100 text-slate-700" },
  ready: { label: "Ready", className: "bg-sky-100 text-sky-700" },
  recorded: { label: "Recorded", className: "bg-amber-100 text-amber-700" },
  posted: { label: "Posted", className: "bg-emerald-100 text-emerald-700" },
};

const STATUS_CONFIG: Record<
  RandomTrack["status"],
  { label: string; color: string }
> = {
  idea: { label: "ไอเดีย", color: "default" },
  ready: { label: "พร้อมทำงาน", color: "blue" },
  recorded: { label: "อัดแล้ว", color: "orange" },
  posted: { label: "เผยแพร่แล้ว", color: "green" },
};

function RandomPageContent() {
  const { modal, message: antMessage } = AntApp.useApp();
  const [track, setTrack] = useState<RandomTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"starred" | "all">("starred");

  const getRandomTrack = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/random-starred?mode=${mode}`);
      const data = await response.json();
      if (response.ok && data.track) {
        setTrack(data.track as RandomTrack);
      } else {
        antMessage.error(data.error || "สุ่มเพลงไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Random track error:", error);
      antMessage.error("เกิดข้อผิดพลาดในการสุ่มเพลง");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: RandomTrack["status"]) => {
    if (!track) return;

    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTrack({ ...track, status: newStatus });
        antMessage.success("เปลี่ยนสถานะเรียบร้อย");
      } else {
        antMessage.error("ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch (error) {
      console.error("Update status error:", error);
      antMessage.error("เกิดข้อผิดพลาด");
    }
  };

  const toggleStar = async () => {
    if (!track) return;

    const newStarred = !track.starred;
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });

      if (response.ok) {
        setTrack({
          ...track,
          starred: newStarred,
          ...(newStarred && { ignored: false }),
        });
        antMessage.success(
          newStarred ? "ติดดาวเพลงนี้แล้ว" : "ถอดดาวเพลงนี้แล้ว"
        );
      } else {
        antMessage.error("ไม่สามารถติดดาวได้");
      }
    } catch (error) {
      console.error("Toggle star error:", error);
      antMessage.error("เกิดข้อผิดพลาดระหว่างติดดาว");
    }
  };

  const toggleIgnored = async () => {
    if (!track) return;

    const newIgnored = !track.ignored;
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ignored: newIgnored,
          ...(newIgnored && { starred: false }),
        }),
      });

      if (response.ok) {
        setTrack({
          ...track,
          ignored: newIgnored,
          ...(newIgnored && { starred: false }),
        });
        antMessage.success(
          newIgnored
            ? "ทำเครื่องหมายเพลงนี้เป็นไม่สนใจแล้ว"
            : "เอาเพลงนี้ออกจากไม่สนใจเรียบร้อย"
        );
      } else {
        antMessage.error("ไม่สามารถเปลี่ยนสถานะไม่สนใจได้");
      }
    } catch (error) {
      console.error("Toggle ignored error:", error);
      antMessage.error("เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะไม่สนใจ");
    }
  };

  const handleCopyGuessText = async () => {
    if (!track) return;

    try {
      await navigator.clipboard.writeText(
        buildGuessSongText(track.name, track.artist.name)
      );
      antMessage.success("Copied guess text to clipboard");
    } catch (error) {
      console.error("Copy guess text error:", error);
      antMessage.error("Unable to copy guess text");
    }
  };

  const handleDelete = async () => {
    if (!track) return;

    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ลบเพลง "${track.name}" ออกจากระบบ?`,
      okText: "ลบ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const response = await fetch(`/api/track/${track.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            antMessage.success("ลบเพลงเรียบร้อย");
            setTrack(null); // Clear the track after deletion
          } else {
            antMessage.error("ไม่สามารถลบเพลงได้");
          }
        } catch (error) {
          console.error("Delete track error:", error);
          antMessage.error("เกิดข้อผิดพลาดระหว่างลบเพลง");
        }
      },
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-3">
        <Title level={2} className="!mb-2 !text-slate-900">
          {mode === "starred"
            ? "สุ่มแรงบันดาลใจจากเพลงที่คุณติดดาว"
            : "สุ่มเพลงจากทุกเพลงในระบบ"}
        </Title>
        <Paragraph className="!mb-0 text-slate-600">
          {mode === "starred"
            ? "กดสุ่มเพื่อเลือกเพลงที่อยากหยิบมาทำคอนเทนต์ในตอนนี้ทันที ระบบจะเลือกเฉพาะเพลงที่คุณปักดาวไว้แล้ว (สถานะ Idea และ Ready) เพื่อให้คุณโฟกัสกับคอนเทนต์ที่อยากผลักดันจริงๆ"
            : "สุ่มเพลงจากทุกเพลงที่มีในระบบ ไม่ว่าจะมีสถานะหรือติดดาวหรือไม่ก็ตาม"}
        </Paragraph>
      </section>

      <Card className="glass-surface mx-auto max-w-3xl border-none bg-white/90 text-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 items-center">
            <Segmented
              value={mode}
              onChange={(value) => {
                setMode(value as "starred" | "all");
                setTrack(null); // Clear current track when switching modes
              }}
              options={[
                { label: "เพลงติดดาว", value: "starred" },
                { label: "ทุกเพลง", value: "all" },
              ]}
              size="large"
            />
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={getRandomTrack}
              loading={loading}
              className="!flex !items-center !gap-2 !rounded-full !px-8 !text-base !shadow-lg !shadow-indigo-500/25 hover:!-translate-y-[1px]"
            >
              {loading
                ? "กำลังสุ่มเพลง..."
                : mode === "starred"
                ? "สุ่มเพลงจากลิสต์ที่ติดดาว"
                : "สุ่มเพลงจากทุกเพลง"}
            </Button>
          </div>

          {track ? (
            <Card className="border-none bg-gradient-to-br from-indigo-50 via-white to-purple-50">
              <div className="flex flex-col items-center gap-6">
                {track.album.imageUrl && (
                  <img
                    src={track.album.imageUrl}
                    alt={track.album.name}
                    className="h-64 w-64 rounded-3xl object-cover shadow-xl shadow-indigo-500/20"
                  />
                )}

                <div className="space-y-2 text-center">
                  <Title level={2} className="!mb-0 text-slate-900">
                    {track.name}
                  </Title>
                  <Text className="block text-lg font-semibold text-indigo-600">
                    {track.artist.name}
                  </Text>
                  <Text className="text-sm uppercase tracking-[0.4em] text-slate-400">
                    {track.album.name}
                  </Text>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Select
                    value={track.status}
                    onChange={(value) => updateStatus(value)}
                    size="middle"
                    style={{ width: 150 }}
                    options={Object.entries(STATUS_CONFIG).map(
                      ([key, config]) => ({
                        value: key,
                        label: config.label,
                      })
                    )}
                  />
                  <Tag
                    icon={<ClockCircleOutlined />}
                    className="!rounded-full !px-4 !py-1 text-sm font-semibold"
                  >
                    {formatDuration(track.duration)}
                  </Tag>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Tooltip title={track.starred ? "ถอดดาว" : "ติดดาว"}>
                    <Button
                      type="text"
                      onClick={toggleStar}
                      icon={
                        track.starred ? (
                          <StarFilled className="!text-lg !text-yellow-500" />
                        ) : (
                          <StarOutlined className="!text-lg !text-gray-300" />
                        )
                      }
                    />
                  </Tooltip>

                  <Tooltip
                    title={
                      track.ignored
                        ? "เอาออกจากไม่สนใจ"
                        : "ทำเครื่องหมายไม่สนใจ"
                    }
                  >
                    <Button
                      type="text"
                      onClick={toggleIgnored}
                      icon={
                        track.ignored ? (
                          <EyeInvisibleOutlined className="!text-lg !text-gray-500" />
                        ) : (
                          <EyeOutlined className="!text-lg !text-gray-300" />
                        )
                      }
                    />
                  </Tooltip>

                  <Tooltip title="ค้นหาใน YouTube">
                    <Button
                      type="text"
                      onClick={() => {
                        const searchQuery = `${track.name} ${track.artist.name}`;
                        window.open(
                          `https://www.youtube.com/results?search_query=${encodeURIComponent(
                            searchQuery
                          )}`,
                          "_blank"
                        );
                      }}
                      icon={
                        <YoutubeOutlined className="!text-lg !text-red-500" />
                      }
                    />
                  </Tooltip>

                  <Tooltip title="คัดลอกข้อความทายเพลง">
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={handleCopyGuessText}
                    />
                  </Tooltip>

                  <Tooltip title="ลบเพลง">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDelete}
                    />
                  </Tooltip>
                </div>

                <Link href={`/artists/${track.artist.id}`}>
                  <Button
                    type="default"
                    size="large"
                    icon={<EyeOutlined />}
                    className="!rounded-full !border-indigo-200 !px-6 !text-indigo-600 !shadow-sm !transition-colors hover:!border-indigo-300 hover:!text-indigo-700"
                  >
                    เปิดหน้าโปรไฟล์ศิลปิน
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            !loading && (
              <Empty
                description={
                  mode === "starred"
                    ? "ยังไม่มีเพลงที่สุ่มได้ ลองปักดาวเพลงที่อยากทำก่อนนะ"
                    : "ยังไม่มีเพลงในระบบ"
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          )}
        </div>
      </Card>
    </div>
  );
}

export default function RandomPage() {
  return (
    <AntApp>
      <RandomPageContent />
    </AntApp>
  );
}
