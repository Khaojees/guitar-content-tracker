'use client'

import { useState } from 'react'

export default function RandomPage() {
  const [track, setTrack] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getRandomTrack = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/random-starred')
      const data = await response.json()
      setTrack(data.track)
    } catch (error) {
      console.error('Random track error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎲 สุ่มเพลง</h1>
        <p className="mt-2 text-gray-600">
          สุ่มเพลงจากที่ติดดาวไว้ (สถานะ idea หรือ ready)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <button
          onClick={getRandomTrack}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xl font-semibold"
        >
          {loading ? 'กำลังสุ่ม...' : '🎲 สุ่มเพลง'}
        </button>

        {track && (
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="flex flex-col items-center">
              {track.album.imageUrl && (
                <img
                  src={track.album.imageUrl}
                  alt={track.album.name}
                  className="w-64 h-64 rounded-lg shadow-lg object-cover mb-6"
                />
              )}

              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {track.name}
              </h2>

              <div className="text-xl text-gray-700 mb-4">{track.artist.name}</div>

              <div className="text-lg text-gray-600 mb-2">{track.album.name}</div>

              <div className="flex items-center gap-4 mt-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                  {track.status}
                </span>
                <span className="text-2xl">⭐</span>
                <span className="text-gray-600">{formatDuration(track.duration)}</span>
              </div>

              <a
                href={`/artists/${track.artist.id}`}
                className="mt-6 inline-block bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900"
              >
                ดูรายละเอียด
              </a>
            </div>
          </div>
        )}

        {track === null && !loading && (
          <div className="mt-8 text-gray-500">
            กดปุ่มเพื่อสุ่มเพลง
          </div>
        )}
      </div>
    </div>
  )
}
