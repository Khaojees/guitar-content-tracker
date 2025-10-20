'use client'

import { useState } from 'react'
import { App, Button, Tag, Tooltip } from 'antd'
import {
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'

type TrackStatusKey = 'idea' | 'ready' | 'recorded' | 'posted'

type Track = {
  id: number
  name: string
  duration: number | null
  trackNumber: number | null
  trackStatus: {
    status: TrackStatusKey
    starred: boolean
  } | null
}

const STATUS_THEME: Record<
  TrackStatusKey,
  { label: string; helper: string; active: string; inactive: string }
> = {
  idea: {
    label: 'Idea',
    helper: 'เพิ่งจดไว้ ต้องกลับมาพัฒนาต่อ',
    active: 'bg-slate-900 text-white',
    inactive: 'bg-slate-100 text-slate-600',
  },
  ready: {
    label: 'Ready',
    helper: 'พร้อมซ้อมหรืออัดจริงแล้ว',
    active: 'bg-sky-600 text-white',
    inactive: 'bg-sky-100 text-sky-700',
  },
  recorded: {
    label: 'Recorded',
    helper: 'อัดเสียงหรือวิดีโอเสร็จแล้ว',
    active: 'bg-amber-500 text-white',
    inactive: 'bg-amber-100 text-amber-600',
  },
  posted: {
    label: 'Posted',
    helper: 'โพสต์คอนเทนต์เรียบร้อย',
    active: 'bg-emerald-500 text-white',
    inactive: 'bg-emerald-100 text-emerald-600',
  },
}

const STATUS_KEYS: TrackStatusKey[] = ['idea', 'ready', 'recorded', 'posted']

type TrackStatusState = { status: TrackStatusKey; starred: boolean }

export default function TrackList({ tracks }: { tracks: Track[] }) {
  const router = useRouter()
  const { modal, message: messageApi } = App.useApp()
  const [trackStatuses, setTrackStatuses] = useState<Record<number, TrackStatusState>>(
    Object.fromEntries(
      tracks.map((track) => {
        const status = (track.trackStatus?.status as TrackStatusKey) || 'idea'
        const starred = Boolean(track.trackStatus?.starred)
        return [track.id, { status, starred }] as const
      })
    )
  )
  const [deletingTrack, setDeletingTrack] = useState<number | null>(null)

  const updateStatus = async (trackId: number, newStatus: TrackStatusKey) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTrackStatuses((prev) => ({
          ...prev,
          [trackId]: {
            ...(prev[trackId] ?? { status: newStatus, starred: false }),
            status: newStatus,
          },
        }))
      } else {
        messageApi.error('ไม่สามารถอัปเดตสถานะเพลงได้')
      }
    } catch (error) {
      console.error('Update status error:', error)
      messageApi.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะเพลง')
    }
  }

  const toggleStar = async (trackId: number) => {
    const currentStarred = trackStatuses[trackId]?.starred ?? false

    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      })

      if (response.ok) {
        setTrackStatuses((prev) => ({
          ...prev,
          [trackId]: {
            ...(prev[trackId] ?? { status: 'idea', starred: !currentStarred }),
            starred: !currentStarred,
          },
        }))
      } else {
        messageApi.error('ไม่สามารถปักหมุดเพลงได้')
      }
    } catch (error) {
      console.error('Toggle star error:', error)
      messageApi.error('เกิดข้อผิดพลาดในการปักหมุดเพลง')
    }
  }

  const handleDeleteClick = (track: Track) => {
    const status = trackStatuses[track.id]?.status ?? 'idea'
    const isImportant = status === 'recorded' || status === 'posted'

    modal.confirm({
      title: isImportant ? 'ลบเพลงที่อยู่ในสถานะสำคัญ' : 'ต้องการลบเพลงนี้หรือไม่?',
      icon: (
        <ExclamationCircleOutlined
          className={isImportant ? 'text-amber-500' : 'text-slate-500'}
        />
      ),
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-slate-800">
            เพลง <span className="text-indigo-600">"{track.name}"</span>{' '}
            อยู่ในสถานะ{' '}
            <Tag
              className="!mt-1 !rounded-full !px-2.5 !py-0.5 text-xs font-semibold uppercase"
              color={isImportant ? 'gold' : 'blue'}
            >
              {STATUS_THEME[status].label}
            </Tag>
          </p>
          <p className="text-sm text-slate-600">
            เมื่อลบแล้วข้อมูลสถานะและโพสต์ที่เกี่ยวข้องกับเพลงนี้จะถูกลบถาวร
            โปรดยืนยันก่อนดำเนินการ
          </p>
        </div>
      ),
      okText: 'ลบเพลงออกจากระบบ',
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

      if (response.ok) {
        messageApi.success('ลบเพลงออกจากระบบเรียบร้อยแล้ว')
        router.refresh()
      } else {
        messageApi.error('ไม่สามารถลบเพลงได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (error) {
      console.error('Delete track error:', error)
      messageApi.error('เกิดข้อผิดพลาดในการลบเพลง')
    } finally {
      setDeletingTrack(null)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => {
        const status = trackStatuses[track.id]?.status ?? 'idea'
        const starred = trackStatuses[track.id]?.starred ?? false

        return (
          <div
            key={track.id}
            className="rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:border-indigo-200 hover:shadow-xl"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {track.trackNumber && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      {track.trackNumber}
                    </span>
                  )}
                  <h4 className="text-lg font-semibold text-slate-900">{track.name}</h4>
                  <Tooltip
                    title={
                      starred
                        ? 'นำออกจากเพลงที่ปักหมุด'
                        : 'ปักหมุดเป็นเพลงสำคัญ'
                    }
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
                    className="!ml-1 !rounded-full !px-3 !py-1 !text-sm"
                  >
                    {formatDuration(track.duration)}
                  </Tag>
                </div>
                <p className="text-sm text-slate-500">
                  {STATUS_THEME[status as TrackStatusKey].helper}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STATUS_KEYS.map((key) => {
                  const isActive = status === key
                  return (
                    <Tag
                      key={key}
                      className={`!cursor-pointer !rounded-full !px-3 !py-1.5 !text-xs !font-semibold transition-all ${
                        isActive ? STATUS_THEME[key].active : STATUS_THEME[key].inactive
                      }`}
                      onClick={() => updateStatus(track.id, key)}
                    >
                      {STATUS_THEME[key].label}
                    </Tag>
                  )
                })}

                <Tooltip title="ลบเพลงออกจากระบบ">
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
  )
}

