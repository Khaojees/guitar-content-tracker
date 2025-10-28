'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { App, Button, Input, Modal, Select, Spin, Table, Tag, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
  YoutubeOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

type TrackStatusKey = 'idea' | 'ready' | 'recorded' | 'posted'

type PlaylistTrack = {
  id: number
  track: {
    id: number
    name: string
    duration: number | null
    album: {
      name: string
      artist: {
        id: number
        name: string
      }
    }
    trackStatus: {
      status: string
      starred: boolean
      ignored: boolean
    } | null
  }
}

type Playlist = {
  id: number
  name: string
  description: string | null
  playlistTracks: PlaylistTrack[]
}

type AvailableTrack = {
  id: number
  name: string
  artistName: string
  albumName: string
}

const STATUS_CONFIG: Record<
  TrackStatusKey,
  { label: string; color: string }
> = {
  idea: { label: 'ไอเดีย', color: 'default' },
  ready: { label: 'พร้อมทำงาน', color: 'blue' },
  recorded: { label: 'อัดแล้ว', color: 'orange' },
  posted: { label: 'เผยแพร่แล้ว', color: 'green' },
}

const formatDuration = (ms: number | null) => {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [availableTracks, setAvailableTracks] = useState<AvailableTrack[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [showIgnored, setShowIgnored] = useState(false)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchPlaylist()
    }
  }, [resolvedParams])

  const fetchPlaylist = async () => {
    if (!resolvedParams) return

    try {
      const response = await fetch(`/api/playlist/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylist(data)
      } else if (response.status === 404) {
        message.error('ไม่พบ playlist')
        router.push('/playlists')
      }
    } catch (error) {
      console.error('Error fetching playlist:', error)
      message.error('ไม่สามารถโหลด playlist ได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTracks = async () => {
    try {
      const response = await fetch('/api/tracks')
      if (response.ok) {
        const data = await response.json()
        setAvailableTracks(
          data.map((track: any) => ({
            id: track.id,
            name: track.name,
            artistName: track.album.artist.name,
            albumName: track.album.name,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching available tracks:', error)
    }
  }

  const handleAddTrack = async () => {
    if (!selectedTrackId || !resolvedParams) return

    setAdding(true)
    try {
      const response = await fetch(`/api/playlist/${resolvedParams.id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: selectedTrackId }),
      })

      if (response.ok) {
        message.success('เพิ่มเพลงสำเร็จ')
        setIsAddModalOpen(false)
        setSelectedTrackId(null)
        fetchPlaylist()
      } else {
        const error = await response.json()
        message.error(error.error || 'ไม่สามารถเพิ่มเพลงได้')
      }
    } catch (error) {
      console.error('Error adding track:', error)
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveTrack = async (trackId: number) => {
    if (!resolvedParams) return

    try {
      const response = await fetch(
        `/api/playlist/${resolvedParams.id}/tracks?trackId=${trackId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        message.success('ลบเพลงสำเร็จ')
        fetchPlaylist()
      } else {
        message.error('ไม่สามารถลบเพลงได้')
      }
    } catch (error) {
      console.error('Error removing track:', error)
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const toggleStar = async (trackId: number, currentStarred: boolean) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      })

      if (response.ok) {
        message.success(
          !currentStarred
            ? 'ติดดาวเพลงนี้แล้ว'
            : 'ถอดดาวเพลงนี้แล้ว'
        )
        fetchPlaylist()
      } else {
        message.error('ไม่สามารถติดดาวได้')
      }
    } catch (error) {
      console.error('Toggle star error:', error)
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const toggleIgnored = async (trackId: number, currentIgnored: boolean) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignored: !currentIgnored }),
      })

      if (response.ok) {
        message.success(
          !currentIgnored
            ? 'ทำเครื่องหมายเพลงนี้เป็นไม่สนใจแล้ว'
            : 'เอาเพลงนี้ออกจากไม่สนใจเรียบร้อย'
        )
        fetchPlaylist()
      } else {
        message.error('ไม่สามารถเปลี่ยนสถานะไม่สนใจได้')
      }
    } catch (error) {
      console.error('Toggle ignored error:', error)
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const filteredTracks = useMemo(() => {
    if (!playlist) return []
    return playlist.playlistTracks.filter((pt) => {
      const ignored = pt.track.trackStatus?.ignored ?? false
      return showIgnored ? true : !ignored
    })
  }, [playlist, showIgnored])

  const updateStatus = async (trackId: number, newStatus: TrackStatusKey) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        message.success('เปลี่ยนสถานะเรียบร้อย')
        fetchPlaylist()
      } else {
        message.error('ไม่สามารถเปลี่ยนสถานะได้')
      }
    } catch (error) {
      console.error('Update status error:', error)
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const columns: ColumnsType<PlaylistTrack> = [
    {
      title: 'เพลง',
      dataIndex: ['track', 'name'],
      key: 'name',
      render: (name, record) => (
        <Link
          href={`/artists/${record.track.album.artist.id}`}
          className="font-medium text-gray-900 hover:text-indigo-600"
        >
          {name}
        </Link>
      ),
    },
    {
      title: 'ศิลปิน',
      dataIndex: ['track', 'album', 'artist', 'name'],
      key: 'artist',
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'อัลบัม',
      dataIndex: ['track', 'album', 'name'],
      key: 'album',
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'ความยาว',
      dataIndex: ['track', 'duration'],
      key: 'duration',
      render: (duration) => (
        <span className="font-mono text-sm text-gray-600">
          {formatDuration(duration)}
        </span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: ['track', 'trackStatus', 'status'],
      key: 'status',
      render: (status: string | undefined, record) => {
        const statusKey = (status || 'idea') as TrackStatusKey
        return (
          <Select
            value={statusKey}
            onChange={(value) => updateStatus(record.track.id, value)}
            size="small"
            style={{ width: 120 }}
            options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
          />
        )
      },
    },
    {
      title: 'YouTube',
      key: 'youtube',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => {
            const searchQuery = `${record.track.name} ${record.track.album.artist.name}`
            window.open(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
              '_blank'
            )
          }}
          icon={<YoutubeOutlined className="text-lg text-red-500" />}
        />
      ),
    },
    {
      title: 'สำคัญ',
      key: 'starred',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() =>
            toggleStar(
              record.track.id,
              record.track.trackStatus?.starred ?? false
            )
          }
          icon={
            record.track.trackStatus?.starred ? (
              <StarFilled className="text-lg text-yellow-500" />
            ) : (
              <StarOutlined className="text-lg text-gray-300" />
            )
          }
        />
      ),
    },
    {
      title: 'ไม่สนใจ',
      key: 'ignored',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() =>
            toggleIgnored(
              record.track.id,
              record.track.trackStatus?.ignored ?? false
            )
          }
          icon={
            record.track.trackStatus?.ignored ? (
              <EyeInvisibleOutlined className="text-lg text-gray-500" />
            ) : (
              <EyeOutlined className="text-lg text-gray-300" />
            )
          }
        />
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            modal.confirm({
              title: 'ยืนยันการลบ',
              content: `ลบเพลง "${record.track.name}" ออกจาก playlist?`,
              okText: 'ลบ',
              okButtonProps: { danger: true },
              cancelText: 'ยกเลิก',
              onOk: () => handleRemoveTrack(record.track.id),
            })
          }}
        />
      ),
    },
  ]

  if (loading || !playlist) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  const trackIdsInPlaylist = playlist.playlistTracks.map((pt) => pt.track.id)
  const filteredAvailableTracks = availableTracks.filter(
    (track) =>
      !trackIdsInPlaylist.includes(track.id) &&
      (searchTerm
        ? track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          track.artistName.toLowerCase().includes(searchTerm.toLowerCase())
        : true)
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/playlists')}
            size="small"
            className="self-start"
          >
            กลับ
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{playlist.name}</h1>
            {playlist.description && (
              <p className="mt-1 text-sm text-gray-600">{playlist.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {filteredTracks.length} เพลง
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type={showIgnored ? 'primary' : 'default'}
            icon={showIgnored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => setShowIgnored(!showIgnored)}
            size="small"
          >
            <span className="hidden sm:inline">{showIgnored ? 'แสดงเพลงไม่สนใจ' : 'ซ่อนเพลงไม่สนใจ'}</span>
            <span className="inline sm:hidden">{showIgnored ? 'แสดง' : 'ซ่อน'}ไม่สนใจ</span>
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              fetchAvailableTracks()
              setIsAddModalOpen(true)
            }}
            size="small"
          >
            เพิ่มเพลง
          </Button>
        </div>
      </div>

      {filteredTracks.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <Empty description="ยังไม่มีเพลงใน playlist">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                fetchAvailableTracks()
                setIsAddModalOpen(true)
              }}
            >
              เพิ่มเพลง
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <Table
            dataSource={filteredTracks}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
            }}
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}

      <Modal
        title="เพิ่มเพลงเข้า Playlist"
        open={isAddModalOpen}
        onOk={handleAddTrack}
        onCancel={() => {
          setIsAddModalOpen(false)
          setSelectedTrackId(null)
          setSearchTerm('')
        }}
        confirmLoading={adding}
        okText="เพิ่ม"
        cancelText="ยกเลิก"
        okButtonProps={{ disabled: !selectedTrackId }}
        width={600}
      >
        <div className="space-y-4 py-4">
          <Input.Search
            placeholder="ค้นหาเพลงหรือศิลปิน"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Select
            showSearch
            placeholder="เลือกเพลง"
            value={selectedTrackId}
            onChange={setSelectedTrackId}
            className="w-full"
            options={filteredAvailableTracks.map((track) => ({
              value: track.id,
              label: `${track.name} - ${track.artistName} (${track.albumName})`,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
      </Modal>
    </div>
  )
}
