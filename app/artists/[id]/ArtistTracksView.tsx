'use client'

import { useState } from 'react'
import { Card, Segmented, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ArtistAlbumsRealtime from './ArtistAlbumsRealtime'
import ArtistSavedTracksByAlbum from './ArtistSavedTracksByAlbum'
import AddTrackModal from './AddTrackModal'

type ArtistTracksViewProps = {
  artistId: number
  artistName: string
  hasItunesId: boolean
}

export default function ArtistTracksView({
  artistId,
  artistName,
  hasItunesId,
}: ArtistTracksViewProps) {
  const [viewMode, setViewMode] = useState<'add' | 'manage'>('manage')
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTrackAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      <Card className="glass-surface border-none bg-white/95">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              โหมดการจัดการเพลง
            </h3>
            <p className="text-sm text-slate-500">
              {hasItunesId
                ? 'สลับมุมมองเพื่อเพิ่มเพลงใหม่หรือจัดการเพลงที่บันทึกไว้'
                : 'จัดการเพลงที่บันทึกไว้'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              เพิ่มเพลง (Manual)
            </Button>
            {hasItunesId && (
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as 'add' | 'manage')}
                options={[
                  { label: 'จัดการเพลง', value: 'manage' },
                  { label: 'เพิ่มจาก iTunes', value: 'add' },
                ]}
              />
            )}
          </div>
        </div>
      </Card>

      {viewMode === 'manage' || !hasItunesId ? (
        <ArtistSavedTracksByAlbum
          artistId={artistId}
          artistName={artistName}
          refreshKey={refreshKey}
        />
      ) : (
        <ArtistAlbumsRealtime artistId={artistId} artistName={artistName} />
      )}

      <AddTrackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        artistId={artistId}
        artistName={artistName}
        onTrackAdded={handleTrackAdded}
      />
    </div>
  )
}
