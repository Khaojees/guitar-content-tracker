import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (existingSource) {
      return NextResponse.json({
        message: 'Artist already exists',
        artistId: existingSource.artistId,
      })
    }

    // Fetch all albums and tracks from iTunes
    const albumsResponse = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`
    )
    const albumsData = await albumsResponse.json()

    // Create artist
    const artist = await prisma.artist.create({
      data: {
        name: artistName,
        imageUrl: imageUrl || null,
        syncEnabled: true,
        sources: {
          create: {
            type: 'itunes_artist',
            externalId: String(artistId),
          },
        },
      },
    })

    // Process albums
    const albums = albumsData.results.filter((item: any) => item.wrapperType === 'collection')

    for (const albumData of albums) {
      const collectionId = albumData.collectionId

      // Check if album exists
      const existingAlbum = await prisma.source.findUnique({
        where: {
          type_externalId: {
            type: 'itunes_album',
            externalId: String(collectionId),
          },
        },
      })

      if (!existingAlbum) {
        // Fetch tracks for this album
        const tracksResponse = await fetch(
          `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`
        )
        const tracksData = await tracksResponse.json()
        const tracks = tracksData.results.filter((item: any) => item.wrapperType === 'track')

        // Create album with tracks
        await prisma.album.create({
          data: {
            name: albumData.collectionName || 'ไม่ระบุอัลบั้ม',
            imageUrl: albumData.artworkUrl100 || albumData.artworkUrl60 || null,
            artistId: artist.id,
            sources: {
              create: {
                type: 'itunes_album',
                externalId: String(collectionId),
              },
            },
            tracks: {
              create: tracks.map((track: any) => ({
                name: track.trackName,
                duration: track.trackTimeMillis || null,
                trackNumber: track.trackNumber || null,
                sources: {
                  create: {
                    type: 'itunes_track',
                    externalId: String(track.trackId),
                  },
                },
                trackStatus: {
                  create: {
                    status: 'idea',
                    starred: false,
                    ignored: false,
                  },
                },
              })),
            },
          },
        })
      }
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
