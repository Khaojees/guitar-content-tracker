import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const albumId = parseInt(id)

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 })
    }

    // Cascade delete will handle tracks, trackStatus, postLogs, and sources
    await prisma.album.delete({
      where: { id: albumId },
    })

    return NextResponse.json({
      message: 'Album deleted successfully',
    })
  } catch (error) {
    console.error('Delete album error:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
