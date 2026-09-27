import { passwordSchema, passwordScore } from './passwordPolicy'

describe('password policy', () => {
  it.each(['short1!A', 'alllowercase123!', 'ALLUPPERCASE123!', 'NoDigitsHere!!', 'NoSymbols12345'])('rejects %s', (pwd) => {
    expect(passwordSchema.safeParse(pwd).success).toBe(false)
  })

  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Harbour-Lights-2026!').success).toBe(true)
  })

  it('scores stronger passwords higher', () => {
    expect(passwordScore('abc')).toBeLessThan(passwordScore('Harbour-Lights-2026!'))
    expect(passwordScore('Harbour-Lights-2026!')).toBe(4)
  })
})
