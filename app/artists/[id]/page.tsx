import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TrackList from './TrackList'

export const dynamic = 'force-dynamic'

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const artistId = parseInt(id)

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: {
      albums: {
        include: {
          tracks: {
            include: {
              trackStatus: true,
            },
            orderBy: {
              trackNumber: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  })

  if (!artist) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {artist.imageUrl && (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{artist.name}</h1>
            <div className="mt-2 text-gray-600 space-y-1">
              <p>อัลบั้ม: {artist.albums.length}</p>
              <p>
                เพลงทั้งหมด:{' '}
                {artist.albums.reduce((sum, album) => sum + album.tracks.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {artist.albums.map((album) => (
        <div key={album.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
            {album.imageUrl && (
              <img
                src={album.imageUrl}
                alt={album.name}
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{album.name}</h2>
              <p className="text-sm text-gray-600">{album.tracks.length} เพลง</p>
            </div>
          </div>
          <TrackList tracks={album.tracks} />
        </div>
      ))}
    </div>
  )
}
