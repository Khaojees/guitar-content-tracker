'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Empty,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

const { Title, Paragraph, Text } = Typography

type PreviewTrack = {
  trackId: number
  trackName: string
  trackNumber?: number | null
  trackTimeMillis?: number | null
  collectionId: number
  collectionName: string
  artworkUrl100?: string | null
}

type PreviewAlbum = {
  collectionId: number
  collectionName: string
  artworkUrl100?: string | null
  isNewAlbum: boolean
  existingAlbumId?: number
  tracks: PreviewTrack[]
}

type PreviewArtist = {
  artistId: number
  artistName: string
  externalArtistId: string
  syncEnabled: boolean
  albums: PreviewAlbum[]
}

type PreviewResponse = {
  artists: PreviewArtist[]
}

export default function SyncPage() {
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [applying, setApplying] = useState(false)
  const [artists, setArtists] = useState<PreviewArtist[]>([])
  const [selectedAlbums, setSelectedAlbums] = useState<Record<number, boolean>>({})
  const [selectedTracks, setSelectedTracks] = useState<Record<number, boolean>>({})
  const [syncToggleLoading, setSyncToggleLoading] = useState<Record<number, boolean>>({})

  const hasPreview = artists.length > 0

  const resetSelections = (data: PreviewArtist[]) => {
    const albumSelections: Record<number, boolean> = {}
    const trackSelections: Record<number, boolean> = {}

    data.forEach((artist) => {
      artist.albums.forEach((album) => {
        albumSelections[album.collectionId] = album.isNewAlbum
        album.tracks.forEach((track) => {
          trackSelections[track.trackId] = true
        })
      })
    })

    setSelectedAlbums(albumSelections)
    setSelectedTracks(trackSelections)
  }

  const fetchPreview = async () => {
    setLoadingPreview(true)
    try {
      const response = await fetch('/api/sync/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = (await response.json()) as PreviewResponse
      setArtists(data.artists || [])
      resetSelections(data.artists || [])
    } catch (error) {
      console.error('Sync preview error:', error)
      message.error('Unable to build sync preview right now.')
    } finally {
      setLoadingPreview(false)
    }
  }

  const applySelection = async () => {
    const selectedAlbumIds = Object.entries(selectedAlbums)
      .filter(([, value]) => value)
      .map(([key]) => Number(key))

    const selectedTrackIds = artists
      .flatMap((artist) =>
        artist.albums.flatMap((album) => {
          if (selectedAlbums[album.collectionId]) {
            return []
          }
          return album.tracks
            .filter((track) => selectedTracks[track.trackId])
            .map((track) => track.trackId)
        })
      )

    if (selectedAlbumIds.length === 0 && selectedTrackIds.length === 0) {
      message.info('Please select at least one album or track to import.')
      return
    }

    setApplying(true)
    try {
      const response = await fetch('/api/sync/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albums: selectedAlbumIds.map((collectionId) => ({ collectionId })),
          tracks: selectedTrackIds.map((trackId) => ({ trackId })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        message.error(data.error || 'Failed to import selected items.')
        return
      }

      const importedAlbums =
        Array.isArray(data.albums) &&
        data.albums.filter((item: any) => !item?.error && item?.createdTrackCount >= 0).length
      const importedTracks =
        Array.isArray(data.tracks) &&
        data.tracks.filter((item: any) => !item?.error).length

      message.success(
        `Imported ${importedAlbums || 0} album(s) and ${importedTracks || 0} track(s) successfully.`
      )
      await fetchPreview()
    } catch (error) {
      console.error('Sync apply error:', error)
      message.error('Unexpected error while importing selection.')
    } finally {
      setApplying(false)
    }
  }

  const toggleAlbumSelection = (collectionId: number, checked: boolean) => {
    setSelectedAlbums((prev) => ({
      ...prev,
      [collectionId]: checked,
    }))
  }

  const toggleTrackSelection = (trackId: number, checked: boolean) => {
    setSelectedTracks((prev) => ({
      ...prev,
      [trackId]: checked,
    }))
  }

  const toggleArtistSync = async (artist: PreviewArtist) => {
    setSyncToggleLoading((prev) => ({ ...prev, [artist.artistId]: true }))
    try {
      const response = await fetch(`/api/artist/${artist.artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled: !artist.syncEnabled }),
      })
      const data = await response.json()
      if (!response.ok) {
        message.error(data.error || 'Failed to update sync preference.')
        return
      }

      setArtists((prev) =>
        prev.map((entry) =>
          entry.artistId === artist.artistId
            ? { ...entry, syncEnabled: data.artist.syncEnabled }
            : entry
        )
      )
      message.success(
        data.artist.syncEnabled
          ? 'Automatic sync enabled for this artist.'
          : 'Automatic sync disabled for this artist.'
      )
    } catch (error) {
      console.error('Toggle artist sync error:', error)
      message.error('Unexpected error while updating sync preference.')
    } finally {
      setSyncToggleLoading((prev) => ({ ...prev, [artist.artistId]: false }))
    }
  }

  const previewSummary = useMemo(() => {
    if (!artists.length) return null
    const albumCount = artists.reduce((sum, artist) => sum + artist.albums.length, 0)
    const trackCount = artists.reduce(
      (sum, artist) => sum + artist.albums.reduce((aSum, album) => aSum + album.tracks.length, 0),
      0
    )
    return { albumCount, trackCount }
  }, [artists])

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Title level={2} className="!mb-2 !text-slate-900">
          Release Radar sync
        </Title>
        <Paragraph className="!mb-0 max-w-3xl text-slate-600">
          Build a preview of new releases for artists that still have syncing enabled, decide exactly
          which albums or tracks should be imported, and then apply the selection in one click.
        </Paragraph>
      </section>

      <Card className="glass-surface border-none bg-white/90">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loadingPreview}
            onClick={fetchPreview}
          >
            {hasPreview ? 'Refresh preview' : 'Build preview'}
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={applying}
            disabled={!hasPreview}
            onClick={applySelection}
          >
            Apply selected items
          </Button>
          <Link href="/artists">
            <Button icon={<ExclamationCircleOutlined />}>Manage artists</Button>
          </Link>
        </div>
        {previewSummary && (
          <div className="mt-4 text-sm text-slate-600">
            Preview contains {previewSummary.albumCount} album(s) and {previewSummary.trackCount}{' '}
            track(s).
          </div>
        )}
      </Card>

      {loadingPreview && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/60">
          <Spin tip="Fetching latest releases..." />
        </div>
      )}

      {!loadingPreview && !artists.length && (
        <Card className="glass-surface border-none bg-white/90">
          <Empty
            description="No new releases found. Try syncing again after new music drops."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {!loadingPreview && artists.length > 0 && (
        <Space direction="vertical" className="w-full" size="large">
          {artists.map((artist) => (
            <Card key={artist.artistId} className="border border-slate-200/70 bg-white/95 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Title level={4} className="!mb-0">
                      {artist.artistName}
                    </Title>
                    {artist.syncEnabled ? (
                      <Tag color="processing">Sync enabled</Tag>
                    ) : (
                      <Tag color="default">Sync disabled</Tag>
                    )}
                  </div>
                  <Text type="secondary">Artist ID #{artist.artistId}</Text>
                </div>
                <Space>
                  <Button
                    size="small"
                    icon={<SyncOutlined />}
                    loading={syncToggleLoading[artist.artistId]}
                    onClick={() => toggleArtistSync(artist)}
                  >
                    {artist.syncEnabled ? 'Disable sync' : 'Enable sync'}
                  </Button>
                  <Link href={`/artists/${artist.artistId}`}>
                    <Button size="small">Open artist</Button>
                  </Link>
                </Space>
              </div>

              <Collapse className="mt-4" bordered={false} ghost>
                {artist.albums.map((album) => {
                  const albumSelected = !!selectedAlbums[album.collectionId]
                  return (
                    <Collapse.Panel
                      key={album.collectionId}
                      header={
                        <div className="flex flex-wrap items-center gap-3">
                          <Checkbox
                            checked={albumSelected}
                            onChange={(event) =>
                              toggleAlbumSelection(album.collectionId, event.target.checked)
                            }
                          >
                            <span className="font-medium text-slate-900">
                              {album.collectionName}
                            </span>
                          </Checkbox>
                          {album.isNewAlbum ? (
                            <Tag color="purple">New album</Tag>
                          ) : (
                            <Tag color="blue">New tracks</Tag>
                          )}
                          <Text type="secondary">
                            {album.tracks.length} track{album.tracks.length > 1 ? 's' : ''}
                          </Text>
                        </div>
                      }
                    >
                      <List
                        dataSource={album.tracks}
                        renderItem={(track) => {
                          const trackSelected = !!selectedTracks[track.trackId]
                          const disabled = albumSelected
                          const minutes = track.trackTimeMillis
                            ? Math.floor(track.trackTimeMillis / 60000)
                            : null
                          const seconds = track.trackTimeMillis
                            ? Math.floor((track.trackTimeMillis % 60000) / 1000)
                            : null
                          return (
                            <List.Item className="px-0">
                              <Space className="w-full justify-between">
                                <Space>
                                  <Checkbox
                                    checked={trackSelected}
                                    disabled={disabled}
                                    onChange={(event) =>
                                      toggleTrackSelection(track.trackId, event.target.checked)
                                    }
                                  >
                                    <span className="font-medium text-slate-900">
                                      {track.trackNumber ? `${track.trackNumber}. ` : ''}
                                      {track.trackName}
                                    </span>
                                  </Checkbox>
                                </Space>
                                <Text type="secondary" className="font-mono text-xs">
                                  {minutes !== null && seconds !== null
                                    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
                                    : '—'}
                                </Text>
                              </Space>
                            </List.Item>
                          )
                        }}
                      />
                      {albumSelected && (
                        <Alert
                          type="info"
                          showIcon
                          className="mt-2"
                          message="Album is selected for import. Track-level selections are ignored while the album checkbox is enabled."
                        />
                      )}
                    </Collapse.Panel>
                  )
                })}
              </Collapse>
            </Card>
          ))}
        </Space>
      )}
    </div>
  )
}
