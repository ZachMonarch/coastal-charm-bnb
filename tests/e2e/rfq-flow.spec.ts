import { test, expect } from '@playwright/test'
import { supabase } from '../../src/integrations/supabase/client'

test.describe('RFQ flow', () => {
  let propertyManagerId: string
  let vendorId: string
  let rfqId: string

  test.beforeAll(async () => {
    // Create test users if they don't exist
    const { data: pmData } = await supabase.auth.signUp({
      email: 'pm_test@example.com',
      password: 'test123!',
      options: {
        data: {
          role: 'property_manager'
        }
      }
    })
    propertyManagerId = pmData.user?.id!

    const { data: vendorData } = await supabase.auth.signUp({
      email: 'vendor_test@example.com',
      password: 'test123!',
      options: {
        data: {
          role: 'vendor'
        }
      }
    })
    vendorId = vendorData.user?.id!
  })

  test('full RFQ lifecycle', async ({ page }) => {
    // 1. Property Manager Creates RFQ
    await test.step('login as property manager', async () => {
      await page.goto('/auth')
      
  // Wait for auth page to load (email input appears)
  await page.waitForSelector('#signin-email', { timeout: 30000 })
      
      // Wait for and fill form fields
      await page.waitForSelector('#signin-email')
      await page.waitForSelector('#signin-password')
      
      await page.fill('#signin-email', 'pm_test@example.com')
      await page.fill('#signin-password', 'test123!')
      
      // Submit form
      await page.click('button:has-text("Sign In")')
      await expect(page).toHaveURL(/\/admin\/rfqs/, { timeout: 30000 })
    })

    await test.step('create new RFQ', async () => {
      await page.waitForSelector('button:has-text("Create RFQ")')
      await page.click('button:has-text("Create RFQ")')

      // Wait for modal to open
      await page.waitForSelector('text=Create New RFQ')

      // Fill RFQ form
      await page.fill('#title', 'Test HVAC Maintenance')
      await page.fill('#description', 'Annual HVAC maintenance for all units')
      
      // Select property from dropdown
      await page.click('button[role="combobox"]:has-text("Select property")')
      await page.click('button[role="option"]:has-text("Test Property")')
      
      // Set deadline
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      // Add lot
      await page.click('button:has-text("Add Lot")')
      await page.fill('input[placeholder="Lot title"]', 'HVAC Unit Service')
      await page.fill('textarea[placeholder="Lot description"]', 'Full service and maintenance check')
      await page.fill('input[type="number"]', '10')
      await page.fill('input[placeholder="Unit of measure"]', 'units')

      // Submit form
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/admin\/rfqs/)

      // Store RFQ ID for later steps  
      const rfqElement = await page.waitForSelector('.rfq-item:first-child')
      rfqId = await rfqElement.getAttribute('data-rfq-id') || ''
      expect(rfqId).toBeTruthy()
    })

    // 2. Vendor Submits Bid
    await test.step('switch to vendor and submit bid', async () => {
      // Sign out
      await page.waitForSelector('button:has-text("Sign Out")')
      await page.click('button:has-text("Sign Out")')
      
      // Wait for auth page and sign in as vendor
      await page.waitForSelector('text=Welcome Back')
      await page.fill('#signin-email', 'vendor_test@example.com')
      await page.fill('#signin-password', 'test123!')
      await page.click('button:has-text("Sign In")')
      
      // Wait for RFQ list and click on the latest RFQ
      await page.waitForSelector('.rfq-item')
      await page.click('.rfq-item:first-child')
      
      // Fill bid form
      await page.fill('input[type="number"]', '500')
      await page.fill('textarea[placeholder*="notes"]', 'Competitive rate for annual maintenance')
      await page.click('button:has-text("Submit Bid")')
      
      // Verify success
      await page.waitForSelector('text=Bid submitted successfully')
    })

    // 3. Property Manager Awards Contract
    await test.step('property manager awards contract', async () => {
      // Sign out
      await page.waitForSelector('button:has-text("Sign Out")')
      await page.click('button:has-text("Sign Out")')
      
      // Wait for auth page and sign in as property manager
      await page.waitForSelector('text=Welcome Back')
      await page.fill('#signin-email', 'pm_test@example.com')
      await page.fill('#signin-password', 'test123!')
      await page.click('button:has-text("Sign In")')
      
      // Navigate to RFQ and view bids
      await page.waitForSelector('.rfq-item:first-child')
      await page.click('.rfq-item:first-child')
      await page.click('button:has-text("View Bids")')
      
      // Award contract
      await page.waitForSelector('button:has-text("Award Contract")')
      await page.click('button:has-text("Award Contract")')
      
      // Confirm contract award
      await page.waitForSelector('button:has-text("Confirm Award")')
      await page.click('button:has-text("Confirm Award")')
      
      // Verify contract status
      await page.waitForSelector('text=Contract Awarded')
    })
  })

  test.afterAll(async () => {
    // Cleanup test data
    if (rfqId) {
      await supabase.from('contracts').delete().eq('rfq_id', rfqId)
      await supabase.from('bid_lines').delete().eq('bid_id', rfqId)
      await supabase.from('rfq_lots').delete().eq('rfq_id', rfqId) 
      await supabase.from('rfqs').delete().eq('id', rfqId)
    }
    if (propertyManagerId) {
      const { error } = await supabase.auth.admin.deleteUser(propertyManagerId)
      if (error) console.error('Error deleting property manager:', error)
    }
    if (vendorId) {
      const { error } = await supabase.auth.admin.deleteUser(vendorId)
      if (error) console.error('Error deleting vendor:', error)
    }
  })
})
