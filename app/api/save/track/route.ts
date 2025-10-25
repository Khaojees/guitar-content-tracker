import { NextRequest, NextResponse } from 'next/server'
import { importTrackFromItunes } from '@/lib/itunes-import'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId } = body ?? {}

    if (!trackId) {
      return NextResponse.json(
        { error: 'trackId is required' },
        { status: 400 }
      )
    }

    const result = await importTrackFromItunes(Number(trackId))

    return NextResponse.json({
      message: result.created ? 'Track imported successfully' : 'Track already exists',
      trackId: result.track.id,
      albumId: result.album.id,
      artistId: result.artist.id,
      created: result.created,
    })
  } catch (error) {
    console.error('Save track error:', error)
    return NextResponse.json(
      { error: 'Failed to import track' },
      { status: 500 }
    )
  }
}
