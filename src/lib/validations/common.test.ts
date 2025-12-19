import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  phoneSchema,
  nameSchema,
  parseAndValidate,
  paginationSchema,
} from './common'

describe('emailSchema', () => {
  it('should accept valid emails', () => {
    const result = emailSchema.safeParse('test@example.com')
    expect(result.success).toBe(true)
  })

  it('should reject invalid emails', () => {
    const result = emailSchema.safeParse('invalid-email')
    expect(result.success).toBe(false)
  })

  it('should reject empty emails', () => {
    const result = emailSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('should accept valid phone numbers', () => {
    const validPhones = [
      '12345678',
      '+54 11 1234-5678',
      '(011) 1234-5678',
      '011-1234-5678',
    ]

    validPhones.forEach((phone) => {
      const result = phoneSchema.safeParse(phone)
      expect(result.success).toBe(true)
    })
  })

  it('should reject phone numbers with letters', () => {
    const result = phoneSchema.safeParse('abc12345')
    expect(result.success).toBe(false)
  })

  it('should reject short phone numbers', () => {
    const result = phoneSchema.safeParse('1234')
    expect(result.success).toBe(false)
  })
})

describe('nameSchema', () => {
  it('should accept valid names', () => {
    const result = nameSchema.safeParse('Juan Perez')
    expect(result.success).toBe(true)
  })

  it('should reject names that are too short', () => {
    const result = nameSchema.safeParse('J')
    expect(result.success).toBe(false)
  })

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(101)
    const result = nameSchema.safeParse(longName)
    expect(result.success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('should accept valid pagination values', () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 10 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(10)
    }
  })

  it('should apply defaults when not provided', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(50)
    }
  })

  it('should reject page less than 1', () => {
    const result = paginationSchema.safeParse({ page: 0, limit: 10 })
    expect(result.success).toBe(false)
  })

  it('should reject limit greater than 500', () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 501 })
    expect(result.success).toBe(false)
  })
})

describe('parseAndValidate', () => {
  it('should return success with valid data', () => {
    const result = parseAndValidate(emailSchema, 'test@example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@example.com')
    }
  })

  it('should return error message with invalid data', () => {
    const result = parseAndValidate(emailSchema, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Email inválido')
    }
  })

  it('should format multiple errors correctly', () => {
    const schema = nameSchema
    const result = parseAndValidate(schema, '')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })
})
