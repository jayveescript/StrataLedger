import { z } from 'zod'

/** Mirrors the API's Identity policy so users get instant feedback; the server remains the authority. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { id: 'upper', label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit', label: 'A number', test: (p: string) => /\d/.test(p) },
  { id: 'symbol', label: 'A symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { id: 'unique', label: 'At least 5 different characters', test: (p: string) => new Set(p).size >= 5 },
] as const

export function passwordScore(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const lengthBonus = password.length >= 16 ? 1 : 0
  return Math.min(4, Math.floor(((passed + lengthBonus) / (PASSWORD_RULES.length + 1)) * 4))
}

export const passwordSchema = z
  .string()
  .max(128, 'Password is too long')
  .refine((p) => PASSWORD_RULES.every((r) => r.test(p)), 'Password does not meet the requirements')
