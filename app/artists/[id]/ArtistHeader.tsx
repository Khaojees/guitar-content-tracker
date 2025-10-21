'use client'

import { useMemo, useState } from 'react'
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
  include: {
    albums: {
      include: {
        tracks: {
          include: {
            trackStatus: true
          }
        }
      }
    }
  }
}>

type Metric = {
  key: 'albums' | 'tracks' | 'important'
  label: string
  color: 'sky' | 'indigo' | 'emerald'
}

const METRIC_DEFINITIONS: Metric[] = [
  { key: 'albums', label: 'อัลบัมทั้งหมด', color: 'sky' },
  { key: 'tracks', label: 'เพลงทั้งหมด', color: 'indigo' },
  { key: 'important', label: 'เพลงสำคัญ', color: 'emerald' },
]

const METRIC_COLORS = {
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
} as const

export default function ArtistHeader({ artist }: { artist: ArtistWithLibrary }) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const importantTracks = useMemo(
    () =>
      artist.albums.flatMap((album) =>
        album.tracks.filter((track) => {
          const status = track.trackStatus?.status
          return status === 'recorded' || status === 'posted'
        })
      ),
    [artist.albums]
  )

  const metrics = useMemo(() => {
    const totals = {
      albums: artist.albums.length,
      tracks: artist.albums.reduce((sum, album) => sum + album.tracks.length, 0),
      important: importantTracks.length,
    }

    return METRIC_DEFINITIONS.map((metric) => ({
      ...metric,
      value: totals[metric.key],
    }))
  }, [artist.albums, importantTracks.length])

  const confirmDelete = () => {
    const baseOptions = {
      icon: <ExclamationCircleOutlined className="text-amber-500" />,
      okButtonProps: { danger: true, loading: deleting },
      width: 600,
      onOk: deleteArtist,
    }

    if (importantTracks.length > 0) {
      modal.confirm({
        ...baseOptions,
        title: 'ต้องการลบศิลปินคนนี้หรือไม่?',
        content: (
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              ศิลปิน <span className="font-semibold text-slate-900">{artist.name}</span>{' '}
              มีเพลงสำคัญอยู่ {importantTracks.length} เพลง หากลบข้อมูลจะหายทั้งหมด
            </p>
            <p>
              โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ เพราะการลบนี้จะลบเพลง สถานะ
              และบันทึกทุกอย่างที่เกี่ยวข้องกับศิลปินคนนี้
            </p>
          </div>
        ),
        okText: 'ลบศิลปินและข้อมูลทั้งหมด',
        cancelText: 'ยกเลิก',
      })
    } else {
      modal.confirm({
        ...baseOptions,
        title: 'ลบศิลปินออกจากระบบ',
        content: (
          <p className="text-sm text-slate-600">
            ศิลปิน {artist.name} ยังไม่มีเพลงสำคัญในระบบ หากลบแล้วสามารถเพิ่มใหม่ได้ในภายหลัง
          </p>
        ),
        okText: 'ลบศิลปิน',
        cancelText: 'ยกเลิก',
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
          <div className="flex gap-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/artists')}
              className="rounded-full border-slate-200 px-4"
            >
              กลับไปรายชื่อศิลปิน
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

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <MetricPill
                key={metric.key}
                label={metric.label}
                value={metric.value}
                color={metric.color}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'sky' | 'indigo' | 'emerald'
}) {
  const palette = METRIC_COLORS[color]

  return (
    <div
      className={`flex min-w-[110px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-center shadow-sm ${palette.bg}`}
    >
      <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-lg font-semibold ${palette.text}`}>{value}</span>
    </div>
  )
}
