import { Building2, CircleDollarSign, Home, Mail, PiggyBank, Users } from 'lucide-react'
import { Link } from 'react-router'
import { useDashboard } from '@/api/strata'
import { Card, CardHeader, CardTitle } from '@/components/atoms'
import { EmptyState, PageHeader, QueryState, StatCard, StatusBadge } from '@/components/molecules'
import { useAuth } from '@/auth/useAuth'
import { formatCurrency, formatDate } from '@/lib/format'

export function DashboardPage() {
  const { me } = useAuth()
  const query = useDashboard()
  return (
    <>
      <PageHeader title={`Good day, ${me?.firstName}`} description={`Portfolio overview for ${me?.company?.name ?? 'all companies'}`} />
      <QueryState query={query}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Strata plans" value={d.strataPlans} icon={Building2} hint={`${d.lots} lots under management`} />
              <StatCard label="Owners" value={d.owners} icon={Users} hint={`${d.ownersWithPortal} using the owner portal`} />
              <StatCard label="Pending invitations" value={d.pendingInvitations} icon={Mail} />
              <StatCard label="Admin funds" value={formatCurrency(d.adminFundTotal)} icon={CircleDollarSign} />
              <StatCard label="Capital works funds" value={formatCurrency(d.capitalWorksFundTotal)} icon={PiggyBank} />
              <StatCard label="Portal adoption" value={d.owners ? `${Math.round((d.ownersWithPortal / d.owners) * 100)}%` : '—'} icon={Home} />
            </div>
            <Card>
              <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
              {d.alerts.length === 0 ? (
                <EmptyState icon={Building2} title="All plans are healthy" description="No plans at risk and no AGMs in the next 60 days." />
              ) : (
                <ul className="divide-y divide-line">
                  {d.alerts.map((a) => (
                    <li key={a.id}>
                      <Link to={`/strata-plans/${a.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface">
                        <span className="font-medium text-ink">{a.name}</span>
                        <span className="flex items-center gap-3 text-sm text-ink-soft">
                          {a.nextAgmDate && <>AGM {formatDate(a.nextAgmDate)}</>}
                          <StatusBadge value={a.health} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </QueryState>
    </>
  )
}
