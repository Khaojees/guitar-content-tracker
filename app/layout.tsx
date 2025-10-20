import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🎸 Guitar Content Tracker',
  description: 'ระบบจัดการเพลงสำหรับทำคลิปกีตาร์สั้น',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <a href="/" className="flex items-center text-lg font-bold text-gray-900">
                  🎸 Guitar Content Tracker
                </a>
                <a href="/search" className="flex items-center text-gray-700 hover:text-gray-900">
                  ค้นหา
                </a>
                <a href="/artists" className="flex items-center text-gray-700 hover:text-gray-900">
                  ศิลปิน
                </a>
                <a href="/tracks" className="flex items-center text-gray-700 hover:text-gray-900">
                  เพลงทั้งหมด
                </a>
                <a href="/random" className="flex items-center text-gray-700 hover:text-gray-900">
                  🎲 สุ่มเพลง
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
