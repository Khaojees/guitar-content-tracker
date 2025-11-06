import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'starred'

    let whereClause: any = {}

    if (mode === 'starred') {
      // Get all starred tracks with status 'idea' or 'ready'
      whereClause = {
        trackStatus: {
          starred: true,
          status: {
            in: ['idea', 'ready'],
          },
        },
      }
    } else {
      // mode === 'all': get all tracks but exclude 'posted' status
      whereClause = {
        OR: [
          {
            trackStatus: {
              status: {
                not: 'posted',
              },
            },
          },
          {
            trackStatus: null,
          },
        ],
      }
    }

    const tracks = await prisma.track.findMany({
      where: whereClause,
      include: {
        artist: true,
        trackStatus: true,
      },
    })

    if (tracks.length === 0) {
      return NextResponse.json({
        message: mode === 'starred' ? 'No starred tracks available' : 'No tracks available',
        track: null,
      }, { headers: corsHeaders() })
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
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Random starred error:', error)
    return NextResponse.json(
      { error: 'Failed to get random track' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
