import { render, screen } from '@testing-library/react'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

describe('PasswordStrengthMeter', () => {
  it('reflects which rules pass', () => {
    render(<PasswordStrengthMeter password="Harbour-Lights-2026!" />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
    expect(screen.getByText('At least 12 characters').className).toContain('text-success')
  })
})
