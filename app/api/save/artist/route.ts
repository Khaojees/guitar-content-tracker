import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureArtistFromItunes, importAlbumFromItunes } from '@/lib/itunes-import'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, artistName, imageUrl } = body

    if (!artistId || !artistName) {
      return NextResponse.json(
        { error: 'artistId and artistName are required' },
        { status: 400 }
      )
    }

    // Check if artist already exists
    const existingSource = await prisma.source.findUnique({
      where: {
        type_externalId: {
          type: 'itunes_artist',
          externalId: String(artistId),
        },
      },
      include: {
        artist: true,
      },
    })

    if (existingSource && existingSource.artistId) {
      // Artist exists - sync new tracks
      const albumsResponse = await fetch(
        `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`
      )
      const albumsData = await albumsResponse.json()

      const albums = albumsData.results.filter((item: any) => item.wrapperType === 'collection')
      const CONCURRENCY_LIMIT = 5

      let totalTracksCreated = 0

      for (let i = 0; i < albums.length; i += CONCURRENCY_LIMIT) {
        const batch = albums.slice(i, i + CONCURRENCY_LIMIT)

        const results = await Promise.allSettled(
          batch.map((albumData: any) => importAlbumFromItunes(albumData.collectionId))
        )

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            totalTracksCreated += result.value.createdTrackCount
          }
        })
      }

      const totalTracks = await prisma.track.count({
        where: {
          album: {
            artistId: existingSource.artistId,
          },
        },
      })

      return NextResponse.json({
        message: totalTracksCreated > 0 ? 'Synced new tracks' : 'Artist already exists',
        artistId: existingSource.artistId,
        totalTracks,
        newTracks: totalTracksCreated,
      })
    }

    // Create artist with ensureArtistFromItunes
    const artist = await ensureArtistFromItunes(artistId, {
      name: artistName,
      imageUrl: imageUrl || null,
      syncEnabled: true,
    })

    // Fetch all albums from iTunes
    const albumsResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`
    )
    const albumsData = await albumsResponse.json()

    // Process albums in parallel with concurrency limit
    const albums = albumsData.results.filter((item: any) => item.wrapperType === 'collection')
    const CONCURRENCY_LIMIT = 5

    let totalTracksCreated = 0

    for (let i = 0; i < albums.length; i += CONCURRENCY_LIMIT) {
      const batch = albums.slice(i, i + CONCURRENCY_LIMIT)

      const results = await Promise.allSettled(
        batch.map((albumData: any) => importAlbumFromItunes(albumData.collectionId))
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          totalTracksCreated += result.value.createdTrackCount
        }
      })
    }

    // Get total count
    const totalTracks = await prisma.track.count({
      where: {
        album: {
          artistId: artist.id,
        },
      },
    })

    return NextResponse.json({
      message: 'Artist saved successfully',
      artistId: artist.id,
      totalTracks,
    })
  } catch (error) {
    console.error('Save artist error:', error)
    return NextResponse.json(
      { error: 'Failed to save artist' },
      { status: 500 }
    )
  }
}
