'use client'

import { useMemo, useState } from 'react'
import { Input, Segmented, Empty } from 'antd'
import ArtistCard from './ArtistCard'
import type { Prisma } from '@prisma/client'

type ArtistWithCounts = Prisma.ArtistGetPayload<{
  include: {
    albums: {
      include: {
        tracks: {
          include: {
            trackStatus: true
          }
        }
      }
    }
  }
}>

type FilterType = 'all' | 'synced' | 'notSynced' | 'hasImportant'

const FILTER_OPTIONS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'เปิด Sync', value: 'synced' },
  { label: 'ปิด Sync', value: 'notSynced' },
  { label: 'มีเพลงสำคัญ', value: 'hasImportant' },
]

export default function ArtistsList({ artists }: { artists: ArtistWithCounts[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredArtists = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return artists.filter((artist) => {
      // Search filter
      const matchesSearch = normalizedSearch
        ? artist.name.toLowerCase().includes(normalizedSearch)
        : true

      // Calculate stats
      const totalTracks = artist.albums.reduce(
        (sum, album) => sum + album.tracks.length,
        0
      )

      const importantTracksCount = artist.albums.reduce((count, album) => {
        return (
          count +
          album.tracks.filter(
            (track) =>
              track.trackStatus?.status === 'recorded' ||
              track.trackStatus?.status === 'posted'
          ).length
        )
      }, 0)

      // Filter by type
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'synced'
          ? artist.syncEnabled
          : filter === 'notSynced'
          ? !artist.syncEnabled
          : filter === 'hasImportant'
          ? importantTracksCount > 0
          : true

      return matchesSearch && matchesFilter
    })
  }, [artists, searchTerm, filter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input.Search
          placeholder="ค้นหาศิลปิน"
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-md"
        />
        <div className="overflow-x-auto">
          <Segmented
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(value) => setFilter(value as FilterType)}
            size="small"
          />
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <Empty description="ไม่พบศิลปินที่ตรงกับการค้นหา" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist) => {
            const totalTracks = artist.albums.reduce(
              (sum, album) => sum + album.tracks.length,
              0
            )

            const importantTracksCount = artist.albums.reduce((count, album) => {
              return (
                count +
                album.tracks.filter(
                  (track) =>
                    track.trackStatus?.status === 'recorded' ||
                    track.trackStatus?.status === 'posted'
                ).length
              )
            }, 0)

            return (
              <ArtistCard
                key={artist.id}
                artist={{
                  id: artist.id,
                  name: artist.name,
                  imageUrl: artist.imageUrl,
                  albumsCount: artist.albums.length,
                  tracksCount: totalTracks,
                  importantTracksCount,
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
