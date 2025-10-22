"use client";

import { useState } from "react";
import { Card, Button, Alert, Statistic, Row, Col } from "antd";
import {
  SyncOutlined,
  SearchOutlined,
  UserOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";

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

const QUICK_ACTIONS = [
  {
    key: "search",
    href: "/search",
    title: "ค้นหาเพลง",
    icon: SearchOutlined,
    color: "bg-blue-500",
  },
  {
    key: "artists",
    href: "/artists",
    title: "ศิลปิน",
    icon: UserOutlined,
    color: "bg-purple-500",
  },
  {
    key: "tracks",
    href: "/tracks",
    title: "เพลงทั้งหมด",
    icon: UnorderedListOutlined,
    color: "bg-green-500",
  },
  {
    key: "random",
    href: "/random",
    title: "สุ่มเพลง",
    icon: ThunderboltOutlined,
    color: "bg-orange-500",
  },
];

export default function HomePage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/sync-all", { method: "POST" });
      const data = (await response.json()) as SyncResult;
      setSyncResult(data);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncResult({ error: "ซิงก์ข้อมูลไม่สำเร็จ" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="mt-1 text-sm text-gray-600">จัดการคอนเทนต์กีตาร์ของคุณ</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.key} href={action.href}>
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                styles={{ body: { padding: 20 } }}
              >
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${action.color} text-white`}
                  >
                    <Icon className="text-xl" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {action.title}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Sync Section */}
      <Card title="ซิงก์เพลงใหม่" extra={<SyncOutlined />}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            อัปเดตอัลบั้มและเพลงใหม่จากศิลปินที่คุณติดตามใน iTunes
            เพื่อไม่พลาดเพลงที่ต้องทำคอนเทนต์
          </p>

          <Button
            type="primary"
            size="large"
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
          >
            {syncing ? "กำลังซิงก์..." : "ซิงก์ตอนนี้"}
          </Button>

          {syncResult && (
            <div className="mt-4">
              {"error" in syncResult ? (
                <Alert message={syncResult.error} type="error" showIcon />
              ) : (
                <Alert
                  message={`ซิงก์สำเร็จ: ${syncResult.count || 0} เพลง`}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Info Section */}
      {/* <Card title="การใช้งาน">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="mt-0.5 text-indigo-600" />
            <span>ค้นหาและเพิ่มศิลปินจาก iTunes</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="mt-0.5 text-indigo-600" />
            <span>จัดการสถานะเพลง: Idea → Ready → Recorded → Posted</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="mt-0.5 text-indigo-600" />
            <span>ปักหมุดเพลงที่สำคัญและสุ่มเพื่อทำคอนเทนต์</span>
          </div>
        </div>
      </Card> */}
    </div>
  );
}
