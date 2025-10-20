'use client'

import { useState } from 'react'
import {
  Card,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Typography,
  message,
  Empty,
  Tag,
} from 'antd'
import { SearchOutlined, SaveOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const ENTITY_OPTIONS = [
  { value: 'musicArtist', label: 'ศิลปิน' },
  { value: 'song', label: 'เพลง' },
  { value: 'album', label: 'อัลบั้ม' },
]

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchEntity, setSearchEntity] = useState('musicArtist')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setResults([])

    try {
      const response = await fetch(
        `/api/search?term=${encodeURIComponent(searchTerm)}&entity=${searchEntity}`
      )
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      message.error('ไม่สามารถค้นหาข้อมูลจาก iTunes ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveArtist = async (artist: any) => {
    setSaving(artist.artistId)

    try {
      const response = await fetch('/api/save/artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: artist.artistId,
          artistName: artist.artistName,
          imageUrl: artist.artworkUrl100 || artist.artworkUrl60,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        const total = data.totalTracks
          ? ` (${data.totalTracks} เพลงที่เกี่ยวข้อง)`
          : ''
        message.success(`บันทึกศิลปินเรียบร้อยแล้ว${total}`)
      } else {
        message.error(data.error || 'ไม่สามารถบันทึกศิลปินได้')
      }
    } catch (error) {
      console.error('Save artist error:', error)
      message.error('เกิดข้อผิดพลาดในการบันทึกศิลปิน')
    } finally {
      setSaving(null)
    }
  }

  const showSaveButton = (item: any) =>
    searchEntity === 'musicArtist' && Boolean(item.artistId)

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <Title level={2} className="!mb-2 !text-slate-900">
          ค้นหาและนำเข้าข้อมูลจาก iTunes
        </Title>
        <Paragraph className="!mb-0 max-w-3xl text-slate-600">
          เจอศิลปินหรือเพลงใหม่แล้วอยากเก็บเข้าสู่ระบบ? ใช้เครื่องมือนี้ค้นหาจาก
          iTunes แล้วบันทึกเข้าฐานข้อมูล เพื่อนำไปติดตามสถานะและวางแผนคอนเทนต์ต่อได้ทันที.
        </Paragraph>
      </section>

      <Card className="glass-surface border-none bg-white/90">
        <form onSubmit={handleSearch} className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">
              คำค้นหาที่ต้องการ
            </label>
            <Input
              size="large"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="พิมพ์ชื่อศิลปิน เพลง หรืออัลบั้มที่ต้องการค้นหา"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">
              ประเภทที่ต้องการค้นหา
            </label>
            <Select
              size="large"
              value={searchEntity}
              onChange={setSearchEntity}
              options={ENTITY_OPTIONS}
              className="w-full"
            />
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            htmlType="submit"
            loading={loading}
            className="md:col-span-2"
          >
            {loading ? 'กำลังค้นหาข้อมูล...' : 'ค้นหา'}
          </Button>
        </form>
      </Card>

      {results.length > 0 && (
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="text-slate-800">
                พบผลลัพธ์ทั้งหมด {results.length} รายการ
              </span>
              <Tag color="processing" className="!rounded-full !px-4 !py-1">
                {ENTITY_OPTIONS.find((option) => option.value === searchEntity)?.label}
              </Tag>
            </div>
          }
          className="glass-surface border-none bg-white/90"
        >
          <List
            itemLayout="horizontal"
            dataSource={results}
            renderItem={(item: any) => (
              <List.Item
                className="rounded-2xl border border-slate-200/60 bg-white/70 p-4"
                actions={
                  showSaveButton(item)
                    ? [
                        <Button
                          key="save"
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={() => handleSaveArtist(item)}
                          loading={saving === item.artistId}
                          className="bg-emerald-500 shadow-sm shadow-emerald-500/30 hover:bg-emerald-600"
                        >
                          {saving === item.artistId
                            ? 'กำลังบันทึก...'
                            : 'บันทึกศิลปิน'}
                        </Button>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  avatar={
                    item.artworkUrl100 ? (
                      <Avatar
                        src={item.artworkUrl100}
                        size={80}
                        shape="square"
                        className="rounded-2xl border border-slate-200/70 shadow-md"
                      />
                    ) : (
                      <Avatar
                        size={80}
                        shape="square"
                        className="rounded-2xl bg-indigo-500 text-lg font-semibold text-white"
                      >
                        {item.artistName?.slice(0, 2) || 'dY'}
                      </Avatar>
                    )
                  }
                  title={
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-semibold text-slate-900">
                        {item.artistName || item.collectionName || 'ไม่พบชื่อ'}
                      </span>
                      {item.trackName && (
                        <Text className="text-sm text-slate-500">{item.trackName}</Text>
                      )}
                    </div>
                  }
                  description={
                    <div className="space-y-1 text-xs text-slate-500">
                      {item.primaryGenreName && (
                        <div>แนวเพลง: {item.primaryGenreName}</div>
                      )}
                      {item.artistLinkUrl && (
                        <div className="truncate">
                          ลิงก์ต้นทาง:{' '}
                          <a
                            href={item.artistLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline"
                          >
                            {item.artistLinkUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {!loading && results.length === 0 && searchTerm && (
        <Card className="glass-surface border-none bg-white/90">
          <Empty
            description={`ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  )
}

