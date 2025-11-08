import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, imageUrl } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อศิลปิน' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่ามีศิลปินชื่อนี้แล้วหรือยัง (case-insensitive)
    const existingArtist = await prisma.artist.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (existingArtist) {
      return NextResponse.json(
        { error: 'มีศิลปินชื่อนี้อยู่แล้ว' },
        { status: 400 }
      )
    }

    // สร้างศิลปินใหม่ (ไม่มี itunesId)
    const artist = await prisma.artist.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl?.trim() || null,
        itunesId: null, // manual artist ไม่มี iTunes reference
      },
    })

    // Revalidate หน้า artists list
    revalidatePath('/artists')

    return NextResponse.json({
      message: 'เพิ่มศิลปินเรียบร้อยแล้ว',
      artist,
    })
  } catch (error) {
    console.error('Add manual artist error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดระหว่างเพิ่มศิลปิน' },
      { status: 500 }
    )
  }
}
