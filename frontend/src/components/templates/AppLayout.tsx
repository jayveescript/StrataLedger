import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar, TopBar } from '@/components/organisms'
import { cn } from '@/lib/cn'

const STORAGE_KEY = 'sl.sidebar.collapsed'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const toggle = () => setCollapsed((c) => {
    localStorage.setItem(STORAGE_KEY, c ? '0' : '1')
    return !c
  })

  return (
    <div className="min-h-full bg-surface">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={cn('transition-all duration-200', collapsed ? 'pl-16' : 'pl-64')}>
        <TopBar />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
