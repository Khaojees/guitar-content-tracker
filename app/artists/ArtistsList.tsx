'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Segmented, Empty, Pagination } from 'antd'
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
  { label: 'มีเพลงติดดาว', value: 'hasImportant' },
]

type ArtistsListProps = {
  artists: ArtistWithCounts[]
  currentPage: number
  totalPages: number
  totalCount: number
  searchTerm: string
  filter: string
}

export default function ArtistsList({
  artists,
  currentPage,
  totalPages,
  totalCount,
  searchTerm: initialSearchTerm,
  filter: initialFilter
}: ArtistsListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [filter, setFilter] = useState<FilterType>(initialFilter as FilterType)

  // Filter "hasImportant" locally since it requires complex calculation
  const filteredArtists = useMemo(() => {
    if (filter !== 'hasImportant') {
      return artists
    }

    return artists.filter((artist) => {
      const importantTracksCount = artist.albums.reduce((count, album) => {
        return (
          count +
          album.tracks.filter(
            (track) => track.trackStatus?.starred === true
          ).length
        )
      }, 0)

      return importantTracksCount > 0
    })
  }, [artists, filter])

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (filter !== 'all') params.set('filter', filter)
    params.set('page', '1')
    router.push(`/artists?${params.toString()}`)
  }

  const handleFilterChange = (value: FilterType) => {
    setFilter(value)
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (value !== 'all' && value !== 'hasImportant') params.set('filter', value)
    params.set('page', '1')
    router.push(`/artists?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (filter !== 'all' && filter !== 'hasImportant') params.set('filter', filter)
    params.set('page', page.toString())
    router.push(`/artists?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input.Search
          placeholder="ค้นหาศิลปิน"
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          className="w-full md:max-w-md"
        />
        <div className="overflow-x-auto">
          <Segmented
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(value) => handleFilterChange(value as FilterType)}
            size="small"
          />
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <Empty description="ไม่พบศิลปินที่ตรงกับการค้นหา" />
        </div>
      ) : (
        <>
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
                    (track) => track.trackStatus?.starred === true
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

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                current={currentPage}
                total={totalCount}
                pageSize={24}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} ราย`
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
