import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { importAlbumFromItunes } from '@/lib/itunes-import'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const artistId = parseInt(id, 10)

    if (!artistId) {
      return NextResponse.json(
        { error: 'Invalid artist ID' },
        { status: 400 }
      )
    }

    // Get artist with iTunes source
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        sources: {
          where: {
            type: 'itunes_artist',
          },
        },
      },
    })

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    const itunesSource = artist.sources[0]
    if (!itunesSource) {
      return NextResponse.json(
        { error: 'Artist has no iTunes source' },
        { status: 400 }
      )
    }

    // Fetch all albums from iTunes
    const albumsResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesSource.externalId}&entity=album&limit=200`
    )
    const albumsData = await albumsResponse.json()

    // Process albums in parallel with concurrency limit
    const albums = albumsData.results.filter((item: any) => item.wrapperType === 'collection')
    const CONCURRENCY_LIMIT = 5

    let totalTracksCreated = 0
    let totalAlbumsCreated = 0

    for (let i = 0; i < albums.length; i += CONCURRENCY_LIMIT) {
      const batch = albums.slice(i, i + CONCURRENCY_LIMIT)

      const results = await Promise.allSettled(
        batch.map((albumData: any) => importAlbumFromItunes(albumData.collectionId))
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          totalTracksCreated += result.value.createdTrackCount
          if (result.value.createdAlbum) {
            totalAlbumsCreated++
          }
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

    const totalAlbums = await prisma.album.count({
      where: {
        artistId: artist.id,
      },
    })

    return NextResponse.json({
      message: 'Sync completed',
      artistId: artist.id,
      artistName: artist.name,
      newTracks: totalTracksCreated,
      newAlbums: totalAlbumsCreated,
      totalTracks,
      totalAlbums,
    })
  } catch (error) {
    console.error('Sync artist error:', error)
    return NextResponse.json(
      { error: 'Failed to sync artist' },
      { status: 500 }
    )
  }
}
