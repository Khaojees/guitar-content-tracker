"use client";

import { Card, Button } from "antd";
import {
  SyncOutlined,
  SearchOutlined,
  UserOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    key: "search",
    href: "/search",
    title: "Search catalog",
    icon: SearchOutlined,
    color: "bg-blue-500",
  },
  {
    key: "artists",
    href: "/artists",
    title: "Artists",
    icon: UserOutlined,
    color: "bg-purple-500",
  },
  {
    key: "tracks",
    href: "/tracks",
    title: "Tracks",
    icon: UnorderedListOutlined,
    color: "bg-green-500",
  },
  {
    key: "random",
    href: "/random",
    title: "Random track",
    icon: ThunderboltOutlined,
    color: "bg-orange-500",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guitar Content Tracker</h1>
        <p className="mt-1 text-sm text-gray-600">
          Keep tabs on the songs, artists, and ideas you want to produce next. Use the shortcuts
          below or go straight to the sync dashboard for the latest releases.
        </p>
      </div>

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
                  <span className="text-sm font-medium text-gray-900">{action.title}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card title="Release Radar" extra={<SyncOutlined />}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Build a preview of new releases, choose exactly which tracks or albums to keep, and then
            import them into your library. You can also disable sync for artists you only follow
            casually.
          </p>

          <Link href="/sync">
            <Button type="primary" size="large" icon={<SyncOutlined />}>
              Open sync dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}