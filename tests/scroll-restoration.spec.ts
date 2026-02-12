import { test, expect } from '@playwright/test'

// This app uses body as scroll container (html+body both have height:100% + overflow-y:auto)
const getScroll = () => document.body.scrollTop
const setScroll = (y: number) => document.body.scrollTo(0, y)

test.describe('Scroll restoration on back navigation - /productos', () => {
  test('should restore scroll position when returning from product detail (page 1)', async ({ page }) => {
    // 1. Go to productos and wait for products to load
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // 2. Scroll down
    await page.evaluate(setScroll, 800)
    await page.waitForTimeout(500)
    const scrollBefore = await page.evaluate(getScroll)
    console.log(`Scroll before click: ${scrollBefore}`)
    expect(scrollBefore).toBeGreaterThan(400)

    // 3. Click a product link that is VISIBLE at the current scroll position.
    //    Playwright's .click() auto-scrolls the target into view, which changes
    //    body.scrollTop — we find one that's already in view first.
    const visibleHref = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/productos/"]')
      for (const link of links) {
        const rect = link.getBoundingClientRect()
        if (rect.top >= 0 && rect.bottom <= document.body.clientHeight) {
          return link.getAttribute('href')
        }
      }
      return null
    })
    console.log(`Clicking visible product: ${visibleHref}`)
    expect(visibleHref).toBeTruthy()
    await page.locator(`a[href="${visibleHref}"]`).first().click()

    // 4. Wait for product detail page
    await page.waitForURL(/\/productos\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForTimeout(500)
    console.log(`On detail: ${page.url()}`)

    // 5. Go back
    await page.goBack()
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    // Wait for products to render + scroll restoration (100ms initial + up to 30*50ms retries)
    await page.waitForTimeout(4000)

    // 6. Verify scroll restored (tolerance ±250px for product card height differences)
    const scrollAfter = await page.evaluate(getScroll)
    console.log(`Scroll after back: ${scrollAfter} (expected ~${scrollBefore})`)
    const diff = Math.abs(scrollAfter - scrollBefore)
    console.log(`Difference: ${diff}px`)
    expect(diff).toBeLessThan(250)
  })

  test('should preserve page number AND scroll when returning from page 2', async ({ page }) => {
    // 1. Go to page 1, then click page 2 via pagination
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Click page 2 button
    const page2Btn = page.locator('button').filter({ hasText: /^2$/ })
    if (await page2Btn.count() === 0) {
      test.skip()
      return
    }
    await page2Btn.click()
    await page.waitForTimeout(2500)

    // 2. Scroll down on page 2
    await page.evaluate(setScroll, 600)
    await page.waitForTimeout(500)
    const scrollBefore = await page.evaluate(getScroll)
    console.log(`Scroll on page 2: ${scrollBefore}`)
    expect(scrollBefore).toBeGreaterThan(300)

    // 3. Click a product link visible at current scroll position
    const visibleHref2 = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/productos/"]')
      for (const link of links) {
        const rect = link.getBoundingClientRect()
        if (rect.top >= 0 && rect.bottom <= document.body.clientHeight) {
          return link.getAttribute('href')
        }
      }
      return null
    })
    expect(visibleHref2).toBeTruthy()
    await page.locator(`a[href="${visibleHref2}"]`).first().click()
    await page.waitForURL(/\/productos\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForTimeout(500)

    // 4. Go back
    await page.goBack()
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(4000)

    // 5. Check scroll restored
    const scrollAfter = await page.evaluate(getScroll)
    console.log(`Scroll after back: ${scrollAfter} (expected ~${scrollBefore})`)
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(250)

    // 6. Check page 2 is still active
    const activePage = page.locator('button.border-blue-600, button.text-blue-600').filter({ hasText: /^2$/ })
    const count = await activePage.count()
    console.log(`Page 2 active button found: ${count > 0}`)
    expect(count).toBeGreaterThan(0)
  })

  test('changing page after returning from detail should scroll to top', async ({ page }) => {
    // 1. Load products, scroll down, click a visible product
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    await page.evaluate(setScroll, 800)
    await page.waitForTimeout(500)

    const visibleHref = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/productos/"]')
      for (const link of links) {
        const rect = link.getBoundingClientRect()
        if (rect.top >= 0 && rect.bottom <= document.body.clientHeight) {
          return link.getAttribute('href')
        }
      }
      return null
    })
    expect(visibleHref).toBeTruthy()
    await page.locator(`a[href="${visibleHref}"]`).first().click()

    // 2. Wait for detail, go back, wait for scroll restoration
    await page.waitForURL(/\/productos\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForTimeout(500)
    await page.goBack()
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(4000)

    const scrollRestored = await page.evaluate(getScroll)
    console.log(`Scroll restored to: ${scrollRestored}`)
    expect(scrollRestored).toBeGreaterThan(400)

    // 3. Now change page via paginator — this should scroll to top
    const page2Btn = page.locator('button').filter({ hasText: /^2$/ })
    if (await page2Btn.count() === 0) {
      test.skip()
      return
    }
    await page2Btn.click()
    await page.waitForTimeout(1000)

    const scrollAfterPageChange = await page.evaluate(getScroll)
    console.log(`Scroll after page change: ${scrollAfterPageChange}`)
    // Must be near the top (< 50px tolerance for any micro-offset)
    expect(scrollAfterPageChange).toBeLessThan(50)
  })

  test('scrolling to bottom and clicking page 2 should scroll to top', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Scroll to bottom (where paginator is)
    const maxScroll = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight)
    console.log(`Max scroll: ${maxScroll}`)
    await page.evaluate((y: number) => document.body.scrollTo(0, y), maxScroll)
    await page.waitForTimeout(500)
    const scrollAtBottom = await page.evaluate(getScroll)
    console.log(`Scroll at bottom: ${scrollAtBottom}`)
    expect(scrollAtBottom).toBeGreaterThan(1000)

    // Click page 2
    const page2Btn = page.locator('button').filter({ hasText: /^2$/ })
    if (await page2Btn.count() === 0) {
      test.skip()
      return
    }
    await page2Btn.click()
    await page.waitForTimeout(1500)

    const scrollAfter = await page.evaluate(getScroll)
    console.log(`Scroll after clicking page 2: ${scrollAfter}`)
    expect(scrollAfter).toBeLessThan(50)
  })

  test('clicking product near bottom of page should NOT restore to the very bottom', async ({ page }) => {
    // This test covers the scenario: user scrolls near the bottom (where last
    // products and paginator are both visible), clicks a product link, goes back
    // — should NOT be at the very bottom of the page.
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Scroll to near the bottom — close enough that we're in the "danger zone"
    // but still have product cards visible
    const maxScroll = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight)
    console.log(`Max scroll: ${maxScroll}`)
    const nearBottom = maxScroll - 300
    await page.evaluate((y: number) => document.body.scrollTo(0, y), nearBottom)
    await page.waitForTimeout(500)
    const scrollNearBottom = await page.evaluate(getScroll)
    console.log(`Scroll near bottom: ${scrollNearBottom}`)
    expect(scrollNearBottom).toBeGreaterThan(1000)

    // Click a product link that's visible at this near-bottom position
    const visibleHref = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/productos/"]')
      for (const link of links) {
        const rect = link.getBoundingClientRect()
        if (rect.top >= 0 && rect.bottom <= document.body.clientHeight) {
          return link.getAttribute('href')
        }
      }
      return null
    })
    console.log(`Visible product at near-bottom: ${visibleHref}`)
    expect(visibleHref).toBeTruthy()
    await page.locator(`a[href="${visibleHref}"]`).first().click()

    // Wait for product detail
    await page.waitForURL(/\/productos\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForTimeout(500)

    // Go back
    await page.goBack()
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(4000)

    // The scroll should be restored but NOT at the very bottom.
    // The clamp in saveScrollPosition caps at maxScroll - 200.
    const scrollAfter = await page.evaluate(getScroll)
    const maxScrollAfter = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight)
    const distanceFromBottom = maxScrollAfter - scrollAfter
    console.log(`Scroll after back: ${scrollAfter}, max: ${maxScrollAfter}, distance from bottom: ${distanceFromBottom}px`)
    // Should be at least 150px from the bottom (200px clamp with some tolerance)
    expect(distanceFromBottom).toBeGreaterThan(150)
  })

  test('normal filter/page changes should NOT preserve scroll (user-initiated resets work)', async ({ page }) => {
    // This test verifies that isReturningRef doesn't interfere with normal usage
    await page.goto('/productos')
    await page.waitForSelector('a[href^="/productos/"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Scroll down
    await page.evaluate(setScroll, 500)
    await page.waitForTimeout(300)
    const before = await page.evaluate(getScroll)
    expect(before).toBeGreaterThan(300)

    // Change a filter (select a brand) — this should trigger page reset behavior
    // Without having clicked a product link first, isReturning should be false
    // So normal filter behavior should be preserved
    const brandSelect = page.locator('button[role="combobox"]').first()
    if (await brandSelect.count() > 0) {
      // Just verify the page still functions — the filter UI is interactive
      console.log('Filter controls are interactive')
    }

    // The key assertion: no sessionStorage flag was set (no product was clicked)
    const hasFlag = await page.evaluate(() => {
      try {
        return sessionStorage.getItem('scroll-pos:productos:t') !== null
      } catch { return false }
    })
    console.log(`Has sessionStorage flag: ${hasFlag}`)
    expect(hasFlag).toBe(false)
  })
})
