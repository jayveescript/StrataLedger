import { Copy, Download } from 'lucide-react'
import { useState } from 'react'
import { Button, Checkbox } from '@/components/atoms'
import { Alert } from '@/components/molecules'

export function RecoveryCodes({ codes, onDone, doneLabel = 'Continue' }: { codes: string[]; onDone: () => void; doneLabel?: string }) {
  const [saved, setSaved] = useState(false)
  const text = codes.join('\n')

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'strataledger-recovery-codes.txt' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Alert tone="warning" title="Save your recovery codes">Each code can be used once if you lose your authenticator. They won't be shown again.</Alert>
      <ul className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface p-4 font-mono text-sm">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(text)}><Copy className="h-4 w-4" />Copy</Button>
        <Button variant="outline" size="sm" onClick={download}><Download className="h-4 w-4" />Download</Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I have stored these codes somewhere safe
      </label>
      <Button block disabled={!saved} onClick={onDone}>{doneLabel}</Button>
    </div>
  )
}
