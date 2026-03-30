import DOMPurify from 'isomorphic-dompurify'

// Keys that must never appear in sanitized objects — prevents prototype pollution
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Sanitize a string input — strips all HTML tags and trims whitespace.
 * @param {string} input - The raw user input
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return ''
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  return cleaned.trim().slice(0, maxLength)
}

/**
 * Sanitize an email address with RFC 5321 compliant validation.
 * @param {string} email
 * @returns {string|null} Valid email or null
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null
  const cleaned = email.trim().toLowerCase().slice(0, 254)

  // RFC 5321: local@domain.tld
  // - Local part: 1-64 chars, alphanumeric + . _ % + -
  // - Domain: alphanumeric + . -, at least one dot, TLD 2+ chars
  const emailRegex = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(cleaned)) return null

  // Additional length check on local part
  const [localPart] = cleaned.split('@')
  if (localPart.length > 64) return null

  return cleaned
}

/**
 * Sanitize a positive integer.
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @returns {number|null}
 */
export function sanitizeInteger(value, min = 0, max = 10000) {
  const num = parseInt(value, 10)
  if (isNaN(num) || num < min || num > max) return null
  return num
}

/**
 * Sanitize a JSON object — recursively sanitize all string values.
 * Prevents XSS via JSONB fields stored in Supabase.
 * Blocks prototype pollution via dangerous key filtering.
 * @param {*} obj
 * @param {number} maxStringLength
 * @param {number} _depth - Internal recursion guard
 * @returns {*}
 */
export function sanitizeJson(obj, maxStringLength = 500, _depth = 0) {
  // Prevent deeply nested payloads (DoS via recursion)
  if (_depth > 10) return null

  if (obj === null || obj === undefined) return null

  if (typeof obj === 'string') {
    return sanitizeString(obj, maxStringLength)
  }

  if (typeof obj === 'number') {
    // Block NaN, Infinity — these can cause issues in JSON storage
    if (!Number.isFinite(obj)) return null
    return obj
  }

  if (typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => sanitizeJson(item, maxStringLength, _depth + 1))
  }

  if (typeof obj === 'object') {
    const cleaned = Object.create(null) // No prototype — immune to pollution
    const keys = Object.keys(obj).slice(0, 50)
    for (const key of keys) {
      // Block prototype pollution vectors
      if (DANGEROUS_KEYS.has(key)) continue

      const cleanKey = sanitizeString(key, 100)
      if (!cleanKey) continue // Skip empty keys

      cleaned[cleanKey] = sanitizeJson(obj[key], maxStringLength, _depth + 1)
    }
    return cleaned
  }

  // Reject functions, symbols, bigints, etc.
  return null
}

/**
 * Validate that a value is one of the allowed options.
 * @param {string} value
 * @param {string[]} allowedValues
 * @returns {string|null}
 */
export function sanitizeEnum(value, allowedValues) {
  if (typeof value !== 'string') return null
  return allowedValues.includes(value) ? value : null
}
