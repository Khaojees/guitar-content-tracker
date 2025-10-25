'use client'

import { HomeOutlined, SearchOutlined, UserOutlined, UnorderedListOutlined, ThunderboltOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { key: '/', icon: HomeOutlined, label: 'หน้าแรก' },
  { key: '/search', icon: SearchOutlined, label: 'ค้นหา' },
  { key: '/artists', icon: UserOutlined, label: 'ศิลปิน' },
  { key: '/tracks', icon: UnorderedListOutlined, label: 'เพลง' },
  { key: '/random', icon: ThunderboltOutlined, label: 'สุ่ม' },
]

export default function NavBar() {
  const pathname = usePathname()

  const isActive = (key: string) => {
    if (key === '/') return pathname === '/'
    return pathname.startsWith(key)
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-landscape.svg" alt="Guitar Tracker" className="h-8" />
          </Link>

          <nav className="flex space-x-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              const active = isActive(link.key)
              return (
                <Link
                  key={link.key}
                  href={link.key}
                  className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="text-base" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
