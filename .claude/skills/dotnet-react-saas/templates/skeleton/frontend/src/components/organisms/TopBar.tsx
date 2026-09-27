import { LogOut } from 'lucide-react'
import { Avatar, Badge, Button } from '@/components/atoms'
import { useAuth } from '@/auth/useAuth'
import { humanize } from '@/lib/format'

export function TopBar() {
  const { me, logout } = useAuth()
  if (!me) return null
  const name = `${me.firstName} ${me.lastName}`

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-line bg-card/90 px-6 backdrop-blur">
      {me.tenant && <Badge tone="primary">{me.tenant.tier} plan</Badge>}
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink">{name}</p>
          <p className="text-xs text-ink-muted">{humanize(me.role)}{me.isCommitteeMember ? ' · Committee' : ''}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => void logout()} aria-label="Sign out">
        <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  )
}
