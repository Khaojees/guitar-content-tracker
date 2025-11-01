'use client'

import { useState } from 'react'
import { Card, Segmented } from 'antd'
import ArtistAlbumsRealtime from './ArtistAlbumsRealtime'
import ArtistSavedTracksByAlbum from './ArtistSavedTracksByAlbum'

type ArtistTracksViewProps = {
  artistId: number
  artistName: string
}

export default function ArtistTracksView({
  artistId,
  artistName,
}: ArtistTracksViewProps) {
  const [viewMode, setViewMode] = useState<'add' | 'manage'>('manage')

  return (
    <div className="space-y-4">
      <Card className="glass-surface border-none bg-white/95">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              โหมดการจัดการเพลง
            </h3>
            <p className="text-sm text-slate-500">
              สลับมุมมองเพื่อเพิ่มเพลงใหม่หรือจัดการเพลงที่บันทึกไว้
            </p>
          </div>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as 'add' | 'manage')}
            options={[
              { label: 'จัดการเพลงที่บันทึก', value: 'manage' },
              { label: 'เพิ่มเพลงใหม่', value: 'add' },
            ]}
          />
        </div>
      </Card>

      {viewMode === 'manage' ? (
        <ArtistSavedTracksByAlbum artistId={artistId} artistName={artistName} />
      ) : (
        <ArtistAlbumsRealtime artistId={artistId} artistName={artistName} />
      )}
    </div>
  )
}
