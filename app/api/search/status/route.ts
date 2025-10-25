import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type EntityType = 'musicArtist' | 'album' | 'song'

const VALID_ENTITIES: EntityType[] = ['musicArtist', 'album', 'song']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const entity = body?.entity as EntityType
    const ids = (body?.ids ?? []) as Array<string | number>

    if (!entity || !VALID_ENTITIES.includes(entity)) {
      return NextResponse.json(
        { error: 'Invalid entity' },
        { status: 400 }
      )
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ existing: {} })
    }

    const externalIds = ids.map((id) => String(id))

    if (entity === 'musicArtist') {
      const sources = await prisma.source.findMany({
        where: {
          type: 'itunes_artist',
          externalId: {
            in: externalIds,
          },
        },
        select: {
          externalId: true,
          artistId: true,
        },
      })

      return NextResponse.json({
        existing: Object.fromEntries(
          sources.map((source) => [
            source.externalId,
            { artistId: source.artistId },
          ])
        ),
      })
    }

    if (entity === 'album') {
      const sources = await prisma.source.findMany({
        where: {
          type: 'itunes_album',
          externalId: {
            in: externalIds,
          },
        },
        select: {
          externalId: true,
          albumId: true,
        },
      })

      return NextResponse.json({
        existing: Object.fromEntries(
          sources.map((source) => [
            source.externalId,
            { albumId: source.albumId },
          ])
        ),
      })
    }

    const sources = await prisma.source.findMany({
      where: {
        type: 'itunes_track',
        externalId: {
          in: externalIds,
        },
      },
      select: {
        externalId: true,
        trackId: true,
      },
    })

    return NextResponse.json({
      existing: Object.fromEntries(
        sources.map((source) => [
          source.externalId,
          { trackId: source.trackId },
        ])
      ),
    })
  } catch (error) {
    console.error('Search status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search status' },
      { status: 500 }
    )
  }
}
