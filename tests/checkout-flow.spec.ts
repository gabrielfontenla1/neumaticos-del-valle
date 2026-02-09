import { test, expect } from '@playwright/test'

test('Complete checkout flow - WhatsApp order', async ({ page, context }) => {
  test.setTimeout(90000)
  
  // Block WhatsApp redirects
  await context.route('**/*api.whatsapp.com**', route => route.abort())
  await context.route('**/*wa.me**', route => route.abort())
  
  // 1. Go to products page
  console.log('1. Navegando a productos...')
  await page.goto('http://localhost:6001/productos')
  await page.waitForTimeout(3000)
  
  // 2. Click the + button on first product
  console.log('2. Agregando producto al carrito...')
  const addButton = page.locator('button svg.lucide-plus').first()
  await addButton.waitFor({ state: 'visible', timeout: 10000 })
  await addButton.click()
  await page.waitForTimeout(1500)
  console.log('Producto agregado!')
  
  await page.screenshot({ path: '/tmp/02-product-added.png' })
  
  // 3. Open cart - click cart icon in header
  console.log('3. Abriendo carrito...')
  const cartIcon = page.locator('header svg.lucide-shopping-cart, header svg.lucide-shopping-bag').first()
  await cartIcon.click()
  await page.waitForTimeout(1500)
  console.log('Carrito abierto!')
  
  await page.screenshot({ path: '/tmp/03-cart-open.png' })
  
  // 4. Click "Finalizar compra" or similar
  console.log('4. Iniciando checkout...')
  const checkoutBtn = page.getByRole('button', { name: /finalizar|whatsapp|comprar/i }).first()
  await checkoutBtn.waitFor({ state: 'visible', timeout: 5000 })
  await checkoutBtn.click()
  await page.waitForTimeout(1500)
  
  await page.screenshot({ path: '/tmp/04-checkout-modal.png' })
  
  // 5. Handle checkout modal - select branch
  console.log('5. Seleccionando sucursal...')
  const modal = page.locator('[role="dialog"]')
  
  if (await modal.isVisible()) {
    console.log('Modal visible, buscando selector de sucursal...')
    
    // Click on branch selector/dropdown
    const branchTrigger = modal.locator('button[role="combobox"], select').first()
    if (await branchTrigger.count() > 0) {
      await branchTrigger.click()
      await page.waitForTimeout(500)
      
      // Select first option
      const option = page.locator('[role="option"], option').first()
      if (await option.count() > 0) {
        await option.click()
        await page.waitForTimeout(500)
      }
    }
    
    await page.screenshot({ path: '/tmp/05-branch-selected.png' })
    
    // Click confirm/send button
    console.log('6. Confirmando pedido...')
    const confirmBtn = modal.getByRole('button', { name: /confirmar|enviar|continuar|finalizar/i }).first()
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
      await page.waitForTimeout(3000)
      console.log('Pedido confirmado!')
    }
  }
  
  await page.screenshot({ path: '/tmp/06-final.png' })
  console.log('Test completado!')
})
