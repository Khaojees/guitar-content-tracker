import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders, handleCors } from '@/lib/cors'

type ArtistResult = {
  artistId?: number
  artworkUrl60?: string | null
  artworkUrl100?: string | null
  artworkUrl600?: string | null
  [key: string]: unknown
}

async function enhanceArtistArtwork(results: ArtistResult[]) {
  return Promise.all(
    results.map(async (item) => {
      if (item?.artworkUrl100 || !item?.artistId) {
        return item
      }

      try {
        const lookupUrl = new URL('https://itunes.apple.com/lookup')
        lookupUrl.searchParams.set('id', String(item.artistId))
        lookupUrl.searchParams.set('entity', 'album')
        lookupUrl.searchParams.set('limit', '1')
        lookupUrl.searchParams.set('country', 'TH')

        const lookupResponse = await fetch(lookupUrl.toString())
        const lookupData = await lookupResponse.json()

        const albumArtwork = lookupData.results?.find(
          (entry: any) =>
            entry?.artworkUrl100 &&
            (entry.collectionType === 'Album' || entry.wrapperType === 'collection')
        )

        if (albumArtwork?.artworkUrl100) {
          const artworkUrl100: string = albumArtwork.artworkUrl100

          return {
            ...item,
            artworkUrl60:
              albumArtwork.artworkUrl60 ||
              artworkUrl100.replace('100x100bb', '60x60bb'),
            artworkUrl100,
            artworkUrl600: artworkUrl100.replace('100x100bb', '600x600bb'),
          }
        }
      } catch (lookupError) {
        console.warn('Artist lookup fallback failed:', lookupError)
      }

      return item
    })
  )
}

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('term')
  const entity = searchParams.get('entity') || 'musicArtist' // musicArtist, song, album

  if (!term) {
    return NextResponse.json({ error: 'term is required' }, { status: 400, headers: corsHeaders() })
  }

  try {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', term)
    url.searchParams.set('entity', entity)
    url.searchParams.set('limit', '50')
    url.searchParams.set('country', 'TH')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (entity === 'musicArtist' && Array.isArray(data.results)) {
      data.results = await enhanceArtistArtwork(data.results as ArtistResult[])
    }

    return NextResponse.json(data, { headers: corsHeaders() })
  } catch (error) {
    console.error('iTunes API error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500, headers: corsHeaders() })
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}

