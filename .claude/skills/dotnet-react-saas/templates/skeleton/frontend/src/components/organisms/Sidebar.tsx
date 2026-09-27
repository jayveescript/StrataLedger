import { ChevronLeft, Lock, Menu } from 'lucide-react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/atoms'
import { evaluateAccess } from '@/auth/access'
import { useAuth } from '@/auth/useAuth'
import { useBrand } from '@/brand/useBrand'
import { cn } from '@/lib/cn'
import { NAVIGATION } from '@/lib/navigation'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { me } = useAuth()
  const { branding } = useBrand()

  const sections = NAVIGATION.map((section) => ({
    ...section,
    items: section.items
      .map((item) => ({ item, access: evaluateAccess(me, item) }))
      .filter(({ access }) => access !== 'forbidden'),
  })).filter((section) => section.items.length > 0)

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
      <div className={cn('flex items-center border-b border-white/10 py-4', collapsed ? 'flex-col gap-3 px-2' : 'justify-between px-4')}>
        <div className="flex min-w-0 items-center gap-2">
          <Logo branding={branding} size="sm" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{branding.displayName}</p>
              <p className="truncate text-xs text-white/50">{me?.tenant?.name ?? 'Platform administration'}</p>
            </div>
          )}
        </div>
        <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Main">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{section.title}</p>}
            <ul className="space-y-0.5">
              {section.items.map(({ item, access }) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => cn(
                      'flex items-center rounded-lg text-sm font-medium transition-colors',
                      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                      isActive ? 'bg-primary text-primary-fg' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && access === 'locked' && <Lock className="h-3.5 w-3.5 text-white/50" aria-label="Not in your plan" />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
