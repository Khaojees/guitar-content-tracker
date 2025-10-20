'use client'

import { useState } from 'react'

export default function HomePage() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/sync-all', {
        method: 'POST',
      })
      const data = await response.json()
      setSyncResult(data)
    } catch (error) {
      console.error('Sync error:', error)
      setSyncResult({ error: 'Failed to sync' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎸 Guitar Content Tracker</h1>
        <p className="mt-2 text-gray-600">
          ระบบจัดการเพลงสำหรับทำคลิปกีตาร์สั้น — พัฒนาด้วย Next.js + Prisma + iTunes API
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🔄 Release Radar</h2>
        <p className="text-gray-600 mb-4">
          อัพเดทเพลงใหม่จากศิลปินที่บันทึกไว้ทั้งหมด
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {syncing ? 'กำลังอัพเดท...' : 'Update เพลงใหม่'}
        </button>

        {syncResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">ผลลัพธ์:</h3>
            {syncResult.error ? (
              <p className="text-red-600">{syncResult.error}</p>
            ) : (
              <div>
                <p className="text-green-600">
                  ✅ พบเพลงใหม่ {syncResult.count} เพลง
                </p>
                {syncResult.newTracks && syncResult.newTracks.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {syncResult.newTracks.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <strong>{item.artist}</strong> - {item.album}
                        <ul className="ml-4 text-gray-600">
                          {item.tracks.map((track: string, tidx: number) => (
                            <li key={tidx}>• {track}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/search" className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 ค้นหาเพลง</h3>
          <p className="text-gray-600">ค้นหาและบันทึกศิลปิน/เพลงจาก iTunes</p>
        </a>

        <a href="/artists" className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 ศิลปิน</h3>
          <p className="text-gray-600">จัดการศิลปินและเพลงทั้งหมด</p>
        </a>

        <a href="/random" className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🎲 สุ่มเพลง</h3>
          <p className="text-gray-600">สุ่มเพลงจากที่ติดดาวไว้</p>
        </a>
      </div>
    </div>
  )
}
