import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const artistId = parseInt(id)

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { syncEnabled } = body ?? {}

    if (typeof syncEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'syncEnabled boolean is required' },
        { status: 400 }
      )
    }

    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: { syncEnabled },
    })

    return NextResponse.json({
      message: 'Artist sync preference updated',
      artist,
    })
  } catch (error) {
    console.error('Update artist error:', error)
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const artistId = parseInt(id)

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 })
    }

    // Cascade delete will handle albums, tracks, trackStatus, postLogs, and sources
    await prisma.artist.delete({
      where: { id: artistId },
    })

    return NextResponse.json({
      message: 'Artist deleted successfully',
    })
  } catch (error) {
    console.error('Delete artist error:', error)
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    )
  }
}
