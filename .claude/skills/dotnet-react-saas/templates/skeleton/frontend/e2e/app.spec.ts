import { expect, test } from '@playwright/test'
import { signIn } from './support/auth.ts'

// Seeded demo accounts (Development seed data in DatabaseSeeder).
const MEMBER = 'member@acme.test'
const ADMIN = 'admin@acme.test'
const SUPER_ADMIN = 'superadmin@myapp.local'

test.describe.configure({ mode: 'serial' })

test('member signs in without MFA and is blocked from staff pages', async ({ page }) => {
  await signIn(page, MEMBER)
  await expect(page).toHaveURL(/\/account$/)

  await page.goto('/items')
  await expect(page.getByText('Access denied')).toBeVisible()
})

test('session survives a reload via the HttpOnly refresh cookie (token never in storage)', async ({ page }) => {
  await signIn(page, MEMBER)
  await page.reload()
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sign out' })).toBeVisible()

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toMatch(/eyJ[A-Za-z0-9_-]+\./)
})

test('staff must enroll an authenticator app, then can create an item', async ({ page }) => {
  await signIn(page, ADMIN) // first sign-in goes through enrollment
  await expect(page).toHaveURL(/\/items$/)

  await page.getByRole('button', { name: 'New item' }).click()
  await page.getByLabel('Name').fill('E2E item')
  await page.getByLabel('Amount').fill('42')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('E2E item')).toBeVisible()
})

test('tenant admin re-brands the app and the theme updates immediately', async ({ page }) => {
  await signIn(page, ADMIN) // second sign-in answers the TOTP challenge
  await page.goto('/tenant/branding')
  await page.getByLabel('Primary', { exact: true }).fill('#0ea5e9')
  await page.getByRole('button', { name: 'Save branding' }).click()
  await expect(page.getByText('Branding saved')).toBeVisible()

  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim())
  expect(primary).toBe('#0ea5e9')
})

test('super admin manages tenants and per-tenant feature access', async ({ page }) => {
  await signIn(page, SUPER_ADMIN)
  await expect(page).toHaveURL(/\/platform\/tenants$/)
  await page.getByText('Globex', { exact: true }).click()
  await page.getByRole('tab', { name: 'Feature access' }).click()
  await expect(page.getByText('Custom Branding')).toBeVisible()
})
