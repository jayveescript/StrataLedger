import { useBranding } from '@/api/company'
import { PageHeader, QueryState } from '@/components/molecules'
import { BrandingEditor } from '@/components/organisms'

export function BrandingPage() {
  const query = useBranding()
  return (
    <>
      <PageHeader title="Branding" description="White-label the portal and emails for your staff and owners." />
      <QueryState query={query}>{(branding) => <BrandingEditor initial={branding} />}</QueryState>
    </>
  )
}
