import { NextRequest, NextResponse } from 'next/server'

const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params
    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })
    }

    const url = new URL(ITUNES_LOOKUP_URL)
    url.searchParams.set('id', collectionId)
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '200')

    const response = await fetch(url.toString())
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch album details from iTunes' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const tracks = (data.results || []).filter(
      (item: any) => item.wrapperType === 'track'
    )

    return NextResponse.json({
      tracks: tracks.map((track: any) => ({
        trackId: track.trackId,
        trackName: track.trackName,
        trackNumber: track.trackNumber ?? null,
        trackTimeMillis: track.trackTimeMillis ?? null,
        previewUrl: track.previewUrl ?? null,
      })),
    })
  } catch (error) {
    console.error('Album lookup error:', error)
    return NextResponse.json(
      { error: 'Unexpected error while fetching album details' },
      { status: 500 }
    )
  }
}
