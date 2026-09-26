import { useState } from 'react'
import { useUpdateTier } from '@/api/platform'
import { ALL_FEATURES, type Feature, type Tier } from '@/api/types'
import { Button, Card, CardBody, CardHeader, CardTitle, Checkbox, Input } from '@/components/atoms'
import { Alert, FormField } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'
import { humanize } from '@/lib/format'

const dollars = (cents: number) => (cents / 100).toFixed(2)
const cents = (value: string) => Math.round(Number(value || 0) * 100)

/** Price book editor: monthly price, limits, per-owner overage and the features the tier unlocks. */
export function TierEditor({ tier }: { tier: Tier }) {
  const [draft, setDraft] = useState(tier)
  const update = useUpdateTier()
  const toggle = (f: Feature) =>
    setDraft((d) => ({ ...d, features: d.features.includes(f) ? d.features.filter((x) => x !== f) : [...d.features, f] }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tier.tier}</CardTitle>
        <Button size="sm" loading={update.isPending} onClick={() => update.mutate(draft)}>Save</Button>
      </CardHeader>
      <CardBody className="space-y-4">
        {update.isError && <Alert tone="danger">{errorMessage(update.error)}</Alert>}
        {update.isSuccess && <Alert tone="success">Saved. Companies on this tier are updated immediately.</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Display name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></FormField>
          <FormField label="Monthly price ($)"><Input type="number" min={0} step="0.01" value={dollars(draft.monthlyPriceCents)} onChange={(e) => setDraft({ ...draft, monthlyPriceCents: cents(e.target.value) })} /></FormField>
          <FormField label="Max strata plans" hint="Blank = unlimited"><Input type="number" min={1} value={draft.maxStrataPlans ?? ''} onChange={(e) => setDraft({ ...draft, maxStrataPlans: e.target.value ? Number(e.target.value) : null })} /></FormField>
          <FormField label="Storage (MB)"><Input type="number" min={0} value={draft.storageQuotaMb} onChange={(e) => setDraft({ ...draft, storageQuotaMb: Number(e.target.value) })} /></FormField>
          <FormField label="Included owners"><Input type="number" min={0} value={draft.includedOwners} onChange={(e) => setDraft({ ...draft, includedOwners: Number(e.target.value) })} /></FormField>
          <FormField label="Per extra owner ($)"><Input type="number" min={0} step="0.01" value={dollars(draft.perOwnerOverageCents)} onChange={(e) => setDraft({ ...draft, perOwnerOverageCents: cents(e.target.value) })} /></FormField>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Included features</legend>
          <div className="grid grid-cols-2 gap-2">
            {ALL_FEATURES.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm text-ink"><Checkbox checked={draft.features.includes(f)} onChange={() => toggle(f)} />{humanize(f)}</label>
            ))}
          </div>
        </fieldset>
      </CardBody>
    </Card>
  )
}
