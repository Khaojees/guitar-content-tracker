'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Segmented, Empty, Pagination } from 'antd'
import ArtistCard from './ArtistCard'
import type { Prisma } from '@prisma/client'

type ArtistWithCounts = Prisma.ArtistGetPayload<{
  select: {
    id: true
    name: true
    imageUrl: true
    itunesId: true
    _count: {
      select: {
        tracks: true
      }
    }
  }
}>

type FilterType = 'all'

const FILTER_OPTIONS = [
  { label: 'ทั้งหมด', value: 'all' },
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

  const filteredArtists = artists

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
    params.set('page', '1')
    router.push(`/artists?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
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
            {filteredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
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
