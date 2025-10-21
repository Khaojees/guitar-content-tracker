'use client'

import { Card, Skeleton } from 'antd'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton.Input active className="!h-9 !w-32" />
        <Skeleton.Input active className="!mt-2 !h-5 !w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}
