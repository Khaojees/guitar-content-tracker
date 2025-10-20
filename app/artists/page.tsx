import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    include: {
      albums: {
        include: {
          tracks: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👤 ศิลปิน</h1>
        <p className="mt-2 text-gray-600">จัดการศิลปินและเพลงทั้งหมด ({artists.length})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => {
          const totalTracks = artist.albums.reduce(
            (sum, album) => sum + album.tracks.length,
            0
          )

          return (
            <Link
              key={artist.id}
              href={`/artists/${artist.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                {artist.imageUrl && (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {artist.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>อัลบั้ม: {artist.albums.length}</p>
                  <p>เพลง: {totalTracks}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {artists.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">ยังไม่มีศิลปิน</p>
          <a
            href="/search"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            ค้นหาศิลปิน
          </a>
        </div>
      )}
    </div>
  )
}
