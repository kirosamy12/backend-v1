// Feature: brand-season-platform, Property 9: Brand theme fallback completeness

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { resolveTheme } from './seasonDrop.service.js'

const VALID_FONTS = ['system', 'inter', 'playfair', 'space-grotesk', 'integral-cf']
const THEME_FIELDS = ['primaryColor', 'accentColor', 'coverImage', 'tagline', 'story', 'font']

// Arbitrary for a partial theme — any subset of theme fields may be present or absent
const partialThemeArb = fc.record(
  {
    primaryColor: fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.hexaString({ minLength: 6, maxLength: 7 }).map(s => `#${s.slice(0, 6)}`)),
    accentColor:  fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.hexaString({ minLength: 6, maxLength: 7 }).map(s => `#${s.slice(0, 6)}`)),
    coverImage:   fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.webUrl()),
    tagline:      fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.string({ maxLength: 120 })),
    story:        fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.string({ maxLength: 2000 })),
    font:         fc.oneof(fc.constant(undefined), fc.constant(null), fc.constantFrom(...VALID_FONTS)),
  },
  { requiredKeys: [] } // all keys are optional — any combination may be present
)

// Arbitrary for a brand with varying theme shapes
const brandArb = fc.oneof(
  // No theme at all
  fc.constant({}),
  // theme is null or undefined
  fc.constant({ theme: null }),
  fc.constant({ theme: undefined }),
  // Empty theme object
  fc.constant({ theme: {} }),
  // Partial theme with random fields
  partialThemeArb.map(theme => ({ theme }))
)

describe('Property 9: Brand theme fallback completeness', () => {
  it('resolveTheme always returns a fully-defined object with no undefined fields', () => {
    fc.assert(
      fc.property(brandArb, (brand) => {
        const result = resolveTheme(brand)

        // Every required theme field must be defined and non-null
        for (const field of THEME_FIELDS) {
          expect(result[field]).toBeDefined()
          expect(result[field]).not.toBeNull()
        }

        // font must be one of the valid enum values
        expect(VALID_FONTS).toContain(result.font)

        // color fields that are non-empty must start with '#'
        if (result.primaryColor) expect(result.primaryColor).toMatch(/^#/)
        if (result.accentColor)  expect(result.accentColor).toMatch(/^#/)
      }),
      { numRuns: 100 }
    )
  })
})
