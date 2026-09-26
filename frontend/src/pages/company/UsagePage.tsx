import { useUsage } from '@/api/company'
import { PageHeader, QueryState } from '@/components/molecules'
import { UsageSummary } from '@/components/organisms'

export function UsagePage() {
  const query = useUsage()
  return (
    <>
      <PageHeader title="Plan & usage" description="Your subscription limits and estimated monthly charges." />
      <QueryState query={query}>{(usage) => <UsageSummary usage={usage} />}</QueryState>
    </>
  )
}
