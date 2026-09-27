import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Me } from '@/api/types'
import { AuthContext } from '@/auth/authContextValue'
import { BrandContext } from '@/brand/brandContextValue'
import { DEFAULT_BRANDING } from '@/brand/brandTokens'
import { makeMe } from '@/test/fixtures'
import { Sidebar } from './Sidebar'

function renderSidebar(me: Me) {
  return render(
    <AuthContext.Provider value={{ status: 'authenticated', me, completeSignIn: vi.fn(), reloadMe: vi.fn(), logout: vi.fn() }}>
      <BrandContext.Provider value={{ branding: { ...DEFAULT_BRANDING, displayName: 'Acme Portal' }, setOverride: vi.fn() }}>
        <MemoryRouter><Sidebar collapsed={false} onToggle={vi.fn()} /></MemoryRouter>
      </BrandContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('Sidebar', () => {
  it('shows the company brand and only the items the role may use', () => {
    renderSidebar(makeMe())
    expect(screen.getByText('Acme Portal')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Strata plans/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Companies/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Branding/ })).not.toBeInTheDocument()
  })

  it('shows a lock on items the plan does not include', () => {
    renderSidebar(makeMe({ role: 'CompanyAdmin', permissions: ['CompanyBrandingManage', 'CompanyUsageRead'], features: [] }))
    expect(screen.getByRole('link', { name: /Branding/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Not in your plan')).toBeInTheDocument()
  })
})
