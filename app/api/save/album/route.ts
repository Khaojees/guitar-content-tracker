import { NextRequest, NextResponse } from 'next/server'
import { importAlbumFromItunes } from '@/lib/itunes-import'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { collectionId } = body ?? {}

    if (!collectionId) {
      return NextResponse.json(
        { error: 'collectionId is required' },
        { status: 400 }
      )
    }

    const result = await importAlbumFromItunes(Number(collectionId))

    return NextResponse.json({
      message: 'Album imported successfully',
      albumId: result.album.id,
      artistId: result.artist.id,
      createdAlbum: result.createdAlbum,
      createdTrackCount: result.createdTrackCount,
    })
  } catch (error) {
    console.error('Save album error:', error)
    return NextResponse.json(
      { error: 'Failed to import album' },
      { status: 500 }
    )
  }
}
