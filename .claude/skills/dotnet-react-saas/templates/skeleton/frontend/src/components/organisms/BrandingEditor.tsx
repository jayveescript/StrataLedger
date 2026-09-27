import { useEffect, useState } from 'react'
import { useUpdateBranding, useUploadLogo } from '@/api/tenant'
import type { Branding } from '@/api/types'
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Logo } from '@/components/atoms'
import { Alert, ColorField, FileDropzone, FormField } from '@/components/molecules'
import { BRAND_COLOR_LABELS, DEFAULT_BRANDING, type BrandColorKey } from '@/brand/brandTokens'
import { useAuth } from '@/auth/useAuth'
import { useBrand } from '@/brand/useBrand'
import { errorMessage } from '@/lib/apiErrors'

const COLOR_KEYS = Object.keys(BRAND_COLOR_LABELS) as BrandColorKey[]

/** Live-preview white-label editor: changes re-theme the whole app instantly, and persist on save. */
export function BrandingEditor({ initial, tenantId }: { initial: Branding; tenantId?: string }) {
  const [draft, setDraft] = useState<Branding>(initial)
  const [preview, setPreview] = useState(false)
  const { setOverride } = useBrand()
  const { reloadMe } = useAuth()
  // Editing your own tenant re-themes the app for you immediately; Super Admin editing a tenant does not.
  const refreshOwnTheme = () => (tenantId ? Promise.resolve() : reloadMe())
  const save = useUpdateBranding(tenantId)
  const upload = useUploadLogo(tenantId)

  useEffect(() => {
    setOverride(preview ? draft : null)
    return () => setOverride(null)
  }, [preview, draft, setOverride])

  const set = <K extends keyof Branding>(key: K, value: Branding[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const onSave = async () => {
    const { logoUrl: _ignored, ...body } = draft
    void _ignored
    await save.mutateAsync(body)
    await refreshOwnTheme()
    setPreview(false)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Identity & colours</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft({ ...DEFAULT_BRANDING, displayName: draft.displayName, logoMark: draft.logoMark, logoUrl: draft.logoUrl })}>Reset colours</Button>
            <Button variant={preview ? 'secondary' : 'outline'} size="sm" onClick={() => setPreview(!preview)}>{preview ? 'Stop preview' : 'Preview live'}</Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {save.isError && <Alert tone="danger">{errorMessage(save.error)}</Alert>}
          {save.isSuccess && !preview && <Alert tone="success">Branding saved. Everyone in your tenant now sees it.</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Display name" className="sm:col-span-2"><Input value={draft.displayName} maxLength={80} onChange={(e) => set('displayName', e.target.value)} /></FormField>
            <FormField label="Monogram" hint="1–3 letters"><Input value={draft.logoMark} maxLength={3} onChange={(e) => set('logoMark', e.target.value.toUpperCase())} /></FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COLOR_KEYS.map((key) => <ColorField key={key} label={BRAND_COLOR_LABELS[key]} value={draft[key]} onChange={(v) => set(key, v)} />)}
          </div>
          <div className="flex justify-end"><Button onClick={() => void onSave()} loading={save.isPending}>Save branding</Button></div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3"><Logo branding={draft} size="lg" /><span className="font-semibold text-ink">{draft.displayName}</span></div>
            {upload.isError && <Alert tone="danger">{errorMessage(upload.error)}</Alert>}
            <FileDropzone accept=".png,.jpg,.jpeg,.webp" maxBytes={512 * 1024} onFile={(f) => void upload.mutateAsync(f).then((b) => { set('logoUrl', b.logoUrl); return refreshOwnTheme() })} disabled={upload.isPending} hint="PNG, JPEG or WebP up to 512 KB. Counts toward storage." />
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3 rounded-lg border p-4" style={{ background: draft.surfaceCard, borderColor: draft.borderColor }}>
              <p className="font-semibold" style={{ color: draft.textPrimary }}>Invoice ready</p>
              <p className="text-sm" style={{ color: draft.textSecondary }}>Your monthly invoice is due on the 1st.</p>
              <span className="inline-block rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: draft.primaryColor, color: draft.primaryForeground }}>Pay now</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
