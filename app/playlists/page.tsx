"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, Empty, Input, Modal, Spin } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import PlaylistCard from "../components/PlaylistCard";

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

export default function PlaylistsPage() {
  const router = useRouter();
  const { modal, message } = App.useApp();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      message.error("ไม่สามารถโหลด playlist ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlaylist(null);
    setFormName("");
    setFormDescription("");
    setIsModalOpen(true);
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormName(playlist.name);
    setFormDescription(playlist.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      message.error("กรุณาใส่ชื่อ playlist");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingPlaylist
        ? `/api/playlist/${editingPlaylist.id}`
        : "/api/playlist";
      const method = editingPlaylist ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
        }),
      });

      if (response.ok) {
        message.success(
          editingPlaylist ? "แก้ไข playlist สำเร็จ" : "สร้าง playlist สำเร็จ"
        );
        setIsModalOpen(false);
        fetchPlaylists();
      } else {
        message.error("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving playlist:", error);
      message.error("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (playlist: Playlist) => {
    modal.confirm({
      title: "ยืนยันการลบ playlist",
      content: `คุณต้องการลบ playlist "${playlist.name}" ใช่หรือไม่?`,
      okText: "ลบ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          const response = await fetch(`/api/playlist/${playlist.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("ลบ playlist สำเร็จ");
            fetchPlaylists();
          } else {
            message.error("ไม่สามารถลบ playlist ได้");
          }
        } catch (error) {
          console.error("Error deleting playlist:", error);
          message.error("เกิดข้อผิดพลาด");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playlists</h1>
          <p className="mt-1 text-sm text-gray-600">
            จัดการกลุ่มเพลงเพื่อวางแผนการทำคอนเทนต์
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          สร้าง Playlist
        </Button>
      </div>

      {playlists.length === 0 ? (
        <Card>
          <Empty
            description="ยังไม่มี playlist"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              สร้าง Playlist แรก
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => {
            const totalDuration = playlist.playlistTracks.reduce(
              (sum, pt) => sum + (pt.track.duration || 0),
              0
            );
            return (
              <div key={playlist.id} className="relative group">
                <PlaylistCard
                  id={playlist.id}
                  name={playlist.name}
                  description={playlist.description}
                  trackCount={playlist.playlistTracks.length}
                  totalDuration={totalDuration}
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(playlist);
                    }}
                    className="!bg-white !shadow-sm"
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(playlist);
                    }}
                    className="!bg-white !shadow-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={editingPlaylist ? "แก้ไข Playlist" : "สร้าง Playlist ใหม่"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingPlaylist ? "บันทึก" : "สร้าง"}
        cancelText="ยกเลิก"
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ชื่อ Playlist <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="เช่น เพลงสากล, เพลงไทย, เพลงอีสาน"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onPressEnter={handleSubmit}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              คำอธิบาย (ไม่บังคับ)
            </label>
            <Input.TextArea
              placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
