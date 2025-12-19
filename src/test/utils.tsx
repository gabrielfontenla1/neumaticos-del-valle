import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Custom render function that wraps components with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any provider props here if needed
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  // Add any providers here (Theme, Context, etc.)
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }

// Test data factories
export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-1',
  name: 'Test Tire 205/55R16',
  brand: 'TestBrand',
  model: 'TestModel',
  price: 50000,
  width: 205,
  profile: 55,
  diameter: 16,
  stock: 10,
  image_url: '/test-image.jpg',
  sku: 'TEST-205-55-16',
  description: 'Test tire description',
  category: 'car',
  ...overrides,
})

export const createMockCartItem = (overrides = {}) => ({
  product_id: 'test-product-1',
  product_name: 'Test Tire 205/55R16',
  sku: 'TEST-205-55-16',
  quantity: 2,
  unit_price: 50000,
  total_price: 100000,
  brand: 'TestBrand',
  model: 'TestModel',
  image_url: '/test-image.jpg',
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-1',
  order_number: 'ORD-2024-00001',
  customer_name: 'Test Customer',
  customer_email: 'test@example.com',
  customer_phone: '1234567890',
  items: [createMockCartItem()],
  subtotal: 100000,
  tax: 0,
  shipping: 0,
  total_amount: 100000,
  status: 'pending',
  payment_status: 'pending',
  payment_method: 'cash',
  source: 'website',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Mock fetch utility
export const mockFetch = (response: unknown, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

// Clear all mocks utility
export const clearAllMocks = () => {
  vi.clearAllMocks()
  localStorage.clear()
}
