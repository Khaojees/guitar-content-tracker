import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      artistId,
      name,
      albumName,
      albumImage,
      duration,
      trackNumber,
      note,
    } = body

    if (!artistId || !name || !name.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่ามี artist อยู่จริง
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
    })

    if (!artist) {
      return NextResponse.json(
        { error: 'ไม่พบศิลปิน' },
        { status: 404 }
      )
    }

    // สร้างเพลงใหม่ (manual - ไม่มี itunesId)
    const track = await prisma.track.create({
      data: {
        artistId,
        name: name.trim(),
        albumName: albumName?.trim() || null,
        albumImage: albumImage?.trim() || null,
        duration: duration ? duration * 1000 : null, // แปลงวินาทีเป็น milliseconds
        trackNumber: trackNumber || null,
        note: note?.trim() || null,
        itunesId: null, // manual track ไม่มี iTunes reference
      },
    })

    // สร้าง TrackStatus ให้เพลงใหม่
    await prisma.trackStatus.create({
      data: {
        trackId: track.id,
        status: 'idea',
        starred: false,
        ignored: false,
      },
    })

    // Revalidate หน้าที่เกี่ยวข้อง
    revalidatePath('/artists')
    revalidatePath(`/artists/${artistId}`)

    return NextResponse.json({
      message: 'เพิ่มเพลงเรียบร้อยแล้ว',
      track,
    })
  } catch (error) {
    console.error('Add manual track error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดระหว่างเพิ่มเพลง' },
      { status: 500 }
    )
  }
}
