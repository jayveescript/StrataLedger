import { expect, test } from '@playwright/test'
import { signIn } from './support/auth.ts'

// Seeded demo accounts (Development seed data).
const OWNER = 'james.chen@email.com'
const ADMIN = 'admin@premierstrata.com.au'
const SUPER_ADMIN = 'superadmin@strataledger.local'

test.describe.configure({ mode: 'serial' })

test('owner signs in without MFA, sees only their property, and is blocked from staff pages', async ({ page }) => {
  await signIn(page, OWNER)
  await expect(page).toHaveURL(/\/portal$/)
  await expect(page.getByText('Southbank Residences')).toBeVisible()

  await page.goto('/strata-plans')
  await expect(page.getByText('Access denied')).toBeVisible()
})

test('session survives a reload via the HttpOnly refresh cookie (token never in storage)', async ({ page }) => {
  await signIn(page, OWNER)
  await page.reload()
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sign out' })).toBeVisible()

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toMatch(/eyJ[A-Za-z0-9_-]+\./) // no JWTs in web storage
})

test('staff must enroll an authenticator app, then reach the dashboard and plan details', async ({ page }) => {
  await signIn(page, ADMIN) // first sign-in goes through enrollment
  await expect(page.getByText('Needs attention')).toBeVisible()

  await page.getByRole('link', { name: 'Strata plans' }).click()
  await page.getByText('Southbank Residences').click()
  await expect(page.getByText('Lots & ownership')).toBeVisible()
})

test('company admin re-brands the portal and the theme updates immediately', async ({ page }) => {
  await signIn(page, ADMIN) // second sign-in answers the TOTP challenge
  await page.goto('/company/branding')
  await page.getByLabel('Primary', { exact: true }).fill('#0ea5e9')
  await page.getByRole('button', { name: 'Save branding' }).click()
  await expect(page.getByText('Branding saved')).toBeVisible()

  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim())
  expect(primary).toBe('#0ea5e9')
})

test('super admin manages tenants and per-company feature access', async ({ page }) => {
  await signIn(page, SUPER_ADMIN)
  await expect(page).toHaveURL(/\/platform\/companies$/)
  await page.getByText('Metro Property Management', { exact: true }).click()
  await page.getByRole('tab', { name: 'Feature access' }).click()
  await expect(page.getByText('Custom Branding')).toBeVisible()
})
