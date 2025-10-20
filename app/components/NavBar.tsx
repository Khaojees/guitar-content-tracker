'use client'

import {
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  UnorderedListOutlined,
  ThunderboltOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { Dropdown } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: 'แดชบอร์ด',
  },
  {
    key: '/search',
    icon: <SearchOutlined />,
    label: 'ค้นหา',
  },
  {
    key: '/artists',
    icon: <UserOutlined />,
    label: 'ศิลปิน',
  },
  {
    key: '/tracks',
    icon: <UnorderedListOutlined />,
    label: 'เพลงทั้งหมด',
  },
  {
    key: '/random',
    icon: <ThunderboltOutlined />,
    label: 'สุ่มไอเดีย',
  },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()

  const resolveActiveKey = () => {
    if (!pathname) return '/'
    const matched = NAV_LINKS.find((item) =>
      item.key === '/' ? pathname === '/' : pathname.startsWith(item.key)
    )
    return matched?.key ?? '/'
  }

  const activeKey = resolveActiveKey()

  const cn = (...classes: Array<string | false>) =>
    classes.filter(Boolean).join(' ')

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30">
            dY
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Content Tracker
            </span>
            <span className="text-xl font-bold text-slate-900">dYZ Guitar</span>
          </div>
        </div>

        <nav className="ml-auto hidden gap-2 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive = activeKey === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => router.push(item.key)}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-600 hover:-translate-y-[1px] hover:bg-slate-100/80'
                )}
              >
                <span
                  className={cn(
                    'text-base transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto md:hidden">
          <Dropdown
            trigger={['click']}
            menu={{
              items: NAV_LINKS.map((item) => ({
                key: item.key,
                label: item.label,
                icon: item.icon,
              })),
              onClick: ({ key }) => router.push(key),
              selectedKeys: [activeKey],
            }}
          >
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-500"
            >
              <MenuOutlined />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}
