import { applyBranding, DEFAULT_BRANDING } from './brandTokens'

describe('applyBranding', () => {
  it('writes every colour token to CSS variables and updates the title', () => {
    applyBranding({ ...DEFAULT_BRANDING, displayName: 'Acme Corp', primaryColor: '#7c3aed' })
    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#7c3aed')
    expect(document.documentElement.style.getPropertyValue('--brand-border')).toBe(DEFAULT_BRANDING.borderColor)
    expect(document.title).toBe('Acme Corp')
  })
})
