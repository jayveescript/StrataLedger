import { useId } from 'react'
import { Input, Label } from '@/components/atoms'

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} picker`} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-card p-1" />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} className="font-mono" />
      </div>
    </div>
  )
}
