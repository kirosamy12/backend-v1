import Brand from '../models/Brand.js'
import { resolveTheme } from '../services/seasonDrop.service.js'

const VALID_FONTS = ['system', 'inter', 'playfair', 'space-grotesk', 'integral-cf']
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * GET /api/brand/theme
 * Returns the authenticated brand's theme, merged with defaults.
 */
export async function getBrandTheme(req, res, next) {
  try {
    const brand = await Brand.findById(req.brand._id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    const theme = resolveTheme(brand)
    res.json({ theme })
  } catch (err) { next(err) }
}

/**
 * PUT /api/brand/theme
 * Update the authenticated brand's theme fields.
 */
export async function updateBrandTheme(req, res, next) {
  try {
    const { primaryColor, accentColor, coverImage, tagline, story, font } = req.body

    const brand = await Brand.findById(req.brand._id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })

    // Initialize theme if not set
    if (!brand.theme) brand.theme = {}

    // Validate hex colors
    if (primaryColor !== undefined) {
      if (!HEX_COLOR_RE.test(primaryColor)) {
        return res.status(400).json({ message: 'primaryColor must be a valid hex color (e.g. #111111)' })
      }
      brand.theme.primaryColor = primaryColor
    }

    if (accentColor !== undefined) {
      if (!HEX_COLOR_RE.test(accentColor)) {
        return res.status(400).json({ message: 'accentColor must be a valid hex color (e.g. #ffffff)' })
      }
      brand.theme.accentColor = accentColor
    }

    // Validate font
    if (font !== undefined) {
      if (!VALID_FONTS.includes(font)) {
        return res.status(400).json({
          message: `font must be one of: ${VALID_FONTS.join(', ')}`,
        })
      }
      brand.theme.font = font
    }

    // Free-form string fields
    if (coverImage !== undefined) brand.theme.coverImage = coverImage
    if (tagline !== undefined) {
      if (tagline.length > 120) {
        return res.status(400).json({ message: 'tagline must be 120 characters or less' })
      }
      brand.theme.tagline = tagline
    }
    if (story !== undefined) {
      if (story.length > 2000) {
        return res.status(400).json({ message: 'story must be 2000 characters or less' })
      }
      brand.theme.story = story
    }

    brand.markModified('theme')
    await brand.save()

    const theme = resolveTheme(brand)
    res.json({ theme })
  } catch (err) { next(err) }
}
