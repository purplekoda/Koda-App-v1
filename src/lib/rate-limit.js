/**
 * In-memory rate limiter for API routes.
 * Limits requests per IP or user ID within a sliding window.
 *
 * Usage in API routes:
 *   import { rateLimit } from '@/lib/rate-limit'
 *   const limiter = rateLimit({ interval: 60_000, maxRequests: 20 })
 *
 *   export async function POST(request) {
 *     const ip = request.headers.get('x-forwarded-for') || 'unknown'
 *     const { success } = limiter.check(ip)
 *     if (!success) return new Response('Too many requests', { status: 429 })
 *     ...
 *   }
 */

const stores = new Map()

export function rateLimit({ interval = 60_000, maxRequests = 20 } = {}) {
  // Cleanup stale entries every 5 minutes to prevent memory leaks
  const CLEANUP_INTERVAL = 5 * 60 * 1000
  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [key, entry] of stores) {
      if (now - entry.windowStart > interval * 2) {
        stores.delete(key)
      }
    }
  }

  return {
    check(identifier) {
      cleanup()

      const now = Date.now()
      const key = `${interval}:${identifier}`
      const entry = stores.get(key)

      if (!entry || now - entry.windowStart > interval) {
        // New window
        stores.set(key, { windowStart: now, count: 1 })
        return { success: true, remaining: maxRequests - 1, resetAt: now + interval }
      }

      if (entry.count >= maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetAt: entry.windowStart + interval,
          retryAfter: Math.ceil((entry.windowStart + interval - now) / 1000),
        }
      }

      entry.count++
      return { success: true, remaining: maxRequests - entry.count, resetAt: entry.windowStart + interval }
    },
  }
}

// Pre-configured limiters for common use cases
export const authLimiter = rateLimit({ interval: 60_000, maxRequests: 10 })    // 10/min for login/signup
export const apiLimiter = rateLimit({ interval: 60_000, maxRequests: 60 })     // 60/min for general API
export const aiLimiter = rateLimit({ interval: 60_000, maxRequests: 20 })      // 20/min for AI queries
export const uploadLimiter = rateLimit({ interval: 60_000, maxRequests: 5 })   // 5/min for file uploads
