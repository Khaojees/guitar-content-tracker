import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchTrackFromItunes, normalizeArtwork } from '@/lib/itunes'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { trackId, artistId: artistIdFromBody } = body ?? {}

    if (!trackId) {
      return NextResponse.json(
        { error: 'trackId is required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const itunesTrackId = String(trackId)

    // Check if track already exists
    const existingTrack = await prisma.track.findUnique({
      where: { itunesId: itunesTrackId },
      include: { trackStatus: true },
    })

    if (existingTrack) {
      return NextResponse.json({
        message: 'Track already exists',
        trackId: existingTrack.id,
        artistId: existingTrack.artistId,
        track: existingTrack,
        created: false,
      }, { headers: corsHeaders() })
    }

    // Fetch track data from iTunes
    const trackData = await fetchTrackFromItunes(trackId)

    // Find or create artist
    let artist = await prisma.artist.findUnique({
      where: { itunesId: String(trackData.artistId) },
    })

    // If artistId is provided from body (e.g., from artist detail page), use that instead
    if (artistIdFromBody) {
      const existingArtist = await prisma.artist.findUnique({
        where: { id: parseInt(artistIdFromBody) },
      })
      if (existingArtist) {
        artist = existingArtist
      }
    }

    if (!artist) {
      // Create new artist if doesn't exist
      artist = await prisma.artist.create({
        data: {
          name: trackData.artistName,
          imageUrl: normalizeArtwork(trackData.artworkUrl100),
          itunesId: String(trackData.artistId),
        },
      })
    }

    // Create track
    const track = await prisma.track.create({
      data: {
        name: trackData.trackName,
        artistId: artist.id,
        albumName: trackData.collectionName,
        albumImage: normalizeArtwork(trackData.artworkUrl100),
        itunesId: itunesTrackId,
        duration: trackData.trackTimeMillis,
        trackNumber: trackData.trackNumber,
        trackStatus: {
          create: {
            status: 'idea',
            starred: false,
            ignored: false,
          },
        },
      },
      include: {
        trackStatus: true,
      },
    })

    return NextResponse.json({
      message: 'Track saved successfully',
      trackId: track.id,
      artistId: artist.id,
      track,
      created: true,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Save track error:', error)
    return NextResponse.json(
      { error: 'Failed to save track' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
