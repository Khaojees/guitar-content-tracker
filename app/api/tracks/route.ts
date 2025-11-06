import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

// GET /api/tracks - ดึงเพลงทั้งหมด
export async function GET(request: Request) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const tracks = await prisma.track.findMany({
      include: {
        artist: true,
        trackStatus: true,
      },
      orderBy: [
        { artist: { name: 'asc' } },
        { albumName: 'asc' },
        { trackNumber: 'asc' },
      ],
    })

    return NextResponse.json(tracks, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
