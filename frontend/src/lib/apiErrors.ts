import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/http'

/** Pushes server field errors (camelCase keys) into react-hook-form; returns the general message. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.'
  let mapped = false
  Object.entries(error.fieldErrors).forEach(([key, messages]) => {
    const field = fields.find((f) => f.toLowerCase() === key.toLowerCase())
    if (field && messages[0]) {
      setError(field, { type: 'server', message: messages.join(' ') })
      mapped = true
    }
  })
  return mapped ? null : error.message
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')
