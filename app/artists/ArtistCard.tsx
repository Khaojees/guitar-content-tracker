'use client'

import { App, Card, Button, Tag } from 'antd'
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ArtistCardProps = {
  artist: {
    id: number
    name: string
    imageUrl: string | null
    albumsCount: number
    tracksCount: number
    importantTracksCount: number
  }
}

const STAT_LABELS = [
  { key: 'albumsCount', label: 'อัลบั้ม', accent: 'bg-sky-100 text-sky-700' },
  { key: 'tracksCount', label: 'เพลงทั้งหมด', accent: 'bg-indigo-100 text-indigo-700' },
] as const

export default function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = () => {
    if (artist.importantTracksCount > 0) {
      modal.confirm({
        title: 'ลบศิลปินที่มีเพลงสำคัญหรือไม่?',
        icon: <ExclamationCircleOutlined className="text-amber-500" />,
        content: (
          <div className="space-y-3">
            <p className="font-semibold text-slate-800">
              ศิลปิน <span className="text-indigo-600">"{artist.name}"</span>{' '}
              มีเพลงอยู่ในสถานะสำคัญจำนวน {artist.importantTracksCount} เพลง
            </p>
            <p className="text-sm text-slate-600">
              เมื่อลบแล้ว เพลง อัลบั้ม และบันทึกทั้งหมดจะถูกลบถาวร
              โปรดตรวจสอบก่อนดำเนินการ
            </p>
          </div>
        ),
        okText: 'ลบศิลปินและเพลงทั้งหมด',
        cancelText: 'ยกเลิก',
        okButtonProps: { danger: true, loading: deleting },
        onOk: deleteArtist,
      })
    } else {
      modal.confirm({
        title: 'ต้องการลบศิลปินนี้หรือไม่?',
        icon: <ExclamationCircleOutlined />,
        content: `ศิลปิน "${artist.name}" จะถูกลบพร้อมอัลบั้มและเพลงทั้งหมด `,
        okText: 'ลบศิลปิน',
        cancelText: 'ยกเลิก',
        okButtonProps: { danger: true, loading: deleting },
        onOk: deleteArtist,
      })
    }
  }

  const deleteArtist = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/artist/${artist.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        message.success('ลบศิลปินเรียบร้อยแล้ว')
        router.refresh()
      } else {
        message.error('ไม่สามารถลบศิลปินได้ กรุณาลองใหม่')
      }
    } catch (error) {
      console.error('Delete artist error:', error)
      message.error('เกิดข้อผิดพลาดในการลบศิลปิน')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card
      className="glass-surface h-full border-none bg-white/90 transition-all duration-300 hover:-translate-y-1"
      styles={{ body: { padding: 24 } }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          {artist.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="h-20 w-20 flex-none rounded-2xl object-cover shadow-lg shadow-indigo-500/15"
            />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-semibold text-white">
              {artist.name.slice(0, 2)}
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
                Artist Profile
              </p>
              <h3 className="text-xl font-bold text-slate-900">{artist.name}</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {STAT_LABELS.map((stat) => (
                <span
                  key={stat.key}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${stat.accent}`}
                >
                  {artist[stat.key]} {stat.label}
                </span>
              ))}
              <Tag
                color="magenta"
                className="!border-none !px-3 !py-1 text-xs font-semibold"
              >
                เพลงสำคัญ {artist.importantTracksCount}
              </Tag>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/artists/${artist.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-all hover:text-indigo-500"
          >
            ดูรายละเอียด
            <ArrowRightOutlined />
          </Link>

          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            loading={deleting}
            onClick={confirmDelete}
          >
            ลบศิลปิน
          </Button>
        </div>
      </div>
    </Card>
  )
}

