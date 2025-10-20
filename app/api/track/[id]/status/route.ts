import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trackId = parseInt(id)
    const body = await request.json()
    const { status, starred } = body

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Find or create TrackStatus
    const trackStatus = await prisma.trackStatus.upsert({
      where: {
        trackId: trackId,
      },
      update: {
        ...(status !== undefined && { status }),
        ...(starred !== undefined && { starred }),
      },
      create: {
        trackId: trackId,
        status: status || 'idea',
        starred: starred || false,
      },
    })

    return NextResponse.json({
      message: 'Status updated',
      trackStatus,
    })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
