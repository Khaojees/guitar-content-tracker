'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, App, Select, Radio } from 'antd'
import { useRouter } from 'next/navigation'

type AddTrackModalProps = {
  open: boolean
  onClose: () => void
  artistId: number
  artistName: string
  onTrackAdded?: () => void
}

type FormValues = {
  name: string
  albumMode: 'existing' | 'new' | 'none'
  existingAlbumName?: string
  newAlbumName?: string
  albumImage?: string
  duration?: number
  trackNumber?: number
  note?: string
}

type Album = {
  albumName: string
  albumImage: string | null
  tracks: { trackNumber: number | null }[]
}

export default function AddTrackModal({
  open,
  onClose,
  artistId,
  artistName,
  onTrackAdded,
}: AddTrackModalProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumMode, setAlbumMode] = useState<'existing' | 'new' | 'none'>('none')
  const { message } = App.useApp()
  const router = useRouter()

  // ดึงรายการอัลบั้มที่มีอยู่แล้ว
  useEffect(() => {
    if (open) {
      fetchAlbums()
      form.setFieldValue('albumMode', 'none')
      setAlbumMode('none')
    }
  }, [open, artistId])

  const fetchAlbums = async () => {
    setLoadingAlbums(true)
    try {
      const response = await fetch(`/api/artist/${artistId}/tracks`)
      if (response.ok) {
        const data = await response.json()
        // Extract unique albums with tracks
        const uniqueAlbums = data.albums
          .filter((a: any) => a.albumName !== 'อัลบั้มไม่ทราบชื่อ')
          .map((a: any) => ({
            albumName: a.albumName,
            albumImage: a.albumImage,
            tracks: a.tracks,
          }))
        setAlbums(uniqueAlbums)
      }
    } catch (error) {
      console.error('Fetch albums error:', error)
    } finally {
      setLoadingAlbums(false)
    }
  }

  // คำนวณ track number ถัดไปของอัลบั้ม
  const getNextTrackNumber = (albumName: string): number => {
    const album = albums.find(a => a.albumName === albumName)
    if (!album || album.tracks.length === 0) return 1

    const trackNumbers = album.tracks
      .map(t => t.trackNumber)
      .filter((n): n is number => n !== null)

    if (trackNumbers.length === 0) return 1

    return Math.max(...trackNumbers) + 1
  }

  // Auto-fill track number เมื่อเลือกอัลบั้ม
  const handleAlbumChange = (selectedAlbumName: string) => {
    const nextTrackNumber = getNextTrackNumber(selectedAlbumName)
    form.setFieldValue('trackNumber', nextTrackNumber)
  }

  // Auto-fill track number = 1 เมื่อสร้างอัลบั้มใหม่
  const handleAlbumModeChange = (mode: 'existing' | 'new' | 'none') => {
    setAlbumMode(mode)
    if (mode === 'new') {
      form.setFieldValue('trackNumber', 1)
    } else if (mode === 'none') {
      form.setFieldValue('trackNumber', null)
    }
  }

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      let albumName = null
      let albumImage = null

      if (values.albumMode === 'existing' && values.existingAlbumName) {
        const selectedAlbum = albums.find(a => a.albumName === values.existingAlbumName)
        albumName = values.existingAlbumName
        albumImage = selectedAlbum?.albumImage || null
      } else if (values.albumMode === 'new' && values.newAlbumName) {
        albumName = values.newAlbumName.trim()
        albumImage = values.albumImage?.trim() || null
      }

      const response = await fetch('/api/track/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          name: values.name.trim(),
          albumName,
          albumImage,
          duration: values.duration || null,
          trackNumber: values.trackNumber || null,
          note: values.note?.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        message.success('เพิ่มเพลงเรียบร้อยแล้ว')
        form.resetFields()
        setAlbumMode('none')
        onClose()
        router.refresh()
        onTrackAdded?.()
      } else {
        message.error(data.error || 'ไม่สามารถเพิ่มเพลงได้')
      }
    } catch (error) {
      console.error('Add track error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเพิ่มเพลง')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setAlbumMode('none')
    onClose()
  }

  return (
    <Modal
      title={`เพิ่มเพลงให้ ${artistName}`}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText="เพิ่มเพลง"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="pt-4"
        initialValues={{ albumMode: 'none' }}
      >
        <Form.Item
          label="ชื่อเพลง"
          name="name"
          rules={[
            { required: true, message: 'กรุณากรอกชื่อเพลง' },
            { max: 200, message: 'ชื่อเพลงต้องไม่เกิน 200 ตัวอักษร' },
          ]}
        >
          <Input placeholder="ชื่อเพลง" />
        </Form.Item>

        <Form.Item
          label="อัลบั้ม"
          name="albumMode"
        >
          <Radio.Group
            onChange={(e) => handleAlbumModeChange(e.target.value)}
            value={albumMode}
          >
            <Radio value="none">ไม่ระบุอัลบั้ม</Radio>
            {albums.length > 0 && <Radio value="existing">เลือกจากที่มีอยู่</Radio>}
            <Radio value="new">สร้างอัลบั้มใหม่</Radio>
          </Radio.Group>
        </Form.Item>

        {albumMode === 'existing' && (
          <Form.Item
            label="เลือกอัลบั้ม"
            name="existingAlbumName"
            rules={[
              { required: true, message: 'กรุณาเลือกอัลบั้ม' },
            ]}
          >
            <Select
              placeholder="เลือกอัลบั้ม"
              loading={loadingAlbums}
              onChange={handleAlbumChange}
              options={albums.map(a => ({
                label: a.albumName,
                value: a.albumName,
              }))}
            />
          </Form.Item>
        )}

        {albumMode === 'new' && (
          <>
            <Form.Item
              label="ชื่อออัลบั้มใหม่"
              name="newAlbumName"
              rules={[
                { required: true, message: 'กรุณากรอกชื่ออัลบั้ม' },
                { max: 200, message: 'ชื่ออัลบั้มต้องไม่เกิน 200 ตัวอักษร' },
              ]}
            >
              <Input placeholder="ชื่ออัลบั้ม" />
            </Form.Item>

            <Form.Item
              label="รูปอัลบั้ม (URL)"
              name="albumImage"
              rules={[
                { type: 'url', message: 'กรุณากรอก URL ที่ถูกต้อง' },
                { max: 500, message: 'URL ต้องไม่เกิน 500 ตัวอักษร' },
              ]}
            >
              <Input placeholder="https://example.com/album.jpg (ไม่บังคับ)" />
            </Form.Item>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="ความยาวเพลง (วินาที)"
            name="duration"
            rules={[
              { type: 'number', min: 1, message: 'ความยาวต้องมากกว่า 0' },
            ]}
          >
            <InputNumber
              placeholder="เช่น 180"
              className="w-full"
              min={1}
            />
          </Form.Item>

          {albumMode !== 'none' && (
            <Form.Item
              label="Track Number (อัตโนมัติ)"
              name="trackNumber"
            >
              <InputNumber
                className="w-full"
                min={1}
                disabled
                placeholder="จะกรอกอัตโนมัติ"
              />
            </Form.Item>
          )}
        </div>

        <Form.Item
          label="หมายเหตุ"
          name="note"
          rules={[{ max: 1000, message: 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร' }]}
        >
          <Input.TextArea
            placeholder="บันทึกรายละเอียดหรือไอเดียเสริม (ไม่บังคับ)"
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
