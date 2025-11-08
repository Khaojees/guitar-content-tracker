'use client'

import { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AddArtistModal from './AddArtistModal'

type ArtistsPageHeaderProps = {
  totalCount: number
}

export default function ArtistsPageHeader({ totalCount }: ArtistsPageHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ศิลปิน</h1>
          <p className="mt-1 text-sm text-gray-600">
            ศิลปินทั้งหมด {totalCount} ราย
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          เพิ่มศิลปิน
        </Button>
      </div>

      <AddArtistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
