import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/atoms'
import { FormField, PasswordStrengthMeter } from '@/components/molecules'

export interface PasswordFieldValues extends FieldValues {
  password: string
  confirmPassword: string
}

/** New-password + confirm with live policy feedback. Shared by invitation, reset and change-password forms. */
export function SetPasswordFields<T extends PasswordFieldValues>({ register, errors, password, label = 'Password' }: {
  register: UseFormRegister<T>
  errors: FieldErrors<PasswordFieldValues>
  password: string
  label?: string
}) {
  return (
    <>
      <FormField label={label} error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register('password' as Path<T>)} />
      </FormField>
      <PasswordStrengthMeter password={password} />
      <FormField label="Confirm password" error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...register('confirmPassword' as Path<T>)} />
      </FormField>
    </>
  )
}
