import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeArtwork } from '@/lib/itunes'

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
      })
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
    })
  } catch (error) {
    console.error('Save artist error:', error)
    return NextResponse.json(
      { error: 'Failed to save artist' },
      { status: 500 }
    )
  }
}
