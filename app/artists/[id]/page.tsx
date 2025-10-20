import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TrackList from './TrackList'
import ArtistHeader from './ArtistHeader'

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
    <div className="space-y-8">
      <ArtistHeader artist={artist} />

      {artist.albums.map((album) => (
        <div
          key={album.id}
          className="glass-surface overflow-hidden rounded-3xl border-none bg-white/90"
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/70 px-6 py-4">
            <div className="flex items-center gap-4">
              {album.imageUrl && (
                <img
                  src={album.imageUrl}
                  alt={album.name}
                  className="h-16 w-16 rounded-2xl object-cover shadow-md shadow-indigo-500/10"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{album.name}</h2>
                <p className="text-sm text-slate-500">
                  มีเพลงทั้งหมด {album.tracks.length} เพลง
                </p>
              </div>
            </div>
          </div>
          <div className="px-2 py-2 sm:px-4 sm:py-4">
            <TrackList tracks={album.tracks} />
          </div>
        </div>
      ))}
    </div>
  )
}

