import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeArtwork } from '@/lib/itunes'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { artistId, artistName, imageUrl } = body

    if (!artistId || !artistName) {
      return NextResponse.json(
        { error: 'artistId and artistName are required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const itunesId = String(artistId)

    // Check if artist already exists
    const existingArtist = await prisma.artist.findUnique({
      where: { itunesId },
    })

    if (existingArtist) {
      return NextResponse.json({
        message: 'Artist already exists',
        artistId: existingArtist.id,
        artist: existingArtist,
      }, { headers: corsHeaders() })
    }

    // Create new artist (simple, no sync!)
    const artist = await prisma.artist.create({
      data: {
        name: artistName,
        imageUrl: normalizeArtwork(imageUrl),
        itunesId,
      },
    })

    return NextResponse.json({
      message: 'Artist saved successfully',
      artistId: artist.id,
      artist,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Save artist error:', error)
    return NextResponse.json(
      { error: 'Failed to save artist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
