import { prisma } from '@/lib/prisma'
import TracksTable, { type TrackStatusKey, type TrackRow } from './TracksTable'

export const dynamic = 'force-dynamic'

export default async function TracksPage() {
  const tracks = await prisma.track.findMany({
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
  })

  const tableData: TrackRow[] = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artistName: track.album.artist.name,
    artistId: track.album.artist.id,
    albumName: track.album.name,
    duration: track.duration,
    status: (track.trackStatus?.status as TrackStatusKey) || 'idea',
    starred: Boolean(track.trackStatus?.starred),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">เพลงทั้งหมด</h1>
        <p className="mt-1 text-sm text-gray-600">รวมเพลง {tracks.length} เพลง</p>
      </div>

      <TracksTable tracks={tableData} />
    </div>
  )
}
