import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/atoms'
import { cn } from '@/lib/cn'

interface FormFieldProps {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}

/** Label + control + hint/error, wired for accessibility. Works with any atom input. */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      {control}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}
