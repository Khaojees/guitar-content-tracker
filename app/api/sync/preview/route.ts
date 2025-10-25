import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type PreviewTrack = {
  trackId: number
  trackName: string
  trackTimeMillis?: number | null
  trackNumber?: number | null
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

const ITUNES_LOOKUP = (id: string | number, params: Record<string, string> = {}) => {
  const url = new URL('https://itunes.apple.com/lookup')
  url.searchParams.set('id', String(id))
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}

async function fetchJson(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

async function buildArtistPreview(artist: PreviewArtist): Promise<PreviewArtist | null> {
  try {
    const [existingAlbumSources, existingTrackSources] = await Promise.all([
      prisma.source.findMany({
        where: {
          type: 'itunes_album',
          album: {
            artistId: artist.artistId,
          },
        },
        select: {
          externalId: true,
          albumId: true,
        },
      }),
      prisma.source.findMany({
        where: {
          type: 'itunes_track',
          track: {
            album: {
              artistId: artist.artistId,
            },
          },
        },
        select: {
          externalId: true,
        },
      }),
    ])

    const existingAlbumMap = new Map(
      existingAlbumSources.map((item) => [item.externalId, item.albumId])
    )
    const existingTrackIds = new Set(existingTrackSources.map((item) => item.externalId))

    const albumsResponse = await fetchJson(
      ITUNES_LOOKUP(artist.externalArtistId, {
        entity: 'album',
        limit: '200',
        sort: 'recent',
      })
    )

    const albumEntries = (albumsResponse.results || []).filter(
      (item: any) => item.wrapperType === 'collection'
    )

    const previewAlbums: PreviewAlbum[] = []

    for (const albumEntry of albumEntries) {
      const collectionId = albumEntry.collectionId
      if (!collectionId) continue

      const collectionKey = String(collectionId)
      const existingAlbumId = existingAlbumMap.get(collectionKey)
      const isNewAlbum = !existingAlbumId

      const trackLookup = await fetchJson(
        ITUNES_LOOKUP(collectionId, {
          entity: 'song',
          limit: '200',
        })
      )

      const trackEntries = (trackLookup.results || []).filter(
        (item: any) => item.wrapperType === 'track'
      )

      const newTracks: PreviewTrack[] = []

      for (const trackEntry of trackEntries) {
        const trackId = trackEntry.trackId
        if (!trackId) continue

        const trackKey = String(trackId)
        if (!isNewAlbum && existingTrackIds.has(trackKey)) {
          continue
        }

        newTracks.push({
          trackId,
          trackName: trackEntry.trackName,
          trackNumber: trackEntry.trackNumber ?? null,
          trackTimeMillis: trackEntry.trackTimeMillis ?? null,
          collectionId,
          collectionName: albumEntry.collectionName,
          artworkUrl100: trackEntry.artworkUrl100 || albumEntry.artworkUrl100,
        })
      }

      if (newTracks.length === 0) {
        continue
      }

      const previewAlbum: PreviewAlbum = {
        collectionId,
        collectionName: albumEntry.collectionName ?? 'Untitled Album',
        artworkUrl100: albumEntry.artworkUrl100,
        isNewAlbum,
        tracks: newTracks,
      }

      if (!isNewAlbum && existingAlbumId !== undefined && existingAlbumId !== null) {
        previewAlbum.existingAlbumId = existingAlbumId
      }

      previewAlbums.push(previewAlbum)
    }

    if (previewAlbums.length === 0) {
      return null
    }

    return {
      ...artist,
      albums: previewAlbums,
    }
  } catch (error) {
    console.error('Preview build error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const artistIds: number[] | undefined = body?.artistIds

    const artists = await prisma.artist.findMany({
      where: {
        ...(artistIds?.length
          ? { id: { in: artistIds } }
          : { syncEnabled: true }),
      },
      include: {
        sources: {
          where: {
            type: 'itunes_artist',
          },
        },
      },
    })

    const candidates = artists
      .map((artist) => {
        const source = artist.sources[0]
        if (!source) return null

        return {
          artistId: artist.id,
          artistName: artist.name,
          externalArtistId: source.externalId,
          syncEnabled: artist.syncEnabled,
          albums: [] as PreviewAlbum[],
        }
      })
      .filter(Boolean) as PreviewArtist[]

    const previews = await Promise.all(candidates.map((artist) => buildArtistPreview(artist)))

    return NextResponse.json({
      artists: previews.filter((artist): artist is PreviewArtist => Boolean(artist)),
    })
  } catch (error) {
    console.error('Sync preview error:', error)
    return NextResponse.json(
      { error: 'Failed to build sync preview' },
      { status: 500 }
    )
  }
}
