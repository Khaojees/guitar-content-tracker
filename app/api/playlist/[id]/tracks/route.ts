import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/playlist/[id]/tracks - เพิ่มเพลงเข้า playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const playlistId = parseInt(id)

    if (isNaN(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { trackId } = body

    if (!trackId || typeof trackId !== 'number') {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าเพลงนี้อยู่ใน playlist แล้วหรือไม่
    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Track already in playlist' },
        { status: 400 }
      )
    }

    // หาลำดับล่าสุด
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' },
    })

    const order = lastTrack ? lastTrack.order + 1 : 0

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        order,
      },
      include: {
        track: {
          include: {
            artist: true,
            trackStatus: true,
          },
        },
      },
    })

    // Update playlist updatedAt
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(playlistTrack)
  } catch (error) {
    console.error('Error adding track to playlist:', error)
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/playlist/[id]/tracks - ลบเพลงออกจาก playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const playlistId = parseInt(id)

    if (isNaN(playlistId)) {
      return NextResponse.json(
        { error: 'Invalid playlist ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const trackId = parseInt(searchParams.get('trackId') || '')

    if (isNaN(trackId)) {
      return NextResponse.json(
        { error: 'Invalid track ID' },
        { status: 400 }
      )
    }

    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    })

    // Update playlist updatedAt
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing track from playlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove track from playlist' },
      { status: 500 }
    )
  }
}
