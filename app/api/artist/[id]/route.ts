import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const artistId = parseInt(id)

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400, headers: corsHeaders() })
    }

    // Cascade delete will handle tracks, trackStatus, postLogs, and playlistTracks
    await prisma.artist.delete({
      where: { id: artistId },
    })

    return NextResponse.json({
      message: 'Artist deleted successfully',
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Delete artist error:', error)
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
