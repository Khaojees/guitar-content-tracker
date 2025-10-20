'use client'

import { useState } from 'react'

type Track = {
  id: number
  name: string
  duration: number | null
  trackNumber: number | null
  trackStatus: {
    status: string
    starred: boolean
  } | null
}

const STATUS_COLORS = {
  idea: 'bg-gray-200 text-gray-800',
  ready: 'bg-blue-200 text-blue-800',
  recorded: 'bg-yellow-200 text-yellow-800',
  posted: 'bg-green-200 text-green-800',
}

const STATUS_LABELS = {
  idea: 'Idea',
  ready: 'Ready',
  recorded: 'Recorded',
  posted: 'Posted',
}

export default function TrackList({ tracks }: { tracks: Track[] }) {
  const [trackStatuses, setTrackStatuses] = useState<Record<number, any>>(
    Object.fromEntries(
      tracks.map((t) => [
        t.id,
        t.trackStatus || { status: 'idea', starred: false },
      ])
    )
  )

  const updateStatus = async (trackId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTrackStatuses((prev) => ({
          ...prev,
          [trackId]: { ...prev[trackId], status: newStatus },
        }))
      }
    } catch (error) {
      console.error('Update status error:', error)
    }
  }

  const toggleStar = async (trackId: number) => {
    const currentStarred = trackStatuses[trackId]?.starred || false

    try {
      const response = await fetch(`/api/track/${trackId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      })

      if (response.ok) {
        setTrackStatuses((prev) => ({
          ...prev,
          [trackId]: { ...prev[trackId], starred: !currentStarred },
        }))
      }
    } catch (error) {
      console.error('Toggle star error:', error)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="divide-y divide-gray-200">
      {tracks.map((track) => {
        const status = trackStatuses[track.id]?.status || 'idea'
        const starred = trackStatuses[track.id]?.starred || false

        return (
          <div key={track.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {track.trackNumber && (
                  <span className="text-gray-400 text-sm w-6">
                    {track.trackNumber}
                  </span>
                )}
                <span className="font-medium text-gray-900">{track.name}</span>
                <button
                  onClick={() => toggleStar(track.id)}
                  className="text-xl hover:scale-110 transition-transform"
                  title={starred ? 'ยกเลิกดาว' : 'ติดดาว'}
                >
                  {starred ? '⭐' : '☆'}
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDuration(track.duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(['idea', 'ready', 'recorded', 'posted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => updateStatus(track.id, st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    status === st
                      ? STATUS_COLORS[st]
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
