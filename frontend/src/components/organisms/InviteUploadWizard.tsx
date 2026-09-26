import { CheckCircle2, Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { usePreviewInvitations, useSendInvitations } from '@/api/company'
import type { InvitationBatchResult, InvitationRowInput, InvitationUploadPreview } from '@/api/types'
import { Badge, Button, Card } from '@/components/atoms'
import { Alert, FileDropzone } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'
import { humanize } from '@/lib/format'
import { DataTable } from './DataTable'

const TEMPLATE = 'email,first_name,last_name,role,plan_number,lot_number\njane@example.com,Jane,Citizen,Owner,PS612345,Lot 1\nalex@example.com,Alex,Manager,Strata Manager,,\n'

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: 'invitations-template.csv' }).click()
  URL.revokeObjectURL(url)
}

type Stage = { kind: 'upload' } | { kind: 'review'; preview: InvitationUploadPreview } | { kind: 'done'; result: InvitationBatchResult }

/**
 * Email-list onboarding: upload CSV/XLSX → server validates every row (roles you may grant, duplicates, existing users,
 * plan/lot references, plan features) → review → send single-use, 72-hour invitations.
 */
export function InviteUploadWizard({ companyId }: { companyId?: string }) {
  const [stage, setStage] = useState<Stage>({ kind: 'upload' })
  const preview = usePreviewInvitations(companyId)
  const send = useSendInvitations(companyId)

  const onFile = async (file: File) => setStage({ kind: 'review', preview: await preview.mutateAsync(file) })

  const onSend = async (p: InvitationUploadPreview) => {
    const rows: InvitationRowInput[] = p.rows.filter((r) => r.isValid && r.parsedRole).map((r) => ({
      email: r.email, firstName: r.firstName, lastName: r.lastName, role: r.parsedRole!, planNumber: r.planNumber, lotNumber: r.lotNumber,
    }))
    setStage({ kind: 'done', result: await send.mutateAsync({ fileName: p.fileName, rows }) })
  }

  const error = preview.error ?? send.error
  return (
    <Card className="p-5">
      {error && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}

      {stage.kind === 'upload' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-soft">Columns: <code>email, first_name, last_name, role</code>, optional <code>plan_number, lot_number</code> to link owners to their lot.</p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4" />Template</Button>
          </div>
          <FileDropzone accept=".csv,.xlsx" maxBytes={5 * 1024 * 1024} onFile={(f) => void onFile(f)} disabled={preview.isPending} hint="CSV or Excel, up to 5 MB / 2,000 rows" />
          {preview.isPending && <p className="text-sm text-ink-muted">Validating rows…</p>}
        </div>
      )}

      {stage.kind === 'review' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-ink-muted" />
            <span className="font-medium text-ink">{stage.preview.fileName}</span>
            <Badge tone="success">{stage.preview.validRows} ready</Badge>
            {stage.preview.totalRows > stage.preview.validRows && <Badge tone="danger">{stage.preview.totalRows - stage.preview.validRows} with errors</Badge>}
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-line">
            <DataTable
              rows={stage.preview.rows}
              rowKey={(r) => String(r.rowNumber)}
              columns={[
                { key: 'row', header: 'Row', cell: (r) => r.rowNumber, className: 'w-14 text-ink-muted' },
                { key: 'email', header: 'Email', cell: (r) => r.email },
                { key: 'name', header: 'Name', cell: (r) => `${r.firstName} ${r.lastName}` },
                { key: 'role', header: 'Role', cell: (r) => (r.parsedRole ? humanize(r.parsedRole) : r.role) },
                { key: 'lot', header: 'Plan / lot', cell: (r) => [r.planNumber, r.lotNumber].filter(Boolean).join(' · ') || '—' },
                { key: 'status', header: 'Status', cell: (r) => (r.isValid ? <Badge tone="success">OK</Badge> : <span className="text-xs text-danger">{r.errors.join(' ')}</span>) },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStage({ kind: 'upload' })}>Choose another file</Button>
            <Button onClick={() => void onSend(stage.preview)} loading={send.isPending} disabled={stage.preview.validRows === 0}>
              Send {stage.preview.validRows} invitation{stage.preview.validRows === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}

      {stage.kind === 'done' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="text-lg font-semibold text-ink">{stage.result.sent} invitation{stage.result.sent === 1 ? '' : 's'} queued</p>
          <p className="text-sm text-ink-soft">Recipients get a branded email with a single-use link valid for 72 hours.</p>
          {stage.result.rejected.length > 0 && <Alert tone="warning">{stage.result.rejected.length} row(s) were skipped because they became invalid.</Alert>}
          <Button variant="outline" onClick={() => setStage({ kind: 'upload' })}>Upload another list</Button>
        </div>
      )}
    </Card>
  )
}
