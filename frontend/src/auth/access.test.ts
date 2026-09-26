import { makeMe } from '@/test/fixtures'
import { evaluateAccess, homePathFor } from './access'

describe('evaluateAccess', () => {
  it('forbids anonymous users', () => {
    expect(evaluateAccess(null, {})).toBe('forbidden')
  })

  it('forbids when role or permission is missing', () => {
    const me = makeMe()
    expect(evaluateAccess(me, { roles: ['CompanyAdmin'] })).toBe('forbidden')
    expect(evaluateAccess(me, { permission: 'CompanyBrandingManage' })).toBe('forbidden')
  })

  it('reports locked (upsell) when only the plan feature is missing', () => {
    const me = makeMe({ role: 'CompanyAdmin', permissions: ['CompanyBrandingManage'] })
    expect(evaluateAccess(me, { permission: 'CompanyBrandingManage', feature: 'CustomBranding' })).toBe('locked')
  })

  it('allows when every rule is satisfied', () => {
    expect(evaluateAccess(makeMe(), { permission: 'PlansRead', feature: 'StrataPlans' })).toBe('allowed')
  })

  it('routes each role to its home', () => {
    expect(homePathFor('SuperAdmin')).toBe('/platform/companies')
    expect(homePathFor('Owner')).toBe('/portal')
    expect(homePathFor('Accountant')).toBe('/dashboard')
  })
})
