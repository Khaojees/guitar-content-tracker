'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { App, Button, Empty, Input, Segmented, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StarFilled, StarOutlined } from '@ant-design/icons'

export type TrackStatusKey = 'idea' | 'ready' | 'recorded' | 'posted'

export type TrackRow = {
  id: number
  name: string
  artistName: string
  artistId: number
  albumName: string
  duration: number | null
  status: TrackStatusKey
  starred: boolean
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

const STATUS_FILTERS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: STATUS_CONFIG.idea.label, value: 'idea' },
  { label: STATUS_CONFIG.ready.label, value: 'ready' },
  { label: STATUS_CONFIG.recorded.label, value: 'recorded' },
  { label: STATUS_CONFIG.posted.label, value: 'posted' },
  { label: 'เพลงสำคัญ', value: 'starred' },
] as const

const formatDuration = (ms: number | null) => {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

type TracksTableProps = {
  tracks: TrackRow[]
}

export default function TracksTable({ tracks }: TracksTableProps) {
  const { message } = App.useApp()
  const [rows, setRows] = useState(tracks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    (typeof STATUS_FILTERS)[number]['value']
  >('all')

  useEffect(() => {
    setRows(tracks)
  }, [tracks])

  const filteredTracks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return rows.filter((track) => {
      const matchesSearch = normalizedSearch
        ? track.name.toLowerCase().includes(normalizedSearch) ||
          track.artistName.toLowerCase().includes(normalizedSearch) ||
          track.albumName.toLowerCase().includes(normalizedSearch)
        : true

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'starred'
          ? track.starred
          : track.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [rows, searchTerm, statusFilter])

  const toggleStar = async (track: TrackRow) => {
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !track.starred }),
      })

      if (!response.ok) {
        message.error('ไม่สามารถเปลี่ยนสถานะเพลงสำคัญได้')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === track.id ? { ...row, starred: !track.starred } : row
        )
      )
      message.success(
        !track.starred
          ? 'ปักหมุดเพลงนี้เป็นเพลงสำคัญแล้ว'
          : 'เอาเพลงนี้ออกจากเพลงสำคัญเรียบร้อย'
      )
    } catch (error) {
      console.error('Toggle star error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะเพลงสำคัญ')
    }
  }

  const columns: ColumnsType<TrackRow> = [
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
      title: 'อัลบัม',
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
      render: (status: TrackStatusKey) => {
        const config = STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'เพลงสำคัญ',
      dataIndex: 'starred',
      key: 'starred',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => toggleStar(record)}
          icon={
            record.starred ? (
              <StarFilled className="text-lg text-yellow-500" />
            ) : (
              <StarOutlined className="text-lg text-gray-300" />
            )
          }
        />
      ),
    },
  ]

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <div className="text-center">
          <Empty description="ยังไม่มีเพลงในระบบ" />
          <Link href="/search">
            <Button type="primary" className="mt-4">
              ไปหน้าเพิ่มเพลงใหม่
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input.Search
          placeholder="ค้นหาเพลง ศิลปิน หรืออัลบัม"
          allowClear
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:max-w-md"
        />
        <Segmented
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
          size="middle"
        />
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <Table
          dataSource={filteredTracks}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total, range) =>
              range[0] === range[1]
                ? `แสดง ${range[0]} จากทั้งหมด ${filteredTracks.length} เพลง`
                : `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${filteredTracks.length} เพลง`,
          }}
        />
      </div>
    </div>
  )
}
