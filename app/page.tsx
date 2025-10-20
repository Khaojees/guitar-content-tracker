"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Button,
  Alert,
  Typography,
  List,
  Tag,
  Space,
} from "antd";
import {
  SyncOutlined,
  SearchOutlined,
  UserOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  CompassOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Paragraph, Text } = Typography;

type SyncResult =
  | {
      count?: number;
      newTracks?: Array<{
        artist: string;
        album: string;
        tracks: string[];
      }>;
      error?: never;
    }
  | { error: string };

const shortcutCards = [
  {
    key: "search",
    href: "/search",
    title: "ค้นหาเพลง & ศิลปิน",
    description:
      "สำรวจฐานข้อมูล iTunes เพื่อดึงศิลปิน อัลบั้ม และเพลงใหม่เข้ามาจัดการในระบบของคุณ",
    icon: <SearchOutlined />,
    accent: "from-sky-400 to-indigo-500",
  },
  {
    key: "artists",
    href: "/artists",
    title: "จัดการศิลปิน",
    description:
      "ดูสรุปรายศิลปิน อัลบั้ม และสถานะเพลงที่ต้องดูแลในแต่ละโปรเจ็กต์อย่างเป็นระบบ",
    icon: <UserOutlined />,
    accent: "from-rose-400 to-pink-500",
  },
  {
    key: "tracks",
    href: "/tracks",
    title: "ภาพรวมเพลงทั้งหมด",
    description:
      "ติดตามสถานะไอเดียเพลงตั้งแต่เริ่มต้นจนปล่อยจริง พร้อมข้อมูลครบถ้วนในหน้าเดียว",
    icon: <UnorderedListOutlined />,
    accent: "from-amber-400 to-orange-500",
  },
  {
    key: "random",
    href: "/random",
    title: "สุ่มแรงบันดาลใจ",
    description:
      "เจาะจงเพลงที่ปักหมุดไว้เพื่อสุ่มทำคอนเทนต์ทันที คงความสดใหม่ของไอเดียเสมอ",
    icon: <ThunderboltOutlined />,
    accent: "from-emerald-400 to-teal-500",
  },
];

const heroHighlights = [
  "วางแผนคอนเทนต์กีตาร์ได้ครบลูป: idea → ready → recorded → posted",
  "ดึงข้อมูลศิลปินและเพลงจาก iTunes ได้ในคลิกเดียว",
  "สรุปสถานะเพลงสำคัญและปล่อยคอนเทนต์ได้ทันตามกำหนด",
];

