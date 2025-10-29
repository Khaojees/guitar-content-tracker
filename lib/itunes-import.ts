import { prisma } from '@/lib/prisma'
import { Prisma, type Album, type Artist, type Track } from '@prisma/client'

type EnsureArtistOptions = {
  name: string
  imageUrl?: string | null
  syncEnabled?: boolean
}

type EnsureAlbumOptions = {
  name: string
  imageUrl?: string | null
}

type TrackInfo = {
  trackId: number
  trackName: string
  trackTimeMillis?: number | null
  trackNumber?: number | null
}

type TrackWithCollection = TrackInfo & {
  collectionId: number
  collectionName: string
  artistId: number
  artistName: string
  artworkUrl100?: string | null
}

const ITUNES_BASE = 'https://itunes.apple.com'

const normalizeArtwork = (artworkUrl?: string | null) => {
  if (!artworkUrl) return null
  return artworkUrl.replace('100x100bb', '600x600bb')
}

type ImportAlbumOptions = {
  existingArtist?: Artist | null
}

async function fetchItunes(endpoint: string) {
  const response = await fetch(`${ITUNES_BASE}${endpoint}`)

  if (!response.ok) {
    throw new Error(`iTunes request failed: ${response.status}`)
  }

  return response.json()
}

export async function ensureArtistFromItunes(
  externalArtistId: number,
  options: EnsureArtistOptions & { syncEnabled?: boolean } = { name: 'Unknown artist' }
): Promise<Artist> {
  const externalId = String(externalArtistId)

  const existingSource = await prisma.source.findUnique({
    where: {
      type_externalId: {
        type: 'itunes_artist',
        externalId,
      },
    },
    include: {
      artist: true,
    },
  })

  if (existingSource?.artist) {
    if (!existingSource.artist.imageUrl && options.imageUrl) {
      return prisma.artist.update({
        where: { id: existingSource.artist.id },
        data: { imageUrl: normalizeArtwork(options.imageUrl) },
      })
    }

    return existingSource.artist
  }

  const artist = await prisma.artist.create({
    data: {
      name: options.name,
      imageUrl: normalizeArtwork(options.imageUrl),
      syncEnabled: options.syncEnabled ?? true,
      sources: {
        create: {
          type: 'itunes_artist',
          externalId,
        },
      },
    },
  })

  return artist
}

export async function ensureAlbumFromItunes(
  artist: Artist,
  externalAlbumId: number,
  options: EnsureAlbumOptions
): Promise<{ album: Album; created: boolean }> {
  const externalId = String(externalAlbumId)

  const existingSource = await prisma.source.findUnique({
    where: {
      type_externalId: {
        type: 'itunes_album',
        externalId,
      },
    },
    include: {
      album: true,
    },
  })

  if (existingSource?.album) {
    if (!existingSource.album.imageUrl && options.imageUrl) {
      const updatedAlbum = await prisma.album.update({
        where: { id: existingSource.album.id },
        data: {
          imageUrl: normalizeArtwork(options.imageUrl),
        },
      })

      return { album: updatedAlbum, created: false }
    }

    return { album: existingSource.album, created: false }
  }

  const album = await prisma.album.create({
    data: {
      name: options.name,
      imageUrl: normalizeArtwork(options.imageUrl),
      artistId: artist.id,
      sources: {
        create: {
          type: 'itunes_album',
          externalId,
        },
      },
    },
  })

  return { album, created: true }
}

async function createTrackIfMissing(
  album: Album,
  trackInfo: TrackInfo
): Promise<{ track: Track; created: boolean }> {
  const externalId = String(trackInfo.trackId)

  const existingTrackSource = await prisma.source.findUnique({
    where: {
      type_externalId: {
        type: 'itunes_track',
        externalId,
      },
    },
    include: {
      track: true,
    },
  })

  if (existingTrackSource?.track) {
    return { track: existingTrackSource.track, created: false }
  }

  const track = await prisma.track.create({
    data: {
      name: trackInfo.trackName || 'Untitled Track',
      duration: trackInfo.trackTimeMillis ?? null,
      trackNumber: trackInfo.trackNumber ?? null,
      albumId: album.id,
      sources: {
        create: {
          type: 'itunes_track',
          externalId,
        },
      },
      trackStatus: {
        create: {
          status: 'idea',
          starred: false,
          ignored: false,
        },
      },
    },
  })

  return { track, created: true }
}

