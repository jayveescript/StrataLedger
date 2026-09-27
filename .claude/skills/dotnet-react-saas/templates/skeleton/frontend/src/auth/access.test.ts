import { makeMe } from '@/test/fixtures'
import { evaluateAccess, homePathFor } from './access'

describe('evaluateAccess', () => {
  it('forbids anonymous users', () => {
    expect(evaluateAccess(null, {})).toBe('forbidden')
  })

  it('forbids when role or permission is missing', () => {
    const me = makeMe()
    expect(evaluateAccess(me, { roles: ['TenantAdmin'] })).toBe('forbidden')
    expect(evaluateAccess(me, { permission: 'TenantBrandingManage' })).toBe('forbidden')
  })

  it('reports locked (upsell) when only the plan feature is missing', () => {
    const me = makeMe({ role: 'TenantAdmin', permissions: ['TenantBrandingManage'] })
    expect(evaluateAccess(me, { permission: 'TenantBrandingManage', feature: 'CustomBranding' })).toBe('locked')
  })

  it('allows when every rule is satisfied', () => {
    expect(evaluateAccess(makeMe(), { permission: 'ItemsRead', feature: 'Items' })).toBe('allowed')
  })

  it('routes each role to its home', () => {
    expect(homePathFor('SuperAdmin')).toBe('/platform/tenants')
    expect(homePathFor('Member')).toBe('/account')
    expect(homePathFor('Viewer')).toBe('/items')
  })
})
