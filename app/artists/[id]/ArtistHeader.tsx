'use client'

import { useState } from 'react'
import Image from 'next/image'
import { App, Card, Button } from 'antd'
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { Prisma } from '@prisma/client'

type ArtistWithLibrary = Prisma.ArtistGetPayload<{
  select: {
    id: true
    name: true
    imageUrl: true
    itunesId: true
  }
}>

export default function ArtistHeader({ artist }: { artist: ArtistWithLibrary }) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = () => {
    modal.confirm({
      icon: <ExclamationCircleOutlined className="text-amber-500" />,
      okButtonProps: { danger: true, loading: deleting },
      width: 600,
      onOk: deleteArtist,
      title: 'ลบศิลปินออกจากระบบ',
      content: (
        <p className="text-sm text-slate-600">
          ต้องการลบศิลปิน "{artist.name}" และเพลงที่บันทึกไว้ทั้งหมดหรือไม่?
        </p>
      ),
      okText: 'ลบศิลปิน',
      cancelText: 'ยกเลิก',
    })
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
        message.error('ไม่สามารถลบศิลปินได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (error) {
      console.error('Delete artist error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างลบศิลปิน')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="glass-surface border-none bg-white/95">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md shadow-indigo-500/10 sm:h-24 sm:w-24">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                sizes="(min-width: 640px) 96px, 80px"
                className="rounded-2xl object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-slate-400">
                {artist.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">
                แผงข้อมูลศิลปิน
              </p>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                ID {artist.id}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {artist.name}
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              สรุปภาพรวมของเพลงและอัลบัมทั้งหมดของศิลปินคนนี้เพื่อช่วยวางแผนคอนเทนต์และติดตามความคืบหน้าได้ง่ายขึ้น
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-end">
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/artists')}
              className="rounded-full border-slate-200 px-3 sm:px-4"
              size="small"
            >
              <span className="hidden sm:inline">กลับไปรายชื่อศิลปิน</span>
              <span className="inline sm:hidden">กลับ</span>
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={confirmDelete}
              className="rounded-full px-3 sm:px-4"
              size="small"
            >
              ลบศิลปิน
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
