'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { App, Button, Empty, Input, Pagination, Segmented, Select, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { StarFilled, StarOutlined, EyeInvisibleOutlined, EyeOutlined, YoutubeOutlined, CopyOutlined } from '@ant-design/icons'
import { buildGuessSongText } from '@/lib/guessSongText'

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
  { label: 'ติดดาว', value: 'starred' },
]

const formatDuration = (ms: number | null) => {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

type TracksTableProps = {
  tracks: TrackRow[]
  currentPage: number
  totalPages: number
  totalCount: number
  searchTerm: string
  statusFilter: string
  showIgnored: boolean
}

export default function TracksTable({
  tracks,
  currentPage,
  totalPages,
  totalCount,
  searchTerm: initialSearchTerm,
  statusFilter: initialStatusFilter,
  showIgnored: initialShowIgnored
}: TracksTableProps) {
  const { message } = App.useApp()
  const router = useRouter()
  const [rows, setRows] = useState(tracks)
  const savedNotesRef = useRef<Record<number, string>>(
    Object.fromEntries(tracks.map((track) => [track.id, track.note || '']))
  )
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [statusFilter, setStatusFilter] = useState<
    (typeof STATUS_FILTERS)[number]['value']
  >(initialStatusFilter as (typeof STATUS_FILTERS)[number]['value'])
  const [showIgnored, setShowIgnored] = useState(initialShowIgnored)

  useEffect(() => {
    setRows(tracks)
    savedNotesRef.current = Object.fromEntries(
      tracks.map((track) => [track.id, track.note || ''])
    )
  }, [tracks])

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
        message.error('ไม่สามารถติดดาวได้')
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
          ? 'ติดดาวเพลงนี้แล้ว'
          : 'ถอดดาวเพลงนี้แล้ว'
      )
    } catch (error) {
      console.error('Toggle star error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างติดดาว')
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

  const updateStatus = async (track: TrackRow, newStatus: TrackStatusKey) => {
    try {
      const response = await fetch(`/api/track/${track.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        message.error('ไม่สามารถเปลี่ยนสถานะได้')
        return
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === track.id ? { ...row, status: newStatus } : row
        )
      )
      message.success('เปลี่ยนสถานะเรียบร้อย')
    } catch (error) {
      console.error('Update status error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะ')
    }
  }

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (showIgnored) params.set('showIgnored', 'true')
    params.set('page', '1')
    router.push(`/tracks?${params.toString()}`)
  }

  const handleStatusFilterChange = (value: (typeof STATUS_FILTERS)[number]['value']) => {
    setStatusFilter(value)
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (value !== 'all') params.set('status', value)
    if (showIgnored) params.set('showIgnored', 'true')
    params.set('page', '1')
    router.push(`/tracks?${params.toString()}`)
  }

  const handleToggleIgnored = () => {
    const newShowIgnored = !showIgnored
    setShowIgnored(newShowIgnored)
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (newShowIgnored) params.set('showIgnored', 'true')
    params.set('page', '1')
    router.push(`/tracks?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (showIgnored) params.set('showIgnored', 'true')
    params.set('page', page.toString())
    router.push(`/tracks?${params.toString()}`)
  }

  const handleCopyGuessText = async (track: TrackRow) => {
    try {
      await navigator.clipboard.writeText(
        buildGuessSongText(track.name, track.artistName)
      )
      message.success('Copied guess text to clipboard')
    } catch (error) {
      console.error('Copy guess text error:', error)
      message.error('Unable to copy guess text')
    }
  }

  const columns: ColumnsType<TrackRow> = [
    {
      title: 'เพลง',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
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
      render: (status: TrackStatusKey, record) => (
        <Select
          value={status}
          onChange={(value) => updateStatus(record, value)}
          size="small"
          style={{ width: 120 }}
          options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
          }))}
        />
      ),
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
      title: 'YouTube',
      key: 'youtube',
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => {
            const searchQuery = `${record.name} ${record.artistName}`
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank')
          }}
          icon={<YoutubeOutlined className="text-lg text-red-500" />}
        />
      ),
    },
    {
      title: 'ติดดาว',
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
    {
      title: '',
      key: 'copyGuessText',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Copy guess text template">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyGuessText(record)}
          />
        </Tooltip>
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
      <div className="flex flex-col gap-3">
        <Input.Search
          placeholder="ค้นหาเพลง ศิลปิน หรืออัลบัม"
          allowClear
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onSearch={handleSearch}
          className="w-full md:max-w-md"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type={showIgnored ? 'primary' : 'default'}
            icon={showIgnored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={handleToggleIgnored}
            size="small"
            className="self-start"
          >
            <span className="hidden sm:inline">{showIgnored ? 'แสดงเพลงไม่สนใจ' : 'ซ่อนเพลงไม่สนใจ'}</span>
            <span className="inline sm:hidden">{showIgnored ? 'แสดง' : 'ซ่อน'}ไม่สนใจ</span>
          </Button>
          <div className="overflow-x-auto">
            <Segmented
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={(value) => handleStatusFilterChange(value as typeof statusFilter)}
              size="small"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            current={currentPage}
            total={totalCount}
            pageSize={50}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} เพลง`
            }
          />
        </div>
      )}
    </div>
  )
}
