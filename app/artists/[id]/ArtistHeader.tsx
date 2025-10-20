'use client'

import { useState } from 'react'
import { App, Card, Button, Tag } from 'antd'
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'

type Artist = {
  id: number
  name: string
  imageUrl: string | null
  albums: {
    tracks: {
      id: number
      name: string
      trackStatus: {
        status: 'idea' | 'ready' | 'recorded' | 'posted'
      } | null
    }[]
  }[]
}

export default function ArtistHeader({ artist }: { artist: Artist }) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const importantTracks = artist.albums.flatMap((album) =>
    album.tracks.filter(
      (track) =>
        track.trackStatus?.status === 'recorded' ||
        track.trackStatus?.status === 'posted'
    )
  )

  const confirmDelete = () => {
    if (importantTracks.length > 0) {
      modal.confirm({
        title: 'ลบศิลปินที่มีเพลงสำคัญหรือไม่?',
        icon: <ExclamationCircleOutlined className="text-amber-500" />,
        content: (
          <div className="space-y-3">
            <p className="font-semibold text-slate-800">
              ศิลปิน <span className="text-indigo-600">"{artist.name}"</span>{' '}
              มีเพลงสำคัญ {importantTracks.length} เพลง:
            </p>
            <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-6 text-sm text-slate-600">
              {importantTracks.map((track) => (
                <li key={track.id} className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{track.name}</span>
                  <Tag
                    color={track.trackStatus?.status === 'posted' ? 'success' : 'warning'}
                    className="!rounded-full !px-2.5 !py-0.5 text-xs font-semibold uppercase"
                  >
                    {track.trackStatus?.status}
                  </Tag>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              หากยืนยัน เพลงทั้งหมดของศิลปินนี้รวมถึงข้อมูลสถานะจะถูกลบถาวร
              โปรดสำรองข้อมูลก่อนดำเนินการ
            </p>
          </div>
        ),
        okText: 'ลบศิลปินและเพลงทั้งหมด',
        cancelText: 'ยกเลิก',
        okButtonProps: { danger: true, loading: deleting },
        width: 620,
        onOk: deleteArtist,
      })
    } else {
      modal.confirm({
        title: 'ต้องการลบศิลปินนี้หรือไม่?',
        icon: <ExclamationCircleOutlined />,
        content: (
          <p className="text-sm text-slate-600">
            ศิลปิน "{artist.name}" จะถูกลบพร้อมอัลบั้มและเพลงทั้งหมดจำนวน{' '}
            {artist.albums.reduce((sum, album) => sum + album.tracks.length, 0)} เพลง
          </p>
        ),
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
        router.push('/artists')
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
    <Card className="glass-surface border-none bg-white/90">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {artist.imageUrl && (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="h-36 w-36 flex-none rounded-3xl object-cover shadow-lg shadow-indigo-500/20"
          />
        )}

        <div className="flex-1 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
                Artist Overview
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">{artist.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                สรุปความคืบหน้าของเพลงและอัลบั้มทั้งหมดจากศิลปินรายนี้
                เพื่อช่วยวางแผนคอนเทนต์ได้ง่ายและเห็นภาพรวมชัดเจน
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/artists')}
                className="rounded-full border-slate-200 px-4"
              >
                กลับหน้ารายชื่อศิลปิน
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleting}
                onClick={confirmDelete}
                className="rounded-full px-4"
              >
                ลบศิลปิน
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Tag className="!rounded-full !bg-sky-100 !px-4 !py-1 !text-sm !font-semibold !text-sky-700">
              อัลบั้ม {artist.albums.length}
            </Tag>
            <Tag className="!rounded-full !bg-indigo-100 !px-4 !py-1 !text-sm !font-semibold !text-indigo-700">
              เพลงทั้งหมด{' '}
              {artist.albums.reduce((sum, album) => sum + album.tracks.length, 0)}
            </Tag>
            <Tag className="!rounded-full !bg-emerald-100 !px-4 !py-1 !text-sm !font-semibold !text-emerald-700">
              เพลงสำคัญ {importantTracks.length}
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  )
}

