import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trackId = parseInt(id)

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { note } = body

    if (note === undefined) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: { note },
    })

    return NextResponse.json({
      message: 'Track note updated successfully',
      track: updatedTrack,
    })
  } catch (error) {
    console.error('Update track note error:', error)
    return NextResponse.json(
      { error: 'Failed to update track note' },
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
    const trackId = parseInt(id)

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Cascade delete will handle trackStatus, postLogs, and sources
    await prisma.track.delete({
      where: { id: trackId },
    })

    return NextResponse.json({
      message: 'Track deleted successfully',
    })
  } catch (error) {
    console.error('Delete track error:', error)
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    )
  }
}