export async function importAlbumFromItunes(
  collectionId: number,
  options: ImportAlbumOptions = {}
) {
  const lookupData = await fetchItunes(`/lookup?id=${collectionId}&entity=song&limit=200`)

  if (!lookupData?.results?.length) {
    throw new Error('Album not found on iTunes')
  }

  const collectionEntry =
    lookupData.results.find(
      (item: any) =>
        (item.wrapperType === 'collection' || item.collectionType === 'Album') &&
        item.collectionId === collectionId
    ) || lookupData.results[0]

  if (!collectionEntry?.artistId || !collectionEntry?.collectionId) {
    throw new Error('Album data incomplete from iTunes')
  }

  const artistEnsureOptions = {
    name: collectionEntry.artistName || 'Unknown Artist',
    imageUrl: collectionEntry.artworkUrl100,
    syncEnabled: false,
  }

  let artist: Artist

  if (options.existingArtist) {
    artist = options.existingArtist

    if (!artist.imageUrl && collectionEntry.artworkUrl100) {
      artist = await prisma.artist.update({
        where: { id: artist.id },
        data: {
          imageUrl: normalizeArtwork(collectionEntry.artworkUrl100),
        },
      })
    }
  } else {
    artist = await ensureArtistFromItunes(collectionEntry.artistId, artistEnsureOptions)
  }

  const { album, created: createdAlbum } = await ensureAlbumFromItunes(artist, collectionEntry.collectionId, {
    name: collectionEntry.collectionName || 'Untitled Album',
    imageUrl: collectionEntry.artworkUrl100,
  })

  const trackEntries = lookupData.results.filter(
    (item: any) => item.wrapperType === 'track' && item.trackId
  )

  const createdTracks: Track[] = []

  const trackIds = trackEntries
    .map((entry: any) => entry.trackId)
    .filter((trackId: number | null | undefined): trackId is number => typeof trackId === 'number')

  const existingSources =
    trackIds.length > 0
      ? await prisma.source.findMany({
          where: {
            type: 'itunes_track',
            externalId: {
              in: trackIds.map(String),
            },
          },
          select: {
            externalId: true,
          },
        })
      : []

  const existingTrackIds = new Set(existingSources.map((source) => source.externalId))
  const tracksToCreate = trackEntries.filter(
    (entry: any) =>
      entry.trackId && !existingTrackIds.has(String(entry.trackId))
  )

  const TRACK_CONCURRENCY_LIMIT = 10

  for (let index = 0; index < tracksToCreate.length; index += TRACK_CONCURRENCY_LIMIT) {
    const batch = tracksToCreate.slice(index, index + TRACK_CONCURRENCY_LIMIT)

    const batchResults = await Promise.all(
      batch.map(async (entry: any) => {
        try {
          const track = await prisma.track.create({
            data: {
              name: entry.trackName || 'Untitled Track',
              duration: entry.trackTimeMillis ?? null,
              trackNumber: entry.trackNumber ?? null,
              albumId: album.id,
              sources: {
                create: {
                  type: 'itunes_track',
                  externalId: String(entry.trackId),
                },
              },
              trackStatus: {
                create: {
                  status: 'idea',
                  starred: false,
                  ignored: false,
                },
              },
            },
          })

          return track
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            return null
          }

          throw error
        }
      })
    )

    for (const track of batchResults) {
      if (track) {
        createdTracks.push(track)
      }
    }
  }

  return {
    artist,
    album,
    createdAlbum,
    createdTrackCount: createdTracks.length,
    createdTracks,
  }
}

export async function importTrackFromItunes(trackId: number) {
  const lookupData = await fetchItunes(`/lookup?id=${trackId}`)

  if (!lookupData?.results?.length) {
    throw new Error('Track not found on iTunes')
  }

  const trackEntry = lookupData.results.find((item: any) => item.trackId === trackId) || lookupData.results[0]

  if (!trackEntry?.collectionId || !trackEntry?.artistId) {
    throw new Error('Track data incomplete from iTunes')
  }

  const artist = await ensureArtistFromItunes(trackEntry.artistId, {
    name: trackEntry.artistName || 'Unknown Artist',
    imageUrl: trackEntry.artworkUrl100,
    syncEnabled: false,
  })

  const { album } = await ensureAlbumFromItunes(artist, trackEntry.collectionId, {
    name: trackEntry.collectionName || 'Untitled Album',
    imageUrl: trackEntry.artworkUrl100,
  })

  const { track, created } = await createTrackIfMissing(album, {
    trackId: trackEntry.trackId,
    trackName: trackEntry.trackName,
    trackTimeMillis: trackEntry.trackTimeMillis ?? null,
    trackNumber: trackEntry.trackNumber ?? null,
  })

  return {
    artist,
    album,
    track,
    created,
  }
}
