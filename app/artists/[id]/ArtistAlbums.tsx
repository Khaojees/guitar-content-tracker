'use client'

import { useMemo, useState } from 'react'
import { Collapse, Input, Segmented, Empty } from 'antd'
import Image from 'next/image'
import type { Prisma } from '@prisma/client'
import TrackList, {
  STATUS_KEYS,
  TrackStatusKey,
  isTrackStatusKey,
} from './TrackList'

type AlbumWithTracks = Prisma.AlbumGetPayload<{
  include: {
    tracks: {
      include: {
        trackStatus: true
      }
    }
  }
}>

type StatusFilter = 'all' | 'starred' | TrackStatusKey

const STATUS_SEGMENTS: { label: string; value: StatusFilter }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'ไอเดีย', value: 'idea' },
  { label: 'พร้อมทำงาน', value: 'ready' },
  { label: 'อัดแล้ว', value: 'recorded' },
  { label: 'เผยแพร่แล้ว', value: 'posted' },
  { label: 'เพลงสำคัญ', value: 'starred' },
]

const STATUS_LABEL_MAP: Record<TrackStatusKey, string> = {
  idea: 'ไอเดีย',
  ready: 'พร้อมทำงาน',
  recorded: 'อัดแล้ว',
  posted: 'เผยแพร่แล้ว',
}

const STATUS_BADGE_CLASS: Record<TrackStatusKey, string> = {
  idea: 'bg-slate-100 text-slate-600',
  ready: 'bg-sky-100 text-sky-700',
  recorded: 'bg-amber-100 text-amber-700',
  posted: 'bg-emerald-100 text-emerald-700',
}

export default function ArtistAlbums({ albums, artistName }: { albums: AlbumWithTracks[]; artistName: string }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const collapseItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return albums.map((album) => {
      const statusCounts = album.tracks.reduce<Record<TrackStatusKey | 'starred', number>>(
        (acc, track) => {
          const rawStatus = track.trackStatus?.status
          const status: TrackStatusKey = isTrackStatusKey(rawStatus)
            ? rawStatus
            : 'idea'

          acc[status] += 1

          if (track.trackStatus?.starred) {
            acc.starred += 1
          }

          return acc
        },
        {
          idea: 0,
          ready: 0,
          recorded: 0,
          posted: 0,
          starred: 0,
        }
      )

      const filteredTracks = album.tracks.filter((track) => {
        const normalizedStatus = isTrackStatusKey(track.trackStatus?.status)
          ? track.trackStatus?.status
          : 'idea'

        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'starred'
            ? Boolean(track.trackStatus?.starred)
            : normalizedStatus === statusFilter

        const matchesSearch = normalizedSearch
          ? track.name.toLowerCase().includes(normalizedSearch)
          : true

        return matchesStatus && matchesSearch
      })

      const totalTracks = album.tracks.length
      const header = (
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            {album.imageUrl ? (
              <Image
                src={album.imageUrl}
                alt={album.name}
                fill
                sizes="56px"
                className="rounded-2xl object-cover shadow-sm shadow-indigo-500/10"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-400">
                {album.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold text-slate-900">
                {album.name}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                {filteredTracks.length}/{totalTracks} เพลง
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              {STATUS_KEYS.map((statusKey) => (
                <span
                  key={statusKey}
                  className={`rounded-full px-2.5 py-1 font-medium ${STATUS_BADGE_CLASS[statusKey]}`}
                >
                  {STATUS_LABEL_MAP[statusKey]} • {statusCounts[statusKey]}
                </span>
              ))}
              <span className="rounded-full bg-rose-100 px-2.5 py-1 font-medium text-rose-600">
                เพลงสำคัญ • {statusCounts.starred}
              </span>
            </div>
          </div>
        </div>
      )

      return {
        key: album.id.toString(),
        label: header,
        children: filteredTracks.length ? (
          <TrackList tracks={filteredTracks} layout="compact" artistName={artistName} />
        ) : (
          <div className="py-6">
            <Empty
              description="ยังไม่มีเพลงที่ตรงกับตัวกรองในอัลบัมนี้"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ),
      }
    })
  }, [albums, statusFilter, searchTerm, artistName])

  const defaultActiveKeys = useMemo(
    () => albums.slice(0, 2).map((album) => album.id.toString()),
    [albums]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input.Search
          placeholder="ค้นหาเพลงภายในอัลบัมนี้"
          allowClear
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="lg:max-w-md"
        />
        <Segmented
          options={STATUS_SEGMENTS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as StatusFilter)}
          size="middle"
        />
      </div>

      <Collapse
        items={collapseItems}
        defaultActiveKey={defaultActiveKeys}
        accordion={false}
        bordered={false}
        expandIconPosition="end"
        className="rounded-3xl bg-transparent"
      />
    </div>
  )
}
