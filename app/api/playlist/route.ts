import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

// GET /api/playlist - ดึง playlist ทั้งหมด
export async function GET(request: Request) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        playlistTracks: {
          include: {
            track: {
              include: {
                artist: true,
                trackStatus: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(playlists, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

// POST /api/playlist - สร้าง playlist ใหม่
export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || null,
      },
    })

    return NextResponse.json(playlist, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
