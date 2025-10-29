import { prisma } from '@/lib/prisma'
import TracksTable, { type TrackStatusKey, type TrackRow } from './TracksTable'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 50

export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; showIgnored?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const searchTerm = params.search || ''
  const statusFilter = params.status || 'all'
  const showIgnored = params.showIgnored === 'true'
  const skip = (page - 1) * ITEMS_PER_PAGE

  // Build where clause
  const whereClause: any = {}

  // Search by track name, artist name, or album name
  if (searchTerm) {
    whereClause.OR = [
      {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        album: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      },
      {
        album: {
          artist: {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
      },
    ]
  }

  // Filter by status
  if (statusFilter === 'starred') {
    whereClause.trackStatus = {
      starred: true,
    }
  } else if (statusFilter !== 'all') {
    whereClause.trackStatus = {
      status: statusFilter,
    }
  }

  // Filter ignored tracks
  if (!showIgnored) {
    if (whereClause.trackStatus) {
      whereClause.trackStatus.ignored = false
    } else {
      const ignoreFilter = {
        OR: [
          { trackStatus: { ignored: false } },
          { trackStatus: null },
        ],
      }

      if (whereClause.OR) {
        whereClause.AND = [...(whereClause.AND || []), ignoreFilter]
      } else {
        whereClause.OR = ignoreFilter.OR
      }
    }
  }

  const [tracks, totalCount] = await Promise.all([
    prisma.track.findMany({
      where: whereClause,
      include: {
        album: {
          include: {
            artist: true,
          },
        },
        trackStatus: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.track.count({
      where: whereClause,
    }),
  ])

  const tableData: TrackRow[] = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artistName: track.album.artist.name,
    artistId: track.album.artist.id,
    albumName: track.album.name,
    duration: track.duration,
    status: (track.trackStatus?.status as TrackStatusKey) || 'idea',
    starred: Boolean(track.trackStatus?.starred),
    ignored: Boolean(track.trackStatus?.ignored),
    note: track.note || '',
  }))

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">เพลงทั้งหมด</h1>
        <p className="mt-1 text-sm text-gray-600">รวมเพลง {totalCount} เพลง</p>
      </div>

      <TracksTable
        tracks={tableData}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        showIgnored={showIgnored}
      />
    </div>
  )
}
