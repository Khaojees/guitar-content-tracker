"use client";

import { useEffect, useState } from "react";
import { Card, Button, Spin, Empty } from "antd";
import {
  // SyncOutlined, // DISABLED: for Release Radar
  SearchOutlined,
  UserOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import PlaylistCard from "./components/PlaylistCard";

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  playlistTracks: Array<{
    track: {
      duration: number | null;
    };
  }>;
};

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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlist");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

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

      <Card
        title="Playlists ของฉัน"
        extra={
          <Link href="/playlists">
            <Button type="link">ดูทั้งหมด</Button>
          </Link>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : playlists.length === 0 ? (
          <Empty
            description="ยังไม่มี playlist"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link href="/playlists">
              <Button type="primary">สร้าง Playlist แรก</Button>
            </Link>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.slice(0, 6).map((playlist) => {
              const totalDuration = playlist.playlistTracks.reduce(
                (sum, pt) => sum + (pt.track.duration || 0),
                0
              );
              return (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  name={playlist.name}
                  description={playlist.description}
                  trackCount={playlist.playlistTracks.length}
                  totalDuration={totalDuration}
                />
              );
            })}
          </div>
        )}
      </Card>

      {/* TEMPORARILY DISABLED: Release Radar
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
      */}
    </div>
  );
}