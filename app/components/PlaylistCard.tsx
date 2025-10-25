'use client'

import { Card, Tag } from 'antd'
import { UnorderedListOutlined, ClockCircleOutlined } from '@ant-design/icons'
import Link from 'next/link'

type PlaylistCardProps = {
  id: number
  name: string
  description?: string | null
  trackCount: number
  totalDuration?: number
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ชม.`
  }
  return `${minutes} นาที`
}

export default function PlaylistCard({
  id,
  name,
  description,
  trackCount,
  totalDuration,
}: PlaylistCardProps) {
  return (
    <Link href={`/playlists/${id}`}>
      <Card
        className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        styles={{ body: { padding: 20 } }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <UnorderedListOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{name}</h3>
                {description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Tag color="blue" className="!m-0">
              {trackCount} เพลง
            </Tag>
            {totalDuration && totalDuration > 0 && (
              <Tag icon={<ClockCircleOutlined />} className="!m-0">
                {formatDuration(totalDuration)}
              </Tag>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