export default function HomePage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/sync-all", {
        method: "POST",
      });
      const data = (await response.json()) as SyncResult;
      setSyncResult(data);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncResult({ error: "ซิงก์ข้อมูลจาก Release Radar ไม่สำเร็จ" });
    } finally {
      setSyncing(false);
    }
  };

  const shortcutGrid = useMemo(
    () =>
      shortcutCards.map((card) => (
        <Link key={card.key} href={card.href} className="block h-full">
          <Card
            hoverable
            className="glass-surface h-full border-none bg-white/80 transition-all duration-300 hover:-translate-y-2"
            styles={{ body: { padding: 24 } }}
          >
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-lg text-white shadow-lg`}
            >
              {card.icon}
            </span>
            <Title level={4} className="!mt-5 !mb-3 !text-slate-900">
              {card.title}
            </Title>
            <Paragraph className="!mb-0 text-sm text-slate-600">
              {card.description}
            </Paragraph>
          </Card>
        </Link>
      )),
    []
  );

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-500/95 to-purple-500 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Tag
              color="default"
              className="!border-white/40 !bg-white/15 !px-4 !py-2 !text-xs !font-semibold !uppercase !tracking-[0.35em] !text-white/90"
            >
              Guitar Workflow OS
            </Tag>
            <Title level={1} className="!mb-4 !text-4xl sm:!text-5xl !text-white">
              วางแผนคอนเทนต์กีตาร์ครบในที่เดียว
            </Title>
            <Paragraph className="max-w-2xl text-lg text-indigo-50/90">
              เก็บแรงบันดาลใจ อัปเดตสถานะเพลง และซิงก์ Release Radar
              เพื่อไม่พลาดโมเมนต์สำคัญในการปล่อยคอนเทนต์.
              ระบบออกแบบให้พร้อมใช้งานทั้งในสตูดิโอและช่วงเตรียมโพสต์.
            </Paragraph>
            <ul className="space-y-3 text-indigo-50/90">
              {heroHighlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-3 text-base leading-relaxed"
                >
                  <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-sm">
                    <CheckCircleOutlined />
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card
            title={
              <div className="flex items-center gap-2 text-indigo-900">
                <SyncOutlined />
                Release Radar
              </div>
            }
            className="glass-surface border-none bg-white/95 text-slate-900"
          >
            <Paragraph className="!mb-6 text-sm text-slate-600">
              ซิงก์เพลงใหม่จาก Spotify Release Radar
              เพื่อไม่พลาดเพลงที่ต้องต่อยอดเป็นคอนเทนต์ในสัปดาห์นี้.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              block
              icon={<SyncOutlined spin={syncing} />}
              onClick={handleSync}
              loading={syncing}
            >
              {syncing ? "กำลังซิงก์ข้อมูล..." : "ซิงก์ Release Radar"}
            </Button>

            {syncResult && (
              <div className="mt-5 space-y-3">
                {"error" in syncResult ? (
                  <Alert
                    message={syncResult.error}
                    type="error"
                    showIcon
                    className="border-red-100 bg-red-50/80 text-red-700"
                  />
                ) : (
                  <>
                    <Alert
                      type="success"
                      showIcon
                      message={
                        <Space>
                          <CheckCircleOutlined className="text-emerald-500" />
                          <span className="font-semibold text-emerald-600">
                            ซิงก์สำเร็จ
                          </span>
                        </Space>
                      }
                      description={
                        <div className="text-sm text-slate-600">
                          ดึงเพลงเข้าระบบ {syncResult.count ?? 0} เพลง
                          พร้อมรายละเอียดอัลบั้มและศิลปิน
                        </div>
                      }
                      className="border-emerald-100 bg-emerald-50/80 text-slate-700"
                    />

                    {syncResult.newTracks &&
                      syncResult.newTracks.length > 0 && (
                        <Card
                          size="small"
                          className="border border-slate-200/70 bg-slate-50/60"
                          styles={{
                            body: { padding: 16 },
                          }}
                        >
                          <List
                            size="small"
                            dataSource={syncResult.newTracks}
                            renderItem={(item) => (
                              <List.Item>
                                <div className="space-y-1">
                                  <Text strong className="text-slate-900">
                                    {item.artist}
                                  </Text>
                                  <div className="text-xs uppercase tracking-[0.28em] text-indigo-400">
                                    {item.album}
                                  </div>
                                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {item.tracks.map((track) => (
                                      <li key={track} className="flex items-center gap-2">
                                        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-300" />
                                        {track}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      )}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {shortcutGrid}
      </section>

      <section className="glass-surface grid gap-10 rounded-3xl bg-white/90 p-8 lg:grid-cols-2 lg:p-12">
        <div className="space-y-4">
          <Title level={3} className="!mb-2 !text-slate-900">
            โฟลว์การทำงานที่ออกแบบมาสำหรับกีตาร์ฮีโร่
          </Title>
          <Paragraph className="text-base text-slate-600">
            จัดการทุกสถานะของเพลงได้อย่างใจ
            ตั้งแต่การจดไอเดียแบบรวดเร็ว ไปจนถึงการเก็บหลักฐานการโพสต์
            พร้อมจดจำเพลงที่สำคัญที่สุดของคุณ.
          </Paragraph>

          <div className="grid gap-4">
            <Card
              size="small"
              className="border-none bg-indigo-50/70"
              title={
                <Space className="text-indigo-700">
                  <CompassOutlined />
                  เส้นทางเพลงแต่ละไอเดีย
                </Space>
              }
            >
              <Paragraph className="!mb-0 text-sm text-indigo-900/80">
                เดินทางผ่านสถานะ <strong>Idea → Ready → Recorded → Posted</strong>{" "}
                พร้อมเลือกปักหมุดเพลงที่ต้องกลับมาทำซ้ำได้ในคลิกเดียว.
              </Paragraph>
            </Card>

            <Card
              size="small"
              className="border-none bg-amber-50/70"
              title={
                <Space className="text-amber-700">
                  <ThunderboltOutlined />
                  ฟีเจอร์สุ่มแรงบันดาลใจ
                </Space>
              }
            >
              <Paragraph className="!mb-0 text-sm text-amber-900/80">
                เลือกเพลงที่คุณปักดาวไว้ เพื่อสุ่มทำคอนเทนต์เวลาต้องการพลังงานเร่งด่วน
                พร้อมข้อมูลศิลปินและอัลบั้มครบถ้วน.
              </Paragraph>
            </Card>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <Title level={4} className="!mb-4 !text-white">
              โฟกัสแค่การเล่นกีตาร์ ที่เหลือระบบจัดให้
            </Title>
            <Paragraph className="text-sm text-slate-200">
              เชื่อมโยงข้อมูลจาก Spotify กับฐานข้อมูลของคุณ
              พร้อมไกด์ลิสต์ที่คอยเตือนว่าช่วงนี้ควรทำเพลงไหนต่อ
              เพื่อให้คอนเทนต์ออกอย่างสม่ำเสมอ.
            </Paragraph>
          </Card>

          <Card className="border-none bg-white/85">
            <Title level={4} className="!mb-3 !text-slate-900">
              บทสรุปเร็วๆ นี้
            </Title>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  1
                </span>
                ดึงศิลปินจาก iTunes แล้วเลือกเพลงที่ต้องการติดตาม
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  2
                </span>
                อัปเดตสถานะเพลงเมื่อซ้อม อัด หรือโพสต์เสร็จเรียบร้อย
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  3
                </span>
                เปิดโหมดสุ่มเพื่อเลือกเพลงที่จะปล่อยคอนเทนต์ต่อไป
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

