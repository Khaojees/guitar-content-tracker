'use client'

import { useMemo, useState } from 'react'
import { App, Button, Tooltip, Empty, Tag, Input } from 'antd'
import {
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { Prisma } from '@prisma/client'

export type TrackStatusKey = 'idea' | 'ready' | 'recorded' | 'posted'

type TrackWithStatus = Prisma.TrackGetPayload<{
  include: {
    trackStatus: true
  }
}>

type TrackStatusState = { status: TrackStatusKey; starred: boolean; ignored: boolean }

type TrackListProps = {
  tracks: TrackWithStatus[]
  layout?: 'default' | 'compact'
}

const STATUS_CONFIG: Record<
  TrackStatusKey,
  {
    label: string
    helper: string
    pillClass: string
    buttonActive: string
    buttonInactive: string
  }
> = {
  idea: {
    label: 'ไอเดีย',
    helper:
      'เก็บคอนเซปต์และรายละเอียดไว้ก่อน ยังไม่ได้ลงมือผลิตคอนเทนต์จริงจัง',
    pillClass: 'bg-slate-100 text-slate-600',
    buttonActive: '!bg-slate-900 !text-white !shadow-sm',
    buttonInactive:
      '!bg-slate-50 !text-slate-600 hover:!bg-slate-100 hover:!text-slate-700',
  },
  ready: {
    label: 'พร้อมทำงาน',
    helper:
      'เตรียมข้อมูลครบแล้ว พร้อมลงมือผลิต เช่น เนื้อร้อง แผนโพสต์ หรือชุดฟุตเทจ',
    pillClass: 'bg-sky-100 text-sky-700',
    buttonActive: '!bg-sky-500 !text-white !shadow-sm',
    buttonInactive:
      '!bg-sky-50 !text-sky-600 hover:!bg-sky-100 hover:!text-sky-700',
  },
  recorded: {
    label: 'อัดแล้ว',
    helper:
      'อัดเสียงหรือวิดีโอเสร็จแล้ว กำลังมิกซ์ ตัดต่อ หรือเตรียมปล่อยคอนเทนต์',
    pillClass: 'bg-amber-100 text-amber-700',
    buttonActive: '!bg-amber-500 !text-white !shadow-sm',
    buttonInactive:
      '!bg-amber-50 !text-amber-600 hover:!bg-amber-100 hover:!text-amber-700',
  },
  posted: {
    label: 'เผยแพร่แล้ว',
    helper:
      'ปล่อยคอนเทนต์เรียบร้อยแล้ว สามารถติดตามผลและเก็บสถิติได้ทันที',
    pillClass: 'bg-emerald-100 text-emerald-700',
    buttonActive: '!bg-emerald-500 !text-white !shadow-sm',
    buttonInactive:
      '!bg-emerald-50 !text-emerald-600 hover:!bg-emerald-100 hover:!text-emerald-700',
  },
}

export const STATUS_KEYS: TrackStatusKey[] = ['idea', 'ready', 'recorded', 'posted']

export const isTrackStatusKey = (
  value: string | null | undefined
): value is TrackStatusKey => (STATUS_KEYS as readonly string[]).includes(value ?? '')

const EMPTY_DESCRIPTION = 'ยังไม่มีเพลงที่ตรงกับตัวกรองในอัลบัมนี้'

const ERROR_MESSAGE = {
  updateStatus: 'ไม่สามารถอัปเดตสถานะเพลงได้ กรุณาลองใหม่อีกครั้ง',
  updateStatusRequest: 'เกิดข้อผิดพลาดระหว่างอัปเดตสถานะเพลง',
  toggleStar: 'ไม่สามารถเปลี่ยนสถานะติดดาวได้ กรุณาลองใหม่อีกครั้ง',
  toggleStarRequest: 'เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะติดดาว',
  deleteTrack: 'ไม่สามารถลบเพลงได้ กรุณาลองใหม่อีกครั้ง',
  deleteTrackRequest: 'เกิดข้อผิดพลาดระหว่างลบเพลง',
}

const TOOLTIP_STAR = {
  active: 'เพลงนี้ถูกปักหมุดเป็นเพลงสำคัญแล้ว',
  inactive: 'ปักหมุดเพลงนี้เป็นเพลงสำคัญ',
}

const TOOLTIP_DELETE = 'ลบเพลงนี้ออกจากอัลบัม'

const STATUS_BUTTON_BASE =
  '!border-none !px-4 !py-1 !text-xs !font-semibold rounded-full transition-all duration-150'

export default function TrackList({ tracks, layout = 'default' }: TrackListProps) {
  const router = useRouter()
  const { modal, message: messageApi } = App.useApp()
  const [trackStatuses, setTrackStatuses] = useState<Record<number, TrackStatusState>>(
    Object.fromEntries(
      tracks.map((track) => {
        const status = isTrackStatusKey(track.trackStatus?.status)
          ? track.trackStatus.status
          : 'idea'
        const starred = Boolean(track.trackStatus?.starred)
        const ignored = Boolean(track.trackStatus?.ignored)
        return [track.id, { status, starred, ignored }] as const
      })
    )
  )
  const [deletingTrack, setDeletingTrack] = useState<number | null>(null)
  const [showIgnored, setShowIgnored] = useState(false)

  const containerClass = layout === 'compact' ? 'space-y-2' : 'space-y-4'
  const cardPadding = layout === 'compact' ? 'p-3 sm:p-4' : 'p-5'
  const helperVisible = layout !== 'compact'

  const emptyContent = useMemo(
    () => (
      <Empty
        description={EMPTY_DESCRIPTION}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className="py-8"
      />
    ),
    []
  )

  const [trackNotes, setTrackNotes] = useState<Record<number, string>>(
    Object.fromEntries(
      tracks.map((track) => [track.id, track.note || ''] as const)
    )
  )

  const updateStatus = async (trackId: number, newStatus: TrackStatusKey) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        messageApi.error(ERROR_MESSAGE.updateStatus)
        return
      }

      setTrackStatuses((prev) => ({
        ...prev,
        [trackId]: {
          ...(prev[trackId] ?? { status: newStatus, starred: false, ignored: false }),
          status: newStatus,
        },
      }))
      router.refresh()
    } catch (error) {
      console.error('Update status error:', error)
      messageApi.error(ERROR_MESSAGE.updateStatusRequest)
    }
  }

  const toggleIgnored = async (trackId: number) => {
    const currentIgnored = trackStatuses[trackId]?.ignored ?? false
    const newIgnored = !currentIgnored

    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ignored: newIgnored,
          ...(newIgnored && { starred: false }) // ถ้าติด ignored ให้ยกเลิก starred
        }),
      })

      if (!response.ok) {
        messageApi.error('ไม่สามารถเปลี่ยนสถานะไม่สนใจได้')
        return
      }

      setTrackStatuses((prev) => ({
        ...prev,
        [trackId]: {
          ...(prev[trackId] ?? { status: 'idea', starred: false, ignored: newIgnored }),
          ignored: newIgnored,
          ...(newIgnored && { starred: false })
        },
      }))
      messageApi.success(
        newIgnored
          ? 'ทำเครื่องหมายเพลงนี้เป็นไม่สนใจแล้ว'
          : 'เอาเพลงนี้ออกจากไม่สนใจเรียบร้อย'
      )
      router.refresh()
    } catch (error) {
      console.error('Toggle ignored error:', error)
      messageApi.error('เกิดข้อผิดพลาดระหว่างเปลี่ยนสถานะไม่สนใจ')
    }
  }

  const updateNote = async (trackId: number, newNote: string) => {
    try {
      const response = await fetch(`/api/track/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })

      if (!response.ok) {
        messageApi.error('ไม่สามารถอัปเดตโน้ตได้')
        return
      }

      setTrackNotes((prev) => ({
        ...prev,
        [trackId]: newNote,
      }))
      messageApi.success('อัปเดตโน้ตเรียบร้อย')
      router.refresh()
    } catch (error) {
      console.error('Update note error:', error)
      messageApi.error('เกิดข้อผิดพลาดระหว่างอัปเดตโน้ต')
    }
  }

  const toggleStar = async (trackId: number) => {
    const currentStarred = trackStatuses[trackId]?.starred ?? false
    const newStarred = !currentStarred

    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starred: newStarred,
          ...(newStarred && { ignored: false }) // ถ้าติด starred ให้ยกเลิก ignored
        }),
      })

      if (!response.ok) {
        messageApi.error(ERROR_MESSAGE.toggleStar)
        return
      }

      setTrackStatuses((prev) => ({
        ...prev,
        [trackId]: {
          ...(prev[trackId] ?? { status: 'idea', starred: newStarred, ignored: false }),
          starred: newStarred,
          ...(newStarred && { ignored: false })
        },
      }))
      router.refresh()
    } catch (error) {
      console.error('Toggle star error:', error)
      messageApi.error(ERROR_MESSAGE.toggleStarRequest)
    }
  }

  const handleDeleteClick = (track: TrackWithStatus) => {
    const status = trackStatuses[track.id]?.status ?? 'idea'
    const starred = trackStatuses[track.id]?.starred ?? false

    const statusLabel = STATUS_CONFIG[status].label
    const starredLabel = starred
      ? 'เพลงนี้ถูกปักหมุดเป็นเพลงสำคัญ'
      : 'เพลงนี้ยังไม่ได้ปักหมุด'

    modal.confirm({
      title: `ยืนยันการลบเพลง (${statusLabel})`,
      icon: <ExclamationCircleOutlined className="text-amber-500" />,
      content: (
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">{track.name}</span>
            <br />
            {starredLabel}
          </p>
          <p>
            เมื่อลบแล้วข้อมูลสถานะ ความคืบหน้า และบันทึกทั้งหมดของเพลงนี้จะถูกลบถาวร
          </p>
        </div>
      ),
      okText: 'ลบเพลง',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true, loading: deletingTrack === track.id },
      onOk: () => deleteTrack(track.id),
    })
  }

  const deleteTrack = async (trackId: number) => {
    setDeletingTrack(trackId)
    try {
      const response = await fetch(`/api/track/${trackId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        messageApi.error(ERROR_MESSAGE.deleteTrack)
        return
      }

      messageApi.success('ลบเพลงเรียบร้อยแล้ว')
      router.refresh()
    } catch (error) {
      console.error('Delete track error:', error)
      messageApi.error(ERROR_MESSAGE.deleteTrackRequest)
    } finally {
      setDeletingTrack(null)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const visibleTracks = useMemo(() => {
    return tracks.filter((track) => {
      const ignored = trackStatuses[track.id]?.ignored ?? false
      return showIgnored ? true : !ignored
    })
  }, [tracks, trackStatuses, showIgnored])

  if (tracks.length === 0) {
    return emptyContent
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type={showIgnored ? 'primary' : 'default'}
          icon={showIgnored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => setShowIgnored(!showIgnored)}
          size="small"
        >
          {showIgnored ? 'แสดงเพลงไม่สนใจ' : 'ซ่อนเพลงไม่สนใจ'}
        </Button>
      </div>

      <div className={containerClass}>
        {visibleTracks.map((track) => {
          const status = trackStatuses[track.id]?.status ?? 'idea'
          const starred = trackStatuses[track.id]?.starred ?? false
          const ignored = trackStatuses[track.id]?.ignored ?? false

          return (
          <div
            key={track.id}
            className={`rounded-2xl border border-slate-200/70 bg-white/90 ${cardPadding} shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-indigo-200 hover:shadow-lg`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {track.trackNumber && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      {track.trackNumber}
                    </span>
                  )}
                  <h4 className="text-base font-semibold text-slate-900">{track.name}</h4>
                  <Tooltip
                    title={starred ? TOOLTIP_STAR.active : TOOLTIP_STAR.inactive}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={
                        starred ? (
                          <StarFilled className="text-amber-400" />
                        ) : (
                          <StarOutlined />
                        )
                      }
                      onClick={() => toggleStar(track.id)}
                    />
                  </Tooltip>
                  <Tag
                    icon={<ClockCircleOutlined />}
                    className="!ml-1 !rounded-full !px-3 !py-1 !text-xs"
                  >
                    {formatDuration(track.duration)}
                  </Tag>
                </div>
                {helperVisible && (
                  <p className="text-sm text-slate-500">
                    {STATUS_CONFIG[status].helper}
                  </p>
                )}
                <div className="mt-2">
                  <Input.TextArea
                    value={trackNotes[track.id] ?? ''}
                    placeholder="เพิ่มโน้ตหรือไอเดียเสริม..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onChange={(e) => {
                      setTrackNotes((prev) => ({
                        ...prev,
                        [track.id]: e.target.value,
                      }))
                    }}
                    onBlur={(e) => {
                      const originalNote = track.note || ''
                      if (e.target.value !== originalNote) {
                        updateNote(track.id, e.target.value)
                      }
                    }}
                    onPressEnter={(e) => {
                      e.currentTarget.blur()
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STATUS_KEYS.map((key) => {
                  const config = STATUS_CONFIG[key]
                  const isActive = status === key
                  return (
                    <Button
                      key={key}
                      size="small"
                      shape="round"
                      className={`${STATUS_BUTTON_BASE} ${
                        isActive ? config.buttonActive : config.buttonInactive
                      }`}
                      onClick={() => {
                        if (!isActive) {
                          updateStatus(track.id, key)
                        }
                      }}
                    >
                      {config.label}
                    </Button>
                  )
                })}

                <Tooltip title={ignored ? 'เปิดใช้งานเพลงนี้' : 'ไม่สนใจเพลงนี้'}>
                  <Button
                    type="text"
                    icon={
                      ignored ? (
                        <EyeInvisibleOutlined className="text-gray-500" />
                      ) : (
                        <EyeOutlined className="text-gray-400" />
                      )
                    }
                    onClick={() => toggleIgnored(track.id)}
                  />
                </Tooltip>

                <Tooltip title={TOOLTIP_DELETE}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingTrack === track.id}
                    onClick={() => handleDeleteClick(track)}
                  />
                </Tooltip>
              </div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
