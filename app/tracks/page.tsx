import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Table, Tag, Empty, Button } from 'antd'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  idea: { label: 'Idea', color: 'default' },
  ready: { label: 'Ready', color: 'blue' },
  recorded: { label: 'Recorded', color: 'orange' },
  posted: { label: 'Posted', color: 'green' },
}

type TrackData = {
  id: number
  name: string
  artistName: string
  artistId: number
  albumName: string
  duration: number | null
  status: keyof typeof STATUS_CONFIG
  starred: boolean
}

export default async function TracksPage() {
  const tracks = await prisma.track.findMany({
    include: {
      album: {
        include: {
          artist: true,
        },
      },
      trackStatus: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const dataSource: TrackData[] = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artistName: track.album.artist.name,
    artistId: track.album.artist.id,
    albumName: track.album.name,
    duration: track.duration,
    status: (track.trackStatus?.status as keyof typeof STATUS_CONFIG) || 'idea',
    starred: track.trackStatus?.starred || false,
  }))

  const columns: ColumnsType<TrackData> = [
    {
      title: 'เพลง',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Link
          href={`/artists/${record.artistId}`}
          className="font-medium text-gray-900 hover:text-indigo-600"
        >
          {name}
        </Link>
      ),
    },
    {
      title: 'ศิลปิน',
      dataIndex: 'artistName',
      key: 'artistName',
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'อัลบั้ม',
      dataIndex: 'albumName',
      key: 'albumName',
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'ความยาว',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => (
        <span className="font-mono text-sm text-gray-600">
          {formatDuration(duration)}
        </span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof STATUS_CONFIG) => {
        const config = STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'ปักหมุด',
      dataIndex: 'starred',
      key: 'starred',
      align: 'center',
      render: (starred) =>
        starred ? (
          <StarFilled className="text-lg text-yellow-500" />
        ) : (
          <StarOutlined className="text-lg text-gray-300" />
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">เพลงทั้งหมด</h1>
        <p className="mt-1 text-sm text-gray-600">
          รวม {tracks.length} เพลง
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <Empty description="ยังไม่มีเพลง" />
            <Link href="/search">
              <Button type="primary" className="mt-4">
                เริ่มค้นหาเพลง
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
              showTotal: (total) => `ทั้งหมด ${total} เพลง`,
            }}
          />
        </div>
      )}
    </div>
  )
}
