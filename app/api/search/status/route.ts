import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { entity, ids } = body

    if (!entity || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ existing: {} }, { headers: corsHeaders() })
    }

    const existing: Record<string, any> = {}

    if (entity === 'musicArtist') {
      // Check artists by itunesId
      const artists = await prisma.artist.findMany({
        where: {
          itunesId: {
            in: ids.map(String),
          },
        },
        select: {
          id: true,
          itunesId: true,
        },
      })

      artists.forEach((artist) => {
        if (artist.itunesId) {
          existing[artist.itunesId] = { artistId: artist.id }
        }
      })
    } else if (entity === 'album') {
      // Albums are not saved directly anymore, return empty
      return NextResponse.json({ existing: {} }, { headers: corsHeaders() })
    } else if (entity === 'song') {
      // Check tracks by itunesId
      const tracks = await prisma.track.findMany({
        where: {
          itunesId: {
            in: ids.map(String),
          },
        },
        select: {
          id: true,
          itunesId: true,
        },
      })

      tracks.forEach((track) => {
        if (track.itunesId) {
          existing[track.itunesId] = { trackId: track.id }
        }
      })
    }

    return NextResponse.json({ existing }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Check existing status error:', error)
    return NextResponse.json({ existing: {} }, { headers: corsHeaders() })
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
