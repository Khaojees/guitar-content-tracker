'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { App, Button, Empty, Input, Segmented, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StarFilled, StarOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'

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
  ignored: boolean
  note: string
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
]

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
  const savedNotesRef = useRef<Record<number, string>>(
    Object.fromEntries(tracks.map((track) => [track.id, track.note || '']))
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    (typeof STATUS_FILTERS)[number]['value']
  >('all')
  const [showIgnored, setShowIgnored] = useState(false)

  useEffect(() => {
    setRows(tracks)
    savedNotesRef.current = Object.fromEntries(
      tracks.map((track) => [track.id, track.note || ''])
    )
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

      const matchesIgnored = showIgnored ? true : !track.ignored

      return matchesSearch && matchesStatus && matchesIgnored
    })
  }, [rows, searchTerm, statusFilter, showIgnored])

  const toggleStar = async (track: TrackRow) => {
    try {
      const newStarred = !track.starred
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starred: newStarred,
          ...(newStarred && { ignored: false }) // ถ้าติด starred ให้ยกเลิก ignored
        }),
      })

      if (!response.ok) {
        message.error('ไม่สามารถเปลี่ยนสถานะเพลงสำคัญได้')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === track.id
            ? { ...row, starred: newStarred, ...(newStarred && { ignored: false }) }
            : row
        )
      )
      message.success(
        newStarred
          ? 'ปักหมุดเพลงนี้เป็นเพลงสำคัญแล้ว'
          : 'เอาเพลงนี้ออกจากเพลงสำคัญเรียบร้อย'
      )
    } catch (error) {
      console.error('Toggle star error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะเพลงสำคัญ')
    }
  }

  const toggleIgnored = async (track: TrackRow) => {
    try {
      const newIgnored = !track.ignored
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ignored: newIgnored,
          ...(newIgnored && { starred: false }) // ถ้าติด ignored ให้ยกเลิก starred
        }),
      })

      if (!response.ok) {
        message.error('ไม่สามารถเปลี่ยนสถานะไม่สนใจได้')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === track.id
            ? { ...row, ignored: newIgnored, ...(newIgnored && { starred: false }) }
            : row
        )
      )
      message.success(
        newIgnored
          ? 'ทำเครื่องหมายเพลงนี้เป็นไม่สนใจแล้ว'
          : 'เอาเพลงนี้ออกจากไม่สนใจเรียบร้อย'
      )
    } catch (error) {
      console.error('Toggle ignored error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะไม่สนใจ')
    }
  }

  const updateNote = async (track: TrackRow, newNote: string) => {
    try {
      const response = await fetch(`/api/track/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })

      if (!response.ok) {
        message.error('ไม่สามารถอัปเดตโน้ตได้')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === track.id ? { ...row, note: newNote } : row
        )
      )
      savedNotesRef.current[track.id] = newNote
      message.success('อัปเดตโน้ตเรียบร้อย')
    } catch (error) {
      console.error('Update note error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างอัปเดตโน้ต')
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
      title: 'โน้ต',
      dataIndex: 'note',
      key: 'note',
      width: 250,
      render: (_, record) => {
        const currentRow = rows.find(r => r.id === record.id)
        const currentNote = currentRow?.note || ''
        const savedNote = savedNotesRef.current[record.id] ?? ''

        return (
          <Input.TextArea
            value={currentNote}
            placeholder="เพิ่มโน้ต..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            onChange={(e) => {
              setRows((prev) =>
                prev.map((row) =>
                  row.id === record.id ? { ...row, note: e.target.value } : row
                )
              )
            }}
            onBlur={(e) => {
              if (e.target.value !== savedNote) {
                updateNote({ ...record, note: e.target.value }, e.target.value)
              }
            }}
            onPressEnter={(e) => {
              e.currentTarget.blur()
            }}
            className="text-sm"
          />
        )
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
    {
      title: 'ไม่สนใจ',
      dataIndex: 'ignored',
      key: 'ignored',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => toggleIgnored(record)}
          icon={
            record.ignored ? (
              <EyeInvisibleOutlined className="text-lg text-gray-500" />
            ) : (
              <EyeOutlined className="text-lg text-gray-300" />
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
        <div className="flex flex-wrap gap-2">
          <Button
            type={showIgnored ? 'primary' : 'default'}
            icon={showIgnored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => setShowIgnored(!showIgnored)}
          >
            {showIgnored ? 'แสดงเพลงไม่สนใจ' : 'ซ่อนเพลงไม่สนใจ'}
          </Button>
          <Segmented
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            size="middle"
          />
        </div>
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
