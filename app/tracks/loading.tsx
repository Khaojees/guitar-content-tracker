'use client'

import { Card, Skeleton, Table } from 'antd'

export default function Loading() {
  const columns = [
    { title: 'เพลง', dataIndex: 'name', key: 'name' },
    { title: 'ศิลปิน', dataIndex: 'artist', key: 'artist' },
    { title: 'อัลบั้ม', dataIndex: 'album', key: 'album' },
    { title: 'ความยาว', dataIndex: 'duration', key: 'duration' },
    { title: 'สถานะ', dataIndex: 'status', key: 'status' },
    { title: 'ปักหมุด', dataIndex: 'starred', key: 'starred' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Skeleton.Input active className="!h-9 !w-32" />
        <Skeleton.Input active className="!mt-2 !h-5 !w-48" />
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <Table
          columns={columns}
          dataSource={[]}
          loading={true}
          pagination={false}
        />
      </div>
    </div>
  )
}
