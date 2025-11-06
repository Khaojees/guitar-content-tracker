import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const trackId = parseInt(id)

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400, headers: corsHeaders() })
    }

    const body = await request.json()
    const { note } = body

    if (note === undefined) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400, headers: corsHeaders() })
    }

    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: { note },
    })

    return NextResponse.json({
      message: 'Track note updated successfully',
      track: updatedTrack,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Update track note error:', error)
    return NextResponse.json(
      { error: 'Failed to update track note' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const trackId = parseInt(id)

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400, headers: corsHeaders() })
    }

    // Cascade delete will handle trackStatus, postLogs, and sources
    await prisma.track.delete({
      where: { id: trackId },
    })

    return NextResponse.json({
      message: 'Track deleted successfully',
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Delete track error:', error)
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
