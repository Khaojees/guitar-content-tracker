'use client'

import { useState } from 'react'
import { Card, Button, Typography, Tag, Empty, message } from 'antd'
import {
  ThunderboltOutlined,
  StarFilled,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

const { Title, Paragraph, Text } = Typography

type RandomTrack = {
  id: number
  name: string
  status: 'idea' | 'ready' | 'recorded' | 'posted'
  duration: number | null
  artist: {
    id: number
    name: string
  }
  album: {
    name: string
    imageUrl?: string | null
  }
}

const STATUS_BADGE: Record<
  RandomTrack['status'],
  { label: string; className: string }
> = {
  idea: { label: 'Idea', className: 'bg-slate-100 text-slate-700' },
  ready: { label: 'Ready', className: 'bg-sky-100 text-sky-700' },
  recorded: { label: 'Recorded', className: 'bg-amber-100 text-amber-700' },
  posted: { label: 'Posted', className: 'bg-emerald-100 text-emerald-700' },
}

export default function RandomPage() {
  const [track, setTrack] = useState<RandomTrack | null>(null)
  const [loading, setLoading] = useState(false)

  const getRandomTrack = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/random-starred')
      const data = await response.json()
      if (response.ok && data.track) {
        setTrack(data.track as RandomTrack)
      } else {
        message.error(data.error || 'สุ่มเพลงไม่สำเร็จ')
      }
    } catch (error) {
      console.error('Random track error:', error)
      message.error('เกิดข้อผิดพลาดในการสุ่มเพลง')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-10">
      <section className="text-center space-y-3">
        <Title level={2} className="!mb-2 !text-slate-900">
          สุ่มแรงบันดาลใจจากเพลงที่คุณปักหมุด
        </Title>
        <Paragraph className="!mb-0 text-slate-600">
          กดสุ่มเพื่อเลือกเพลงที่อยากหยิบมาทำคอนเทนต์ในตอนนี้ทันที
          ระบบจะเลือกเฉพาะเพลงที่คุณปักดาวไว้แล้ว (สถานะ Idea และ Ready)
          เพื่อให้คุณโฟกัสกับคอนเทนต์ที่อยากผลักดันจริงๆ.
        </Paragraph>
      </section>

      <Card className="glass-surface mx-auto max-w-3xl border-none bg-white/90 text-center">
        <div className="flex flex-col gap-6">
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={getRandomTrack}
            loading={loading}
            className="mx-auto flex items-center gap-2 rounded-full px-8 text-base shadow-lg shadow-indigo-500/25 hover:-translate-y-[1px]"
          >
            {loading ? 'กำลังสุ่มเพลง...' : 'สุ่มเพลงจากลิสต์ที่ปักหมุด'}
          </Button>

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
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${STATUS_BADGE[track.status].className}`}
                  >
                    {STATUS_BADGE[track.status].label}
                  </span>
                  <Tag
                    icon={<StarFilled />}
                    color="gold"
                    className="!rounded-full !px-4 !py-1 text-sm font-semibold"
                  >
                    Starred
                  </Tag>
                  <Tag
                    icon={<ClockCircleOutlined />}
                    className="!rounded-full !px-4 !py-1 text-sm font-semibold"
                  >
                    {formatDuration(track.duration)}
                  </Tag>
                </div>

                <Link href={`/artists/${track.artist.id}`}>
                  <Button
                    type="default"
                    size="large"
                    icon={<EyeOutlined />}
                    className="rounded-full border-indigo-200 px-6 text-indigo-600 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700"
                  >
                    เปิดหน้าโปรไฟล์ศิลปิน
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            !loading && (
              <Empty
                description="ยังไม่มีเพลงที่สุ่มได้ ลองปักดาวเพลงที่อยากทำก่อนนะ"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          )}
        </div>
      </Card>
    </div>
  )
}
