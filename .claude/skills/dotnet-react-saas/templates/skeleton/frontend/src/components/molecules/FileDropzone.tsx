import { Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'

interface FileDropzoneProps {
  accept: string
  maxBytes: number
  onFile: (file: File) => void
  hint?: string
  disabled?: boolean
}

export function FileDropzone({ accept, maxBytes, onFile, hint, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accepted = accept.split(',').map((a) => a.trim().toLowerCase())
  const pick = (file?: File) => {
    if (!file) return
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!accepted.includes(ext) && !accepted.includes(file.type)) return setError(`Unsupported file type. Use ${accept}.`)
    if (file.size > maxBytes) return setError(`File is too large (max ${Math.round(maxBytes / 1024)} KB).`)
    setError(null)
    onFile(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) pick(e.dataTransfer.files[0])
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn('flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-6 py-8 text-center transition-colors hover:border-primary disabled:opacity-50', dragging && 'border-primary bg-primary/5')}
      >
        <Upload className="h-6 w-6 text-ink-muted" />
        <span className="text-sm font-medium text-ink">Drop a file here or click to browse</span>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </button>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
