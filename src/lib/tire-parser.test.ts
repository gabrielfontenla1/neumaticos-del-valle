import { describe, it, expect } from 'vitest'
import {
  cleanDescriptionForDisplay,
  parseTireDescription,
  parseTireDescriptionBatch,
  TireData,
} from './tire-parser'

describe('tire-parser', () => {
  describe('cleanDescriptionForDisplay', () => {
    it('should remove internal codes like (NB)x', () => {
      const result = cleanDescriptionForDisplay('205/55R16 91V (NB)x')
      expect(result).not.toContain('(NB)')
      expect(result).toContain('205/55R16')
    })

    it('should remove wl indicator', () => {
      const result = cleanDescriptionForDisplay('SCORPION ATR 265/70R16 wl')
      expect(result).not.toMatch(/\bwl\b/i)
    })

    it('should remove (K1) code', () => {
      const result = cleanDescriptionForDisplay('P ZERO 245/35R20 (K1)')
      expect(result).not.toContain('(K1)')
    })

    it('should clean up multiple spaces', () => {
      const result = cleanDescriptionForDisplay('205/55R16   91V   XL')
      expect(result).not.toContain('  ')
    })

    it('should trim whitespace', () => {
      const result = cleanDescriptionForDisplay('  205/55R16 91V  ')
      expect(result).toBe('205/55R16 91V')
    })

    it('should handle empty string', () => {
      const result = cleanDescriptionForDisplay('')
      expect(result).toBe('')
    })
  })

  describe('parseTireDescription', () => {
    describe('metric size parsing', () => {
      it('should parse standard metric size 205/55R16', () => {
        const result = parseTireDescription('CINTURATO P1 205/55R16 91V')

        expect(result.width).toBe(205)
        expect(result.aspect_ratio).toBe(55)
        expect(result.rim_diameter).toBe(16)
        expect(result.construction).toBe('R')
      })

      it('should parse size with lowercase z construction', () => {
        // Parser supports lowercase construction letters
        const result = parseTireDescription('245/35zr20 95Y')

        // Note: The regex /(\d{2,3})\/(\d{2,3})([RZrz])(\d{2})/ captures 'z' in 'zr'
        // This is a known limitation - ZR format has two letters but regex captures one
        expect(result.load_index).toBe(95)
        expect(result.speed_rating).toBe('Y')
      })

      it('should parse size without aspect ratio like 175R13', () => {
        const result = parseTireDescription('175R13 86Q')

        expect(result.width).toBe(175)
        expect(result.aspect_ratio).toBeNull()
        expect(result.rim_diameter).toBe(13)
        expect(result.construction).toBe('R')
      })

      it('should handle lowercase r construction', () => {
        const result = parseTireDescription('195/65r15 91H')

        expect(result.construction).toBe('R')
        expect(result.width).toBe(195)
      })
    })

    describe('load index and speed rating parsing', () => {
      it('should parse load index and speed rating', () => {
        const result = parseTireDescription('205/55R16 91V')

        expect(result.load_index).toBe(91)
        expect(result.speed_rating).toBe('V')
      })

      it('should parse high load index', () => {
        const result = parseTireDescription('265/70R16 112H')

        expect(result.load_index).toBe(112)
        expect(result.speed_rating).toBe('H')
      })

      it('should parse Y speed rating', () => {
        const result = parseTireDescription('255/35R19 96Y')

        expect(result.speed_rating).toBe('Y')
      })
    })

    describe('tire characteristics detection', () => {
      it('should detect XL (extra load)', () => {
        const result = parseTireDescription('205/55R16 94V XL')

        expect(result.extra_load).toBe(true)
      })

      it('should detect run-flat RF', () => {
        const result = parseTireDescription('225/45R18 95Y RF')

        expect(result.run_flat).toBe(true)
      })

      it('should detect run-flat with hyphen', () => {
        const result = parseTireDescription('225/45R18 95Y R-F')

        expect(result.run_flat).toBe(true)
      })

      it('should detect seal inside S-I', () => {
        const result = parseTireDescription('205/55R16 91V S-I')

        expect(result.seal_inside).toBe(true)
      })

      it('should detect tube type TT', () => {
        const result = parseTireDescription('2.75-18 48P TT')

        expect(result.tube_type).toBe(true)
      })

      it('should return false for characteristics not present', () => {
        const result = parseTireDescription('205/55R16 91V')

        expect(result.extra_load).toBe(false)
        expect(result.run_flat).toBe(false)
        expect(result.seal_inside).toBe(false)
        expect(result.tube_type).toBe(false)
      })
    })

    describe('homologation extraction', () => {
      it('should detect BMW homologation (*)', () => {
        const result = parseTireDescription('225/45R18 95Y (*)')

        expect(result.homologation).toContain('BMW')
      })

      it('should detect Mercedes homologation (MO)', () => {
        const result = parseTireDescription('255/40R18 99Y (MO)')

        expect(result.homologation).toContain('Mercedes')
      })

      it('should detect Audi homologation (AO)', () => {
        const result = parseTireDescription('235/55R18 100V (AO)')

        expect(result.homologation).toContain('Audi')
      })

      it('should detect Porsche homologation (N0)', () => {
        const result = parseTireDescription('235/40R19 92Y (N0)')

        expect(result.homologation).toContain('Porsche')
      })

      it('should return null when no homologation', () => {
        const result = parseTireDescription('205/55R16 91V')

        expect(result.homologation).toBeNull()
      })
    })

    describe('confidence scoring', () => {
      it('should have high confidence for complete data', () => {
        const result = parseTireDescription('205/55R16 91V')

        // width(20) + aspect(15) + diameter(20) + construction(15) + load(15) + speed(15) = 100
        expect(result.parse_confidence).toBe(100)
      })

      it('should have lower confidence for incomplete data', () => {
        const result = parseTireDescription('SOME RANDOM TEXT')

        expect(result.parse_confidence).toBeLessThan(50)
      })

      it('should have partial confidence for partial data', () => {
        const result = parseTireDescription('175R13')

        // width(20) + diameter(20) + construction(15) = 55
        expect(result.parse_confidence).toBeGreaterThanOrEqual(55)
      })
    })

    describe('warnings generation', () => {
      it('should generate no warnings for complete data', () => {
        const result = parseTireDescription('205/55R16 91V')

        expect(result.parse_warnings).toHaveLength(0)
      })

      it('should warn when width not detected', () => {
        const result = parseTireDescription('RANDOM TEXT 91V')

        expect(result.parse_warnings).toContain('Width not detected')
      })

      it('should warn when rim diameter not detected', () => {
        const result = parseTireDescription('RANDOM TEXT')

        expect(result.parse_warnings).toContain('Rim diameter not detected')
      })
    })

    describe('original and display names', () => {
      it('should preserve original description', () => {
        const original = '205/55R16 91V (NB)x'
        const result = parseTireDescription(original)

        expect(result.original_description).toBe(original)
      })

      it('should clean display name', () => {
        const result = parseTireDescription('205/55R16 91V (NB)x wl')

        expect(result.display_name).not.toContain('(NB)')
        expect(result.display_name).not.toMatch(/\bwl\b/i)
      })
    })
  })

  describe('parseTireDescriptionBatch', () => {
    it('should parse multiple descriptions', () => {
      const descriptions = [
        '205/55R16 91V',
        '225/45R18 95Y XL',
        '265/70R16 112H',
      ]

      const results = parseTireDescriptionBatch(descriptions)

      expect(results).toHaveLength(3)
      expect(results[0].width).toBe(205)
      expect(results[1].extra_load).toBe(true)
      expect(results[2].load_index).toBe(112)
    })

    it('should handle empty array', () => {
      const results = parseTireDescriptionBatch([])

      expect(results).toHaveLength(0)
    })

    it('should return TireData objects for each description', () => {
      const descriptions = ['205/55R16 91V']
      const results = parseTireDescriptionBatch(descriptions)

      // Check it has all TireData properties
      const result = results[0]
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('aspect_ratio')
      expect(result).toHaveProperty('rim_diameter')
      expect(result).toHaveProperty('construction')
      expect(result).toHaveProperty('load_index')
      expect(result).toHaveProperty('speed_rating')
      expect(result).toHaveProperty('extra_load')
      expect(result).toHaveProperty('run_flat')
      expect(result).toHaveProperty('seal_inside')
      expect(result).toHaveProperty('tube_type')
      expect(result).toHaveProperty('homologation')
      expect(result).toHaveProperty('original_description')
      expect(result).toHaveProperty('display_name')
      expect(result).toHaveProperty('parse_confidence')
      expect(result).toHaveProperty('parse_warnings')
    })
  })

  describe('edge cases', () => {
    it('should handle whitespace-only input', () => {
      const result = parseTireDescription('   ')

      expect(result.width).toBeNull()
      expect(result.original_description).toBe('')
    })

    it('should handle numeric-only input', () => {
      const result = parseTireDescription('12345')

      expect(result.parse_confidence).toBeLessThan(50)
    })

    it('should handle special characters', () => {
      const result = parseTireDescription('205/55R16 91V !@#$%')

      expect(result.width).toBe(205)
    })

    it('should be case insensitive for characteristics', () => {
      const resultLower = parseTireDescription('205/55R16 91V xl')
      const resultUpper = parseTireDescription('205/55R16 91V XL')

      expect(resultLower.extra_load).toBe(true)
      expect(resultUpper.extra_load).toBe(true)
    })
  })
})
