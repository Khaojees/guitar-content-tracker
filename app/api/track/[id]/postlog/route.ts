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
    const { platform, url, postedAt } = body

    if (!trackId || !platform || !url) {
      return NextResponse.json(
        { error: 'trackId, platform, and url are required' },
        { status: 400, headers: corsHeaders() }
      )
    }

    // Get or create TrackStatus
    let trackStatus = await prisma.trackStatus.findUnique({
      where: { trackId: trackId },
    })

    if (!trackStatus) {
      trackStatus = await prisma.trackStatus.create({
        data: {
          trackId: trackId,
          status: 'posted',
          starred: false,
        },
      })
    } else {
      // Update status to 'posted'
      trackStatus = await prisma.trackStatus.update({
        where: { trackId: trackId },
        data: { status: 'posted' },
      })
    }

    // Create PostLog
    const postLog = await prisma.postLog.create({
      data: {
        trackStatusId: trackStatus.id,
        platform,
        url,
        postedAt: postedAt ? new Date(postedAt) : new Date(),
      },
    })

    return NextResponse.json({
      message: 'Post log created',
      postLog,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Create post log error:', error)
    return NextResponse.json(
      { error: 'Failed to create post log' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const trackId = parseInt(id)

    const trackStatus = await prisma.trackStatus.findUnique({
      where: { trackId: trackId },
      include: {
        postLogs: {
          orderBy: { postedAt: 'desc' },
        },
      },
    })

    if (!trackStatus) {
      return NextResponse.json({ postLogs: [] }, { headers: corsHeaders() })
    }

    return NextResponse.json({ postLogs: trackStatus.postLogs }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Get post logs error:', error)
    return NextResponse.json(
      { error: 'Failed to get post logs' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
