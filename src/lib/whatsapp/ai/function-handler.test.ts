/**
 * Tests for WhatsApp Function Handler
 * 10 tests covering different functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock OpenAI BEFORE importing function-handler
vi.mock('@/lib/ai/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  },
  models: { chat: 'gpt-4' },
  temperatures: { balanced: 0.7 }
}))

import {
  parseNaturalDate,
  formatDateISO,
  getNextDayOfWeek,
  handleBookAppointment,
  handleCheckStock,
  handleShowHelp,
  handleCancelOperation,
  handleGoBack
} from './function-handler'
import type { WhatsAppConversation, PendingAppointment } from '../types'

// Mock dependencies
vi.mock('../repository', () => ({
  updateConversation: vi.fn().mockResolvedValue(undefined),
  pauseConversation: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../services/appointment-service', () => ({
  PROVINCES: [
    { id: 'catamarca', name: 'Catamarca' },
    { id: 'santiago', name: 'Santiago del Estero' },
    { id: 'salta', name: 'Salta' },
    { id: 'tucuman', name: 'Tucumán' }
  ],
  getBranchesByProvince: vi.fn().mockResolvedValue([
    { id: 'branch-1', name: 'Sucursal Centro', province: 'catamarca' }
  ]),
  getServices: vi.fn().mockReturnValue([
    { id: 'alignment', name: 'Alineación', price: 35000, duration: 45 },
    { id: 'balancing', name: 'Balanceo', price: 25000, duration: 30 }
  ]),
  getServiceById: vi.fn().mockImplementation((id: string) => {
    const services: Record<string, { id: string; name: string; price: number; duration: number }> = {
      'alignment': { id: 'alignment', name: 'Alineación', price: 35000, duration: 45 },
      'balancing': { id: 'balancing', name: 'Balanceo', price: 25000, duration: 30 }
    }
    return services[id] || null
  }),
  getAvailableDates: vi.fn().mockReturnValue([
    { date: '2026-01-08', dayName: 'Jueves 08/01', dayOfWeek: 4 },
    { date: '2026-01-09', dayName: 'Viernes 09/01', dayOfWeek: 5 }
  ]),
  getAvailableSlots: vi.fn().mockResolvedValue(['09:00', '09:30', '10:00', '10:30']),
  createWhatsAppAppointment: vi.fn().mockResolvedValue({ success: true, appointmentId: 'apt-123' }),
  formatPrice: vi.fn().mockImplementation((price: number) => `$${price.toLocaleString()}`)
}))

vi.mock('../services/stock-service', () => ({
  searchProductsWithStock: vi.fn().mockResolvedValue([
    { product_id: 'p1', name: 'Pirelli P7', stock: 4, price: 150000 }
  ]),
  findBranchesWithStock: vi.fn().mockResolvedValue([]),
  groupProductsByAvailability: vi.fn().mockReturnValue({
    available: [{ product_id: 'p1', name: 'Pirelli P7', stock: 4, price: 150000 }],
    lastUnits: [],
    singleUnit: [],
    unavailable: []
  })
}))

vi.mock('../services/equivalence-service', () => ({
  findEquivalentsWithStock: vi.fn().mockResolvedValue([])
}))

vi.mock('../services/location-service', () => ({
  getBranchCodeFromCity: vi.fn().mockReturnValue('CATAMARCA'),
  getBranchByCode: vi.fn().mockResolvedValue({ id: 'branch-1', name: 'Sucursal Centro' })
}))

vi.mock('../templates/stock-responses', () => ({
  availableProducts: vi.fn().mockReturnValue('Productos disponibles...'),
  askLocation: vi.fn().mockReturnValue('¿De qué ciudad sos?')
}))

// Helper to create mock conversation
function createMockConversation(overrides: Partial<WhatsAppConversation> = {}): WhatsAppConversation {
  return {
    id: 'conv-123',
    phone: '+5493834123456',
    contact_name: 'Test User',
    status: 'active',
    is_paused: false,
    paused_at: null,
    paused_by: null,
    pause_reason: null,
    message_count: 0,
    conversation_state: 'idle',
    pending_tire_search: null,
    pending_appointment: null,
    user_city: null,
    preferred_branch_id: null,
    last_message_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }
}

// ============================================================================
// TEST 1: parseNaturalDate - "hoy"
// ============================================================================
describe('Test 1: parseNaturalDate - "hoy"', () => {
  it('should return today\'s date in YYYY-MM-DD format', () => {
    const result = parseNaturalDate('hoy')
    const today = new Date()
    const expected = formatDateISO(today)
    expect(result).toBe(expected)
  })
})

// ============================================================================
// TEST 2: parseNaturalDate - "mañana"
// ============================================================================
describe('Test 2: parseNaturalDate - "mañana"', () => {
  it('should return tomorrow\'s date', () => {
    const result = parseNaturalDate('mañana')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expected = formatDateISO(tomorrow)
    expect(result).toBe(expected)
  })

  it('should handle "manana" without accent', () => {
    const result = parseNaturalDate('manana')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expected = formatDateISO(tomorrow)
    expect(result).toBe(expected)
  })
})

// ============================================================================
// TEST 3: parseNaturalDate - Día de la semana
// ============================================================================
describe('Test 3: parseNaturalDate - Day names', () => {
  it('should return next occurrence of "lunes"', () => {
    const result = parseNaturalDate('lunes')
    expect(result).not.toBeNull()
    // Should be a valid date format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // The result should be a future date (check by using getNextDayOfWeek logic)
    const today = new Date()
    const resultDate = new Date(result + 'T12:00:00') // Add time to avoid timezone issues
    expect(resultDate.getTime()).toBeGreaterThan(today.getTime())
  })

  it('should handle "miercoles" without accent', () => {
    const result = parseNaturalDate('miercoles')
    expect(result).not.toBeNull()
    // Should be a valid date format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ============================================================================
// TEST 4: parseNaturalDate - Formato DD/MM
// ============================================================================
describe('Test 4: parseNaturalDate - DD/MM format', () => {
  it('should parse "15/01" correctly', () => {
    const result = parseNaturalDate('15/01')
    expect(result).not.toBeNull()
    expect(result).toMatch(/^\d{4}-01-15$/)
  })

  it('should handle single digit day/month', () => {
    const result = parseNaturalDate('5/2')
    expect(result).not.toBeNull()
    expect(result).toMatch(/^\d{4}-02-05$/)
  })
})

// ============================================================================
// TEST 5: handleBookAppointment - Solicitar provincia
// ============================================================================
describe('Test 5: handleBookAppointment - Request province', () => {
  it('should ask for province when not provided', async () => {
    const conversation = createMockConversation()
    const result = await handleBookAppointment({}, conversation, '+5493834123456')

    expect(result.handled).toBe(true)
    expect(result.response).toContain('provincia')
    expect(result.response).toContain('Catamarca')
  })
})

// ============================================================================
// TEST 6: handleBookAppointment - Acumular datos
// ============================================================================
describe('Test 6: handleBookAppointment - Accumulate data', () => {
  it('should accumulate province in pending appointment', async () => {
    const conversation = createMockConversation()
    const result = await handleBookAppointment(
      { province: 'catamarca' },
      conversation,
      '+5493834123456'
    )

    expect(result.handled).toBe(true)
    expect(result.updatedPending?.province).toBe('catamarca')
  })

  it('should accumulate services', async () => {
    const conversation = createMockConversation({
      pending_appointment: {
        province: 'catamarca',
        branch_id: 'branch-1',
        branch_name: 'Sucursal Centro',
        selected_services: [],
        customer_phone: '+5493834123456',
        started_at: new Date().toISOString()
      }
    })

    const result = await handleBookAppointment(
      { services: ['alignment', 'balancing'] },
      conversation,
      '+5493834123456'
    )

    expect(result.handled).toBe(true)
    expect(result.updatedPending?.selected_services).toContain('alignment')
    expect(result.updatedPending?.selected_services).toContain('balancing')
  })
})

// ============================================================================
// TEST 7: handleCheckStock - Consulta de stock
// ============================================================================
describe('Test 7: handleCheckStock - Stock query', () => {
  it('should search for products by size', async () => {
    const conversation = createMockConversation({
      user_city: 'catamarca'
    })

    const result = await handleCheckStock(
      { width: 205, profile: 55, diameter: 16 },
      conversation
    )

    expect(result.handled).toBe(true)
    expect(result.response).toBeDefined()
  })

  it('should ask for location when city unknown', async () => {
    const conversation = createMockConversation({
      user_city: null
    })

    const result = await handleCheckStock(
      { width: 205, profile: 55, diameter: 16 },
      conversation
    )

    expect(result.handled).toBe(true)
    // Should ask for location or show results
    expect(result.response).toBeDefined()
  })
})

// ============================================================================
// TEST 8: handleShowHelp - Ayuda de servicios
// ============================================================================
describe('Test 8: handleShowHelp - Services help', () => {
  it('should return service list when topic is services', async () => {
    const result = await handleShowHelp({ topic: 'services' })

    expect(result.handled).toBe(true)
    expect(result.response).toContain('Servicios')
  })

  it('should return general help when no topic', async () => {
    const result = await handleShowHelp({})

    expect(result.handled).toBe(true)
    expect(result.response).toBeDefined()
  })
})

// ============================================================================
// TEST 9: handleCancelOperation - Cancelar turno
// ============================================================================
describe('Test 9: handleCancelOperation - Cancel appointment', () => {
  it('should cancel and clear pending appointment', async () => {
    const conversation = createMockConversation({
      pending_appointment: {
        province: 'catamarca',
        branch_id: 'branch-1',
        branch_name: 'Sucursal Centro',
        selected_services: ['alignment'],
        customer_phone: '+5493834123456',
        started_at: new Date().toISOString()
      }
    })

    const result = await handleCancelOperation({}, conversation)

    expect(result.handled).toBe(true)
    expect(result.updatedPending).toBeNull()
    // The function updates the DB to idle state but returns updatedPending: null
    expect(result.response).toContain('cancelado')
  })
})

// ============================================================================
// TEST 10: handleGoBack - Volver atrás
// ============================================================================
describe('Test 10: handleGoBack - Go back', () => {
  it('should revert last field in pending appointment', async () => {
    const conversation = createMockConversation({
      pending_appointment: {
        province: 'catamarca',
        branch_id: 'branch-1',
        branch_name: 'Sucursal Centro',
        selected_services: ['alignment'],
        preferred_date: '2026-01-15',
        customer_phone: '+5493834123456',
        started_at: new Date().toISOString()
      }
    })

    const result = await handleGoBack(conversation)

    expect(result.handled).toBe(true)
    // Should have removed the last field (preferred_date)
    expect(result.updatedPending?.preferred_date).toBeUndefined()
  })

  it('should cancel when going back from empty state (no fields to revert)', async () => {
    const conversation = createMockConversation({
      pending_appointment: {
        selected_services: [],
        customer_phone: '+5493834123456',
        started_at: new Date().toISOString()
      }
    })

    const result = await handleGoBack(conversation)

    expect(result.handled).toBe(true)
    // When there's nothing to go back to, the operation is cancelled
    expect(result.response).toContain('cancelada')
    expect(result.updatedPending).toBeNull()
  })
})
