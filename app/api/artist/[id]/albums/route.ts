import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchArtistAlbumsFromItunes, fetchAlbumTracksFromItunes } from '@/lib/itunes'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const artistId = parseInt(id)

    // Get artist from DB
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        tracks: {
          include: {
            trackStatus: true,
          },
        },
      },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404, headers: corsHeaders() })
    }

    if (!artist.itunesId) {
      return NextResponse.json(
        { error: 'Artist has no iTunes ID' },
        { status: 400, headers: corsHeaders() }
      )
    }

    // Fetch albums from iTunes (realtime!)
    const albums = await fetchArtistAlbumsFromItunes(artist.itunesId)

    // Fetch tracks for each album
    const albumsWithTracks = await Promise.all(
      albums.map(async (album: any) => {
        const tracks = await fetchAlbumTracksFromItunes(album.collectionId)

        // Map tracks with saved status from DB
        const tracksWithStatus = tracks.map((track: any) => {
          const savedTrack = artist.tracks.find(
            (t) => t.itunesId === String(track.trackId)
          )

          return {
            ...track,
            saved: !!savedTrack,
            dbTrackId: savedTrack?.id,
            trackStatus: savedTrack?.trackStatus,
          }
        })

        return {
          ...album,
          tracks: tracksWithStatus,
        }
      })
    )

    return NextResponse.json({
      artist: {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        itunesId: artist.itunesId,
      },
      albums: albumsWithTracks,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Fetch artist albums error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artist albums' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
