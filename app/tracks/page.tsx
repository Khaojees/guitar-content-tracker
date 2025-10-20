import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StarFilled } from '@ant-design/icons'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<
  'idea' | 'ready' | 'recorded' | 'posted',
  { label: string; className: string }
> = {
  idea: { label: 'Idea', className: 'bg-slate-100 text-slate-700' },
  ready: { label: 'Ready', className: 'bg-sky-100 text-sky-700' },
  recorded: { label: 'Recorded', className: 'bg-amber-100 text-amber-700' },
  posted: { label: 'Posted', className: 'bg-emerald-100 text-emerald-700' },
}

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

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            เพลงทั้งหมดในคลังคอนเทนต์
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            สำรวจเพลงทุกสถานะจากศิลปินทั้งหมด
            พร้อมดูความยาวและอัลบั้มที่เกี่ยวข้องในมุมมองเดียว
            ช่วยให้ตัดสินใจได้เร็วว่าควรโฟกัสเพลงใดต่อไป.
          </p>
        </div>
        <span className="inline-flex rounded-full bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-600">
          รวมทั้งหมด {tracks.length} เพลง
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">เพลง</th>
              <th className="px-6 py-4">ศิลปิน</th>
              <th className="px-6 py-4">อัลบั้ม</th>
              <th className="px-6 py-4">ความยาว</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-center">ปักหมุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60 text-sm text-slate-700">
            {tracks.map((track) => {
              const statusKey =
                (track.trackStatus?.status as keyof typeof STATUS_BADGE) || 'idea'
              const badge = STATUS_BADGE[statusKey]

              return (
                <tr key={track.id} className="transition-colors hover:bg-indigo-50/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/artists/${track.album.artist.id}`}
                      className="font-semibold text-slate-900 transition-colors hover:text-indigo-600"
                    >
                      {track.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {track.album.artist.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{track.album.name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDuration(track.duration)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-lg text-amber-400">
                    {track.trackStatus?.starred && <StarFilled />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {tracks.length === 0 && (
          <div className="space-y-4 p-16 text-center">
            <p className="text-sm text-slate-500">ยังไม่มีเพลงในระบบ</p>
            <Link
              href="/search"
              className="inline-flex items-center rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-[1px] hover:bg-indigo-600"
            >
              ค้นหาเพลงเพื่อเริ่มต้น
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

