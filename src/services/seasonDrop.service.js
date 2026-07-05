/**
 * State Machine Service for Drops and Seasons
 *
 * All functions are pure — they do not perform any I/O or side effects.
 * State is computed from the document fields and the provided reference time.
 */

// ─── Drop State Constants ────────────────────────────────────
const DROP_STATES = ['scheduled', 'teaser', 'open', 'sold_out']
const TEASER_WINDOW_MS = 48 * 60 * 60 * 1000 // 48 hours in milliseconds

// ─── Season State Constants ──────────────────────────────────
const SEASON_STATES = ['upcoming', 'active', 'ended']

// ─── Default Theme ──────────────────────────────────────────
const DEFAULT_THEME = {
  primaryColor: '#111111',
  accentColor: '#ffffff',
  coverImage: '',
  tagline: '',
  story: '',
  font: 'system',
}

/**
 * Resolves the correct state of a Drop based on its dropDate, stock, and
 * a reference time (defaults to now). This is a pure function — calling it
 * multiple times with the same arguments always returns the same result.
 *
 * State machine: scheduled → teaser → open → sold_out
 *
 * @param {object} drop - Drop document (must have dropDate and stock)
 * @param {Date|number} [now] - Reference time (defaults to Date.now())
 * @returns {'scheduled'|'teaser'|'open'|'sold_out'}
 */
export function resolveDropState(drop, now = Date.now()) {
  const referenceTime = now instanceof Date ? now.getTime() : Number(now)
  const dropTime = drop.dropDate instanceof Date
    ? drop.dropDate.getTime()
    : new Date(drop.dropDate).getTime()

  // If stock is 0 and drop has passed or is open, it's sold out
  if (drop.stock === 0 && referenceTime >= dropTime) {
    return 'sold_out'
  }

  // Drop is live/open
  if (referenceTime >= dropTime) {
    return 'open'
  }

  // Drop is in teaser window (within 48 hours of dropDate)
  if (referenceTime >= dropTime - TEASER_WINDOW_MS) {
    return 'teaser'
  }

  // Drop is scheduled (more than 48 hours away)
  return 'scheduled'
}

/**
 * Resolves the correct state of a Season based on its launchDate, current
 * status, and a reference time (defaults to now). This is a pure function.
 *
 * The `ended` status is terminal — once a season is ended, it stays ended
 * regardless of the launchDate.
 *
 * State machine: upcoming → active → ended
 *
 * @param {object} season - Season document (must have launchDate and status)
 * @param {Date|number} [now] - Reference time (defaults to Date.now())
 * @returns {'upcoming'|'active'|'ended'}
 */
export function resolveSeasonState(season, now = Date.now()) {
  const referenceTime = now instanceof Date ? now.getTime() : Number(now)

  // 'ended' is a terminal state set manually — respect it
  if (season.status === 'ended') {
    return 'ended'
  }

  const launchTime = season.launchDate instanceof Date
    ? season.launchDate.getTime()
    : new Date(season.launchDate).getTime()

  if (referenceTime >= launchTime) {
    return 'active'
  }

  return 'upcoming'
}

/**
 * Merges a brand's theme with defaults, ensuring every field has a defined
 * non-null value. This is a pure function — Property 9 guarantees completeness.
 *
 * @param {object} brand - Brand document (may have partial or missing theme)
 * @returns {object} Complete theme object with all fields defined
 */
export function resolveTheme(brand) {
  const theme = brand?.theme || {}
  return {
    primaryColor: theme.primaryColor || DEFAULT_THEME.primaryColor,
    accentColor:  theme.accentColor  || DEFAULT_THEME.accentColor,
    coverImage:   theme.coverImage   != null ? theme.coverImage  : DEFAULT_THEME.coverImage,
    tagline:      theme.tagline      != null ? theme.tagline     : DEFAULT_THEME.tagline,
    story:        theme.story        != null ? theme.story       : DEFAULT_THEME.story,
    font:         theme.font         || DEFAULT_THEME.font,
  }
}

/**
 * Validates a season status transition.
 * Allowed transitions: upcoming → active, upcoming → ended, active → ended
 * Disallowed (backward): active → upcoming, ended → active, ended → upcoming
 *
 * @param {string} currentStatus - Current season status
 * @param {string} newStatus - Proposed new status
 * @returns {boolean} True if transition is valid
 */
export function isValidSeasonTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true
  const currentIndex = SEASON_STATES.indexOf(currentStatus)
  const newIndex = SEASON_STATES.indexOf(newStatus)
  if (currentIndex === -1 || newIndex === -1) return false
  // Only forward transitions are allowed
  return newIndex > currentIndex
}

export { DROP_STATES, SEASON_STATES, DEFAULT_THEME }
