import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all starred tracks with status 'idea' or 'ready'
    const tracks = await prisma.track.findMany({
      where: {
        trackStatus: {
          starred: true,
          status: {
            in: ['idea', 'ready'],
          },
        },
      },
      include: {
        artist: true,
        trackStatus: true,
      },
    })

    if (tracks.length === 0) {
      return NextResponse.json({
        message: 'No starred tracks available',
        track: null,
      })
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * tracks.length)
    const selected = tracks[randomIndex]

    return NextResponse.json({
      track: {
        id: selected.id,
        name: selected.name,
        duration: selected.duration,
        artist: {
          id: selected.artist.id,
          name: selected.artist.name,
        },
        album: {
          name: selected.albumName,
          imageUrl: selected.albumImage,
        },
        status: selected.trackStatus?.status || 'idea',
        starred: selected.trackStatus?.starred || false,
      },
    })
  } catch (error) {
    console.error('Random starred error:', error)
    return NextResponse.json(
      { error: 'Failed to get random track' },
      { status: 500 }
    )
  }
}
