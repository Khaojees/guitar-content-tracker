import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all starred tracks with status 'idea' or 'ready'
    const starredTracks = await prisma.trackStatus.findMany({
      where: {
        starred: true,
        status: {
          in: ['idea', 'ready'],
        },
      },
      include: {
        track: {
          include: {
            artist: true,
          },
        },
      },
    })

    if (starredTracks.length === 0) {
      return NextResponse.json({
        message: 'No starred tracks available',
        track: null,
      })
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * starredTracks.length)
    const selected = starredTracks[randomIndex]

    return NextResponse.json({
      track: {
        id: selected.track.id,
        name: selected.track.name,
        duration: selected.track.duration,
        albumName: selected.track.albumName,
        albumImage: selected.track.albumImage,
        artist: {
          id: selected.track.artist.id,
          name: selected.track.artist.name,
          imageUrl: selected.track.artist.imageUrl,
        },
        status: selected.status,
        starred: selected.starred,
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
