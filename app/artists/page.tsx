import { prisma } from '@/lib/prisma'
import ArtistsList from './ArtistsList'
import Link from 'next/link'
import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    include: {
      albums: {
        include: {
          tracks: {
            include: {
              trackStatus: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ศิลปิน</h1>
          <p className="mt-1 text-sm text-gray-600">
            ศิลปินทั้งหมด {artists.length} ราย
          </p>
        </div>
        <Link href="/search">
          <Button type="primary" icon={<PlusOutlined />}>
            เพิ่มศิลปิน
          </Button>
        </Link>
      </div>

      {artists.length === 0 ? (
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
        <ArtistsList artists={artists} />
      )}
    </div>
  )
}
