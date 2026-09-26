import { useTiers } from '@/api/platform'
import { PageHeader, QueryState } from '@/components/molecules'
import { TierEditor } from '@/components/organisms'

export function TiersPage() {
  const query = useTiers()
  return (
    <>
      <PageHeader title="Pricing tiers" description="What each plan costs, what it unlocks, and its limits. Per-company overrides live on the company page." />
      <QueryState query={query}>
        {(tiers) => <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">{tiers.map((t) => <TierEditor key={t.tier} tier={t} />)}</div>}
      </QueryState>
    </>
  )
}
