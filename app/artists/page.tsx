import { prisma } from '@/lib/prisma'
import ArtistsList from './ArtistsList'
import Link from 'next/link'
import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 24

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const searchTerm = params.search || ''
  const filter = params.filter || 'all'
  const skip = (page - 1) * ITEMS_PER_PAGE

  // Build where clause
  const whereClause: any = {}

  // Search by name
  if (searchTerm) {
    whereClause.name = {
      contains: searchTerm,
      mode: 'insensitive',
    }
  }

  const [artists, totalCount] = await Promise.all([
    prisma.artist.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.artist.count({
      where: whereClause,
    }),
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ศิลปิน</h1>
          <p className="mt-1 text-sm text-gray-600">
            ศิลปินทั้งหมด {totalCount} ราย
          </p>
        </div>
        <Link href="/search">
          <Button type="primary" icon={<PlusOutlined />}>
            เพิ่มศิลปิน
          </Button>
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <Empty description="ยังไม่มีศิลปิน" />
            <Link href="/search">
              <Button type="primary" className="mt-4">
                เริ่มค้นหาศิลปิน
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ArtistsList
          artists={artists}
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          searchTerm={searchTerm}
          filter={filter}
        />
      )}
    </div>
  )
}
