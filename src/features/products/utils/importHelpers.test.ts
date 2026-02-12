import { describe, it, expect } from 'vitest'
import {
  parseTireSize,
  cleanDescription,
  normalizeModelName,
  determineCategory,
  processStockBySucursal,
  normalizeExcelRow,
  hasStockBySucursal,
  generateRealisticPrice,
} from './importHelpers'

describe('importHelpers', () => {
  describe('parseTireSize', () => {
    it('should parse standard metric size 175/65R15', () => {
      const result = parseTireSize('175/65R15')

      expect(result.width).toBe(175)
      expect(result.profile).toBe(65)
      expect(result.diameter).toBe(15)
    })

    it('should parse 3-digit width 205/55R16', () => {
      const result = parseTireSize('205/55R16')

      expect(result.width).toBe(205)
      expect(result.profile).toBe(55)
      expect(result.diameter).toBe(16)
    })

    it('should parse size with ZR like 245/35ZR20', () => {
      const result = parseTireSize('245/35ZR20')

      expect(result.width).toBe(245)
      expect(result.profile).toBe(35)
      expect(result.diameter).toBe(20)
    })

    it('should parse size with space 175/65 R 15', () => {
      const result = parseTireSize('175/65 R 15')

      expect(result.width).toBe(175)
      expect(result.profile).toBe(65)
      expect(result.diameter).toBe(15)
    })

    it('should parse X format like 31X10.50R15', () => {
      const result = parseTireSize('31X10.50R15')

      expect(result.width).toBeGreaterThan(0)
      expect(result.diameter).toBe(15)
    })

    it('should parse old format like 6.00-16', () => {
      const result = parseTireSize('6.00-16')

      expect(result.width).toBeNull()
      expect(result.profile).toBeNull()
      expect(result.diameter).toBe(16)
    })

    it('should parse S format like 5.20S12', () => {
      const result = parseTireSize('5.20S12')

      expect(result.diameter).toBe(12)
    })

    it('should parse no-profile format like 7.50R16', () => {
      const result = parseTireSize('7.50R16')

      expect(result.diameter).toBe(16)
    })

    it('should return nulls for empty input', () => {
      const result = parseTireSize('')

      expect(result.width).toBeNull()
      expect(result.profile).toBeNull()
      expect(result.diameter).toBeNull()
    })

    it('should return nulls for invalid input', () => {
      const result = parseTireSize('INVALID TEXT')

      expect(result.width).toBeNull()
      expect(result.profile).toBeNull()
      expect(result.diameter).toBeNull()
    })

    it('should be case insensitive', () => {
      const resultLower = parseTireSize('175/65r15')
      const resultUpper = parseTireSize('175/65R15')

      expect(resultLower.diameter).toBe(15)
      expect(resultUpper.diameter).toBe(15)
    })
  })

  describe('cleanDescription', () => {
    it('should remove codes in parentheses with x', () => {
      const result = cleanDescription('SCORPION (NB)x ATR')

      expect(result).not.toContain('(NB)')
      expect(result).toContain('SCORPION')
      expect(result).toContain('ATR')
    })

    it('should remove -@ codes', () => {
      const result = cleanDescription('CINTURATO -@ AB P1')

      expect(result).not.toContain('-@')
      expect(result).toContain('CINTURATO')
    })

    it('should remove as+ codes', () => {
      const result = cleanDescription('P ZERO as+2')

      expect(result).not.toMatch(/as\+\d/i)
    })

    it('should remove wl at end', () => {
      const result = cleanDescription('SCORPION ATR wl')

      expect(result).not.toMatch(/\bwl$/i)
    })

    it('should remove multiple spaces', () => {
      const result = cleanDescription('TEST    WITH    SPACES')

      expect(result).toBe('TEST WITH SPACES')
    })

    it('should handle undefined input', () => {
      const result = cleanDescription(undefined)

      expect(result).toBe('')
    })

    it('should handle empty string', () => {
      const result = cleanDescription('')

      expect(result).toBe('')
    })
  })

  describe('normalizeModelName', () => {
    it('should expand P1 cint to CINTURATO P1', () => {
      const result = normalizeModelName('P1 cint')

      expect(result.toUpperCase()).toContain('CINTURATO P1')
    })

    it('should expand P7 cint to CINTURATO P7', () => {
      const result = normalizeModelName('P7 cint')

      expect(result.toUpperCase()).toContain('CINTURATO P7')
    })

    it('should expand PWRGY to POWERGY', () => {
      const result = normalizeModelName('PWRGY test')

      expect(result.toUpperCase()).toContain('POWERGY')
    })

    it('should expand SCORPN to SCORPION', () => {
      const result = normalizeModelName('SCORPN verde')

      expect(result.toUpperCase()).toContain('SCORPION')
    })

    it('should expand PZERO to P ZERO', () => {
      const result = normalizeModelName('PZERO corsa')

      expect(result.toUpperCase()).toContain('P ZERO')
    })

    it('should remove R-F indicator', () => {
      const result = normalizeModelName('CINTURATO P7 R-F')

      expect(result).not.toMatch(/\bR-F\b/i)
    })

    it('should remove XL indicator', () => {
      const result = normalizeModelName('P ZERO XL')

      expect(result).not.toMatch(/\bXL\b/i)
    })

    it('should handle undefined input', () => {
      const result = normalizeModelName(undefined)

      expect(result).toBe('')
    })

    it('should clean multiple spaces', () => {
      const result = normalizeModelName('TEST   MODEL   NAME')

      expect(result).not.toContain('  ')
    })
  })

  describe('determineCategory', () => {
    it('should detect moto category for M/C indicator', () => {
      const result = determineCategory('2.75-18 M/C 48P', null)

      expect(result).toBe('moto')
    })

    it('should detect moto category for SUPER CITY', () => {
      const result = determineCategory('SUPER CITY 110/90-17', null)

      expect(result).toBe('moto')
    })

    it('should detect camion category for C indicator', () => {
      const result = determineCategory('205/70R15C CARRIER', null)

      expect(result).toBe('camion')
    })

    it('should detect camion category for LT indicator', () => {
      const result = determineCategory('LT265/70R17', null)

      expect(result).toBe('camion')
    })

    it('should detect camioneta category for SCORPION', () => {
      const result = determineCategory('SCORPION ATR 265/70R16', null)

      expect(result).toBe('camioneta')
    })

    it('should detect camioneta category for SUV', () => {
      const result = determineCategory('PRIMACY SUV 235/60R18', null)

      expect(result).toBe('camioneta')
    })

    it('should detect camioneta for width >= 235', () => {
      const result = determineCategory('P ZERO 255/35R19', 255)

      expect(result).toBe('camioneta')
    })

    it('should default to auto for narrow tires', () => {
      const result = determineCategory('CINTURATO P1 175/65R14', 175)

      expect(result).toBe('auto')
    })

    it('should default to auto for unknown descriptions', () => {
      const result = determineCategory('UNKNOWN TIRE MODEL', null)

      expect(result).toBe('auto')
    })
  })

  describe('processStockBySucursal', () => {
    it('should calculate total stock from branches', () => {
      const row = {
        BELGRANO: 5,
        CATAMARCA: 3,
        LA_BANDA: 2,
        SALTA: 4,
        TUCUMAN: 6,
        VIRGEN: 1,
      }

      const result = processStockBySucursal(row)

      expect(result.totalStock).toBe(21)
    })

    it('should create stock by branch object', () => {
      const row = {
        BELGRANO: 5,
        TUCUMAN: 10,
      }

      const result = processStockBySucursal(row)

      expect(result.stockPorSucursal.belgrano).toBe(5)
      expect(result.stockPorSucursal.tucuman).toBe(10)
    })

    it('should handle string stock values', () => {
      const row = {
        BELGRANO: '5',
        TUCUMAN: '10',
      }

      const result = processStockBySucursal(row)

      expect(result.totalStock).toBe(15)
    })

    it('should handle missing columns with 0', () => {
      const row = {
        BELGRANO: 5,
      }

      const result = processStockBySucursal(row)

      expect(result.stockPorSucursal.catamarca).toBe(0)
      expect(result.stockPorSucursal.salta).toBe(0)
    })

    it('should handle invalid stock values', () => {
      const row = {
        BELGRANO: 'invalid',
        TUCUMAN: 10,
      }

      const result = processStockBySucursal(row)

      expect(result.stockPorSucursal.belgrano).toBe(0)
      expect(result.totalStock).toBe(10)
    })
  })

  describe('normalizeExcelRow', () => {
    it('should map CODIGO_PROPIO to codigo_propio', () => {
      const row = { CODIGO_PROPIO: 'ABC123' }
      const result = normalizeExcelRow(row)

      expect(result.codigo_propio).toBe('ABC123')
    })

    it('should map DESCRIPCION to descripcion', () => {
      const row = { DESCRIPCION: 'Test tire' }
      const result = normalizeExcelRow(row)

      expect(result.descripcion).toBe('Test tire')
    })

    it('should map MARCA to marca', () => {
      const row = { MARCA: 'PIRELLI' }
      const result = normalizeExcelRow(row)

      expect(result.marca).toBe('PIRELLI')
    })

    it('should preserve stock columns', () => {
      const row = {
        BELGRANO: 5,
        TUCUMAN: 10,
      }
      const result = normalizeExcelRow(row)

      expect(result.BELGRANO).toBe(5)
      expect(result.TUCUMAN).toBe(10)
    })

    it('should copy unmapped columns', () => {
      const row = { CUSTOM_COLUMN: 'value' }
      const result = normalizeExcelRow(row)

      expect(result.CUSTOM_COLUMN).toBe('value')
    })
  })

  describe('hasStockBySucursal', () => {
    it('should return true when headers contain branch columns', () => {
      const headers = ['CODIGO', 'DESCRIPCION', 'BELGRANO', 'TUCUMAN']

      expect(hasStockBySucursal(headers)).toBe(true)
    })

    it('should return false when no branch columns', () => {
      const headers = ['CODIGO', 'DESCRIPCION', 'PRECIO', 'STOCK']

      expect(hasStockBySucursal(headers)).toBe(false)
    })

    it('should be case insensitive', () => {
      const headers = ['belgrano', 'tucuman']

      expect(hasStockBySucursal(headers)).toBe(true)
    })
  })

  describe('generateRealisticPrice', () => {
    it('should generate base price for auto category', () => {
      const result = generateRealisticPrice(null, null, 'auto')

      expect(result).toBeGreaterThan(50000)
      expect(result).toBeLessThan(100000)
    })

    it('should generate higher price for camioneta', () => {
      const autoPrice = generateRealisticPrice(null, null, 'auto')
      const camionetaPrice = generateRealisticPrice(null, null, 'camioneta')

      expect(camionetaPrice).toBeGreaterThan(autoPrice)
    })

    it('should generate higher price for camion', () => {
      const camionetaPrice = generateRealisticPrice(null, null, 'camioneta')
      const camionPrice = generateRealisticPrice(null, null, 'camion')

      expect(camionPrice).toBeGreaterThan(camionetaPrice)
    })

    it('should generate lower price for moto', () => {
      const motoPrice = generateRealisticPrice(null, null, 'moto')
      const autoPrice = generateRealisticPrice(null, null, 'auto')

      expect(motoPrice).toBeLessThan(autoPrice)
    })

    it('should increase price for wider tires', () => {
      const narrowPrice = generateRealisticPrice(155, null, 'auto')
      const widePrice = generateRealisticPrice(255, null, 'auto')

      expect(widePrice).toBeGreaterThan(narrowPrice)
    })

    it('should increase price for larger diameter', () => {
      const smallDiameter = generateRealisticPrice(null, 14, 'auto')
      const largeDiameter = generateRealisticPrice(null, 20, 'auto')

      expect(largeDiameter).toBeGreaterThan(smallDiameter)
    })

    it('should apply brand multiplier for premium brands', () => {
      const pirelliPrice = generateRealisticPrice(205, 16, 'auto', 'PIRELLI')
      const fatePrice = generateRealisticPrice(205, 16, 'auto', 'FATE')

      expect(pirelliPrice).toBeGreaterThan(fatePrice)
    })

    it('should return price rounded to thousands', () => {
      const result = generateRealisticPrice(205, 16, 'auto')

      expect(result % 1000).toBe(0)
    })

    it('should handle unknown category with default auto price', () => {
      const result = generateRealisticPrice(null, null, 'unknown')

      expect(result).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('parseTireSize should handle mixed case input', () => {
      const result = parseTireSize('PIRELLI 205/55R16 91V')

      expect(result.width).toBe(205)
    })

    it('cleanDescription should handle number as input', () => {
      // @ts-expect-error testing runtime behavior
      const result = cleanDescription(12345)

      expect(result).toBe('12345')
    })

    it('normalizeModelName should handle very long input', () => {
      const longName = 'A'.repeat(500)
      const result = normalizeModelName(longName)

      expect(result.length).toBeLessThanOrEqual(500)
    })
  })
})
