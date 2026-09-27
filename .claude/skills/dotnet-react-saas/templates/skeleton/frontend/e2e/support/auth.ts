import { expect, type Page } from '@playwright/test'
import { totp } from './totp.ts'

export const PASSWORD = process.env.E2E_PASSWORD ?? 'Correct-Horse-Battery-9!'

/** Authenticator keys captured during enrollment, so later sign-ins in the same run can answer the MFA step. */
const keys = new Map<string, string>()

/**
 * Signs in through the real UI and handles whichever step the API asks for: none (owners), MFA enrollment on first
 * staff sign-in (reads the setup key off the page like a user would), or TOTP verification.
 */
export async function signIn(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  const enroll = page.getByRole('heading', { name: 'Set up two-factor authentication', exact: true })
  const verify = page.getByRole('heading', { name: 'Two-factor verification', exact: true })
  const done = page.getByRole('banner').getByRole('button', { name: 'Sign out' })
  await expect(enroll.or(verify).or(done).first()).toBeVisible()

  if (await enroll.isVisible()) {
    const key = (await page.locator('code').first().textContent())!.trim()
    keys.set(email, key)
    await page.getByLabel('Verification code').fill(totp(key))
    await page.getByRole('button', { name: /Enable two-factor/ }).click()
    await expect(page.getByText('Save your recovery codes')).toBeVisible()
    await page.getByLabel(/stored these codes/).check()
    await page.getByRole('button', { name: 'Continue' }).click()
  } else if (await verify.isVisible()) {
    const key = keys.get(email)
    if (!key) throw new Error(`No authenticator key captured for ${email}; enroll it earlier in the run`)
    // Next time-step: the current code may already have been used (and replay is blocked).
    await page.getByLabel('Verification code').fill(totp(key, 1))
    await page.getByRole('button', { name: 'Verify' }).click()
  }

  await expect(done).toBeVisible()
}
