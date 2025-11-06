import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

// GET /api/playlist/[id] - ดึง playlist ตาม id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const playlistId = parseInt(id)

    if (isNaN(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
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
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404, headers: corsHeaders() }
      )
    }

    return NextResponse.json(playlist, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

// PATCH /api/playlist/[id] - แก้ไขชื่อ playlist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const playlistId = parseInt(id)

    if (isNaN(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const body = await request.json()
    const { name, description } = body

    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(playlist, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

// DELETE /api/playlist/[id] - ลบ playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const playlistId = parseInt(id)

    if (isNaN(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID' },
        { status: 400, headers: corsHeaders() }
      )
    }

    await prisma.playlist.delete({
      where: { id: playlistId },
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
