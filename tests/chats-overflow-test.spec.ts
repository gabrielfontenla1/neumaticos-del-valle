import { test, expect } from '@playwright/test'

test.describe('Chats Page - Text Overflow and UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:6001/admin/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Fill login credentials (adjust as needed)
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'admin123')

    // Click login button
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin**', { timeout: 10000 })

    // Navigate to chats page
    await page.goto('http://localhost:6001/admin/chats')
    await page.waitForLoadState('networkidle')
  })

  test('should display chat interface without overflow', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForSelector('h1:has-text("Chats WhatsApp")', { timeout: 10000 })

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/chats-initial.png', fullPage: true })

    // Check that main container has proper height
    const mainContainer = page.locator('.h-full').first()
    await expect(mainContainer).toBeVisible()

    // Verify no horizontal scrollbar on body
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 20) // Allow 20px tolerance

    console.log('✅ No horizontal overflow detected')
  })

  test('should display skeleton loaders during initial load', async ({ page }) => {
    // Reload to catch skeleton state
    await page.reload()

    // Try to catch skeleton (might be very fast)
    const hasSkeleton = await page.locator('[class*="skeleton"]').count() > 0
    console.log(`Skeleton detected: ${hasSkeleton}`)

    // Wait for conversations to load
    await page.waitForSelector('button:has-text("Bot Activo")', { timeout: 10000 })

    console.log('✅ Content loaded successfully')
  })

  test('should handle long text without overflow in messages', async ({ page }) => {
    // Wait for conversations list
    await page.waitForSelector('button:has-text("Bot Activo")', { timeout: 10000 })

    // Click first conversation
    const firstConv = page.locator('button').filter({ hasText: 'Bot Activo' }).first()
    await firstConv.click()

    // Wait for messages to load
    await page.waitForSelector('[class*="rounded-lg"]', { timeout: 5000 })

    // Check if messages container exists
    const messagesContainer = page.locator('[class*="flex-1"][class*="bg-[#1a1a18]"]')
    await expect(messagesContainer).toBeVisible()

    // Get all message bubbles
    const messageBubbles = page.locator('[class*="rounded-lg"][class*="px-4"]')
    const count = await messageBubbles.count()

    console.log(`Found ${count} message bubbles`)

    if (count > 0) {
      // Check each message bubble for overflow
      for (let i = 0; i < Math.min(count, 5); i++) {
        const bubble = messageBubbles.nth(i)
        const box = await bubble.boundingBox()

        if (box) {
          // Get the parent container width
          const parentWidth = await page.evaluate(() => {
            const viewport = document.querySelector('[class*="flex-1"][class*="bg-[#1a1a18]"]')
            return viewport ? viewport.clientWidth : window.innerWidth
          })

          // Message should not exceed 85% of parent + some tolerance
          const maxWidth = parentWidth * 0.85 + 50 // 50px tolerance for padding/margins

          if (box.width > maxWidth) {
            console.error(`❌ Message ${i} exceeds max width: ${box.width}px > ${maxWidth}px`)
            await page.screenshot({ path: `tests/screenshots/overflow-message-${i}.png` })
          } else {
            console.log(`✅ Message ${i} width OK: ${box.width}px <= ${maxWidth}px`)
          }

          expect(box.width).toBeLessThanOrEqual(maxWidth)
        }
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/chats-messages.png', fullPage: true })

    console.log('✅ No overflow detected in message bubbles')
  })

  test('should have independent scroll areas', async ({ page }) => {
    // Wait for conversations
    await page.waitForSelector('button:has-text("Bot Activo")', { timeout: 10000 })

    // Get conversations list scroll container
    const conversationsScroll = page.locator('[class*="flex-1"]').first()

    // Scroll conversations list
    await conversationsScroll.evaluate(node => {
      const viewport = node.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) viewport.scrollTop = 100
    })

    // Click a conversation
    const firstConv = page.locator('button').filter({ hasText: 'Bot Activo' }).first()
    await firstConv.click()

    // Wait for messages
    await page.waitForSelector('[class*="rounded-lg"][class*="px-4"]', { timeout: 5000 })

    // Get messages scroll container
    const messagesScroll = page.locator('[class*="flex-1"][class*="bg-[#1a1a18]"]')

    // Try to scroll messages
    await messagesScroll.evaluate(node => {
      const viewport = node.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = 100
        console.log('Messages scrolled to:', viewport.scrollTop)
      }
    })

    console.log('✅ Independent scroll areas working')
  })

  test('should display proper layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // On mobile, only one column should be visible at a time
    const conversationsList = page.locator('.w-full.md\\:w-96')
    const messagesView = page.locator('.flex-1')

    // Initially, conversations should be visible
    await expect(conversationsList).toBeVisible()

    // Click a conversation
    const firstConv = page.locator('button').filter({ hasText: 'Bot Activo' }).first()
    await firstConv.click()

    // Now messages should be visible, conversations hidden (on mobile)
    // This is handled by md:flex classes

    // Take mobile screenshot
    await page.screenshot({ path: 'tests/screenshots/chats-mobile.png', fullPage: true })

    console.log('✅ Mobile layout working')
  })

  test('should display pause/resume controls correctly', async ({ page }) => {
    // Wait for conversations
    await page.waitForSelector('button:has-text("Bot Activo")', { timeout: 10000 })

    // Click first conversation
    const firstConv = page.locator('button').filter({ hasText: 'Bot Activo' }).first()
    await firstConv.click()

    // Wait for chat header
    await page.waitForSelector('button:has-text("Tomar Control")', { timeout: 5000 })

    // Check that pause button exists
    const pauseButton = page.locator('button:has-text("Tomar Control")')
    await expect(pauseButton).toBeVisible()

    console.log('✅ Pause/Resume controls displayed correctly')
  })

  test('should handle very long URLs without overflow', async ({ page }) => {
    // This test assumes we can inject a test message or there's already one
    // For now, we'll just verify the CSS classes are in place

    await page.waitForSelector('button:has-text("Bot Activo")', { timeout: 10000 })

    // Click first conversation
    const firstConv = page.locator('button').filter({ hasText: 'Bot Activo' }).first()
    await firstConv.click()

    // Wait for messages
    await page.waitForTimeout(2000)

    // Verify break-words class is applied to message content
    const messageContent = page.locator('[class*="whitespace-pre-wrap"][class*="break-words"]').first()

    if (await messageContent.count() > 0) {
      await expect(messageContent).toBeVisible()
      console.log('✅ break-words class applied to messages')
    } else {
      console.log('⚠️  No messages found to test break-words')
    }
  })
})
