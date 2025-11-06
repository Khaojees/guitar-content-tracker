import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { id } = await params
    const artistId = parseInt(id, 10)

    if (Number.isNaN(artistId)) {
      return NextResponse.json(
        { error: 'รหัสศิลปินไม่ถูกต้อง' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const tracks = await prisma.track.findMany({
      where: {
        artistId,
      },
      include: {
        trackStatus: true,
      },
      orderBy: [
        { albumName: 'asc' },
        { trackNumber: 'asc' },
        { name: 'asc' },
      ],
    })

    const albumsMap = new Map<
      string,
      {
        albumName: string
        albumImage: string | null
        tracks: any[]
      }
    >()

    tracks.forEach((track) => {
      const albumKey = track.albumName ?? 'อัลบั้มไม่ทราบชื่อ'
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          albumName: albumKey,
          albumImage: track.albumImage,
          tracks: [],
        })
      }

      albumsMap.get(albumKey)!.tracks.push({
        id: track.id,
        name: track.name,
        albumName: track.albumName ?? 'อัลบั้มไม่ทราบชื่อ',
        duration: track.duration,
        trackNumber: track.trackNumber,
        note: track.note ?? '',
        createdAt: track.createdAt,
        status: track.trackStatus?.status ?? 'idea',
        starred: Boolean(track.trackStatus?.starred),
        ignored: Boolean(track.trackStatus?.ignored),
      })
    })

    const albums = Array.from(albumsMap.values())

    return NextResponse.json({ albums }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Fetch artist tracks error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลเพลงได้' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS(request: Request) {
  return handleCors(request)
}
