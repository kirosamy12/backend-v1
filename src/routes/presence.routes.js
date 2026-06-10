import { Router } from 'express'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()

// In-memory store: visitorId → lastSeen timestamp
const visitors = new Map()
const TIMEOUT_MS = 90 * 1000 // 90 seconds

function purge() {
  const cutoff = Date.now() - TIMEOUT_MS
  for (const [id, ts] of visitors) {
    if (ts < cutoff) visitors.delete(id)
  }
}

// POST /api/presence/ping  — called by storefront every 30s (public)
router.post('/ping', (req, res) => {
  const id = req.body.visitorId
  if (!id || typeof id !== 'string' || id.length > 64) {
    return res.status(400).json({ message: 'Invalid visitorId' })
  }
  visitors.set(id, Date.now())
  purge()
  res.json({ ok: true })
})

// GET /api/presence/online  — admin only
router.get('/online', protectAdmin, (req, res) => {
  purge()
  res.json({ count: visitors.size })
})

export default router
