'use client'

import { useState } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { useRouter } from 'next/navigation'

type AddArtistModalProps = {
  open: boolean
  onClose: () => void
}

type FormValues = {
  name: string
  imageUrl?: string
}

export default function AddArtistModal({ open, onClose }: AddArtistModalProps) {
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()
  const router = useRouter()

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const response = await fetch('/api/artist/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          imageUrl: values.imageUrl?.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        message.success('เพิ่มศิลปินเรียบร้อยแล้ว')
        form.resetFields()
        onClose()
        router.refresh()
      } else {
        message.error(data.error || 'ไม่สามารถเพิ่มศิลปินได้')
      }
    } catch (error) {
      console.error('Add artist error:', error)
      message.error('เกิดข้อผิดพลาดระหว่างเพิ่มศิลปิน')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="เพิ่มศิลปินแบบ Manual"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText="เพิ่มศิลปิน"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="pt-4"
      >
        <Form.Item
          label="ชื่อศิลปิน"
          name="name"
          rules={[
            { required: true, message: 'กรุณากรอกชื่อศิลปิน' },
            { max: 200, message: 'ชื่อศิลปินต้องไม่เกิน 200 ตัวอักษร' },
          ]}
        >
          <Input placeholder="ชื่อศิลปิน" />
        </Form.Item>

        <Form.Item
          label="รูปศิลปิน (URL)"
          name="imageUrl"
          rules={[
            { type: 'url', message: 'กรุณากรอก URL ที่ถูกต้อง' },
            { max: 500, message: 'URL ต้องไม่เกิน 500 ตัวอักษร' },
          ]}
        >
          <Input placeholder="https://example.com/image.jpg (ไม่บังคับ)" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
