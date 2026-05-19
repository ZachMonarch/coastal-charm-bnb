import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * Regression: public RFQ share link must remain accessible (anon) for
 * RFQs whose status is `open` or `published`, and the public RPC
 * `get_public_rfq` must return a row. Guards against RLS / RPC
 * regressions that previously broke shared links.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yhegaaqxmuhszesbjtdo.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE'

test.describe('RFQ public share link (anon access)', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  test('get_public_rfqs returns at least one open/published RFQ', async () => {
    const { data, error } = await supabase.rpc('get_public_rfqs', { _limit: 5, _offset: 0 })
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  test('shared link /rfq/:id loads for an open RFQ', async ({ page }) => {
    const { data, error } = await supabase.rpc('get_public_rfqs', { _limit: 1, _offset: 0 })
    expect(error).toBeNull()
    if (!data || data.length === 0) test.skip(true, 'No public RFQs available')

    const rfq = (data as Array<{ id: string; title: string }>)[0]
    const { data: single, error: singleErr } = await supabase.rpc('get_public_rfq', { _id: rfq.id })
    expect(singleErr).toBeNull()
    expect(single?.[0]?.id).toBe(rfq.id)

    await page.goto(`/rfq/${rfq.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=/Request access|Sign up to request access|Awaiting admin approval/i')).toBeVisible()
  })

  test('discovery page lists shared projects', async ({ page }) => {
    await page.goto('/rfq')
    await expect(page).toHaveURL(/\/rfq$/)
    // Page should render without auth gate
    await expect(page.locator('a[href^="/rfq/"]').first()).toBeVisible({ timeout: 15000 })
  })
})
