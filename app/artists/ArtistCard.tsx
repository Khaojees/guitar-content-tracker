'use client'

import { useState } from 'react'
import { Card, Button, Badge, App } from 'antd'
import { DeleteOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type ArtistCardProps = {
  artist: {
    id: number
    name: string
    imageUrl: string | null
    albumsCount: number
    tracksCount: number
    importantTracksCount: number
  }
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter()
  const { modal, message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    modal.confirm({
      title: 'ลบศิลปินคนนี้ออกจากระบบ?',
      content: `หากลบศิลปิน "${artist.name}" เพลงและบันทึกทั้งหมดจะถูกลบถาวร`,
      okText: 'ลบศิลปิน',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleting(true)
        try {
          const response = await fetch(`/api/artist/${artist.id}`, { method: 'DELETE' })
          if (response.ok) {
            message.success('ลบศิลปินเรียบร้อยแล้ว')
            router.refresh()
          } else {
            message.error('ไม่สามารถลบศิลปินได้ กรุณาลองใหม่อีกครั้ง')
          }
        } catch (error) {
          console.error('Delete artist error:', error)
          message.error('เกิดข้อผิดพลาดระหว่างลบศิลปิน')
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="relative h-16 w-16">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                sizes="64px"
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                <UserOutlined className="text-2xl" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{artist.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
              <Badge count={artist.albumsCount} showZero color="blue" />
              <span>อัลบัม</span>
              <Badge count={artist.tracksCount} showZero color="green" />
              <span>เพลงทั้งหมด</span>
              {artist.importantTracksCount > 0 && (
                <>
                  <Badge count={artist.importantTracksCount} color="red" />
                  <span>เพลงสำคัญ</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <Link
          href={`/artists/${artist.id}`}
          className="flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <span>ดูรายละเอียด</span>
          <RightOutlined className="text-xs" />
        </Link>
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          loading={deleting}
          onClick={handleDelete}
        >
          ลบ
        </Button>
      </div>
    </Card>
  )
}
