import { useState } from 'react'
import { useClearFeature, useCompanyFeatures, useSetFeature } from '@/api/platform'
import type { FeatureAccess } from '@/api/types'
import { Badge, Button } from '@/components/atoms'
import { QueryState } from '@/components/molecules'
import { humanize } from '@/lib/format'
import { DataTable } from './DataTable'

/** Super Admin control of paid modules per company: tier default, override (grant/revoke), and effective access. */
export function FeatureMatrix({ companyId }: { companyId: string }) {
  const query = useCompanyFeatures(companyId)
  const setFeature = useSetFeature(companyId)
  const clearFeature = useClearFeature(companyId)
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (feature: string, action: () => Promise<unknown>) => {
    setBusy(feature)
    try { await action() } finally { setBusy(null) }
  }

  const overrideCell = (f: FeatureAccess) =>
    f.overrideEnabled === null ? <span className="text-ink-muted">—</span>
      : <Badge tone={f.overrideEnabled ? 'success' : 'danger'}>{f.overrideEnabled ? 'Granted' : 'Revoked'}</Badge>

  return (
    <QueryState query={query}>
      {(rows) => (
        <DataTable
          rows={rows}
          rowKey={(f) => f.feature}
          columns={[
            { key: 'feature', header: 'Feature', cell: (f) => <span className="font-medium">{humanize(f.feature)}</span> },
            { key: 'tier', header: 'In tier', cell: (f) => (f.includedInTier ? 'Yes' : 'No') },
            { key: 'override', header: 'Override', cell: overrideCell },
            { key: 'effective', header: 'Access', cell: (f) => <Badge tone={f.effective ? 'success' : 'neutral'}>{f.effective ? 'Enabled' : 'Off'}</Badge> },
            {
              key: 'actions', header: '', className: 'text-right',
              cell: (f) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="outline" loading={busy === f.feature} onClick={() => void run(f.feature, () => setFeature.mutateAsync({ feature: f.feature, enabled: !f.effective, expiresAt: null, note: null }))}>
                    {f.effective ? 'Revoke' : 'Grant'}
                  </Button>
                  {f.overrideEnabled !== null && (
                    <Button size="sm" variant="ghost" onClick={() => void run(f.feature, () => clearFeature.mutateAsync(f.feature))}>Use tier</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </QueryState>
  )
}
