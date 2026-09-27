import { forwardRef, type ComponentProps } from 'react'
import { Input } from '@/components/atoms'

/** 6-digit authenticator code field with mobile numeric keypad and OS one-time-code autofill. */
export const OtpInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>((props, ref) => (
  <Input
    ref={ref}
    inputMode="numeric"
    autoComplete="one-time-code"
    pattern="[0-9 ]*"
    maxLength={7}
    placeholder="123 456"
    className="text-center font-mono text-lg tracking-[0.4em]"
    {...props}
  />
))
OtpInput.displayName = 'OtpInput'
