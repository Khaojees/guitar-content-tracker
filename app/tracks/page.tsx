import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      idea: 'bg-gray-200 text-gray-800',
      ready: 'bg-blue-200 text-blue-800',
      recorded: 'bg-yellow-200 text-yellow-800',
      posted: 'bg-green-200 text-green-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎵 เพลงทั้งหมด</h1>
        <p className="mt-2 text-gray-600">รายการเพลงทั้งหมดในระบบ ({tracks.length})</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เพลง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ศิลปิน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                อัลบั้ม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ความยาว
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ดาว
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tracks.map((track) => (
              <tr key={track.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/artists/${track.album.artist.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {track.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {track.album.artist.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {track.album.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDuration(track.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      track.trackStatus?.status || 'idea'
                    )}`}
                  >
                    {track.trackStatus?.status || 'idea'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {track.trackStatus?.starred ? '⭐' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tracks.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">ยังไม่มีเพลง</p>
            <a
              href="/search"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              ค้นหาเพลง
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
