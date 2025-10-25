import { NextRequest, NextResponse } from 'next/server'
import { importAlbumFromItunes, importTrackFromItunes } from '@/lib/itunes-import'

type ApplyAlbumSummary = {
  collectionId: number
  albumId: number
  artistId: number
  createdAlbum: boolean
  createdTrackCount: number
  error?: string
}

type ApplyTrackSummary = {
  trackId: number
  trackRecordId?: number
  albumId?: number
  artistId?: number
  created?: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const albumIds = Array.isArray(body?.albums)
      ? Array.from(
          new Set(
            body.albums
              .map((album: any) => album?.collectionId)
              .filter((id: unknown): id is number | string => !!id)
          )
        )
      : []
    const trackIds = Array.isArray(body?.tracks)
      ? Array.from(
          new Set(
            body.tracks
              .map((track: any) => track?.trackId)
              .filter((id: unknown): id is number | string => !!id)
          )
        )
      : []

    const albumSummaries: ApplyAlbumSummary[] = []
    const trackSummaries: ApplyTrackSummary[] = []

    for (const albumId of albumIds) {
      const numericId = Number(albumId)
      if (!Number.isFinite(numericId)) continue

      try {
        const result = await importAlbumFromItunes(numericId)

        albumSummaries.push({
          collectionId: numericId,
          albumId: result.album.id,
          artistId: result.artist.id,
          createdAlbum: result.createdAlbum,
          createdTrackCount: result.createdTrackCount,
        })
      } catch (error) {
        console.error('Apply album error:', error)
        albumSummaries.push({
          collectionId: numericId,
          albumId: 0,
          artistId: 0,
          createdAlbum: false,
          createdTrackCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    for (const trackId of trackIds) {
      const numericId = Number(trackId)
      if (!Number.isFinite(numericId)) continue

      try {
        const result = await importTrackFromItunes(numericId)

        trackSummaries.push({
          trackId: numericId,
          trackRecordId: result.track.id,
          albumId: result.album.id,
          artistId: result.artist.id,
          created: result.created,
        })
      } catch (error) {
        console.error('Apply track error:', error)
        trackSummaries.push({
          trackId: numericId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      albums: albumSummaries,
      tracks: trackSummaries,
    })
  } catch (error) {
    console.error('Sync apply error:', error)
    return NextResponse.json(
      { error: 'Failed to apply sync' },
      { status: 500 }
    )
  }
}
