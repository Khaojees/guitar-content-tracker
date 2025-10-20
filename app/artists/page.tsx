import { prisma } from '@/lib/prisma'
import ArtistCard from './ArtistCard'
import Link from 'next/link'

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
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            ศิลปินที่คุณกำลังติดตาม
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            บริหารแคตตาล็อกศิลปินทั้งหมด พร้อมดูจำนวนอัลบั้มและเพลงสำคัญ
            ที่ต้องติดตามความคืบหน้าการทำคอนเทนต์แบบเรียลไทม์.
          </p>
        </div>
        <span className="inline-flex rounded-full bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-600">
          ศิลปินทั้งหมด {artists.length} ราย
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {artists.map((artist) => {
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

      {artists.length === 0 && (
        <div className="glass-surface flex flex-col items-center gap-6 rounded-3xl bg-white/90 p-14 text-center">
          <div className="text-sm text-slate-500">ยังไม่มีศิลปินที่บันทึกไว้</div>
          <Link
            href="/search"
            className="inline-flex items-center rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-[1px] hover:bg-indigo-600"
          >
            ค้นหาและเพิ่มศิลปินใหม่
          </Link>
        </div>
      )}
    </div>
  )
}

