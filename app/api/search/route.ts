import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term')
  const entity = searchParams.get('entity') || 'musicArtist' // musicArtist, song, album

  if (!term) {
    return NextResponse.json({ error: 'term is required' }, { status: 400 })
  }

  try {
    // iTunes Search API
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', term)
    url.searchParams.set('entity', entity)
    url.searchParams.set('limit', '50')
    url.searchParams.set('country', 'TH') // รองรับเพลงไทย

    const response = await fetch(url.toString())
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('iTunes API error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
