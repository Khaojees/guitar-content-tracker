import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const trackId = parseInt(id)
    const body = await request.json()
    const { status, starred, ignored } = body

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400, headers: corsHeaders() })
    }

    // Find or create TrackStatus
    const trackStatus = await prisma.trackStatus.upsert({
      where: {
        trackId: trackId,
      },
      update: {
        ...(status !== undefined && { status }),
        ...(starred !== undefined && { starred }),
        ...(ignored !== undefined && { ignored }),
      },
      create: {
        trackId: trackId,
        status: status || 'idea',
        starred: starred || false,
        ignored: ignored || false,
      },
    })

    return NextResponse.json({
      message: 'Status updated',
      trackStatus,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
