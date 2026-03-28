import DOMPurify from 'isomorphic-dompurify'

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
 * Sanitize an email address.
 * @param {string} email
 * @returns {string|null} Valid email or null
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null
  const cleaned = email.trim().toLowerCase().slice(0, 254)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(cleaned) ? cleaned : null
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
 * @param {*} obj
 * @param {number} maxStringLength
 * @returns {*}
 */
export function sanitizeJson(obj, maxStringLength = 500) {
  if (obj === null || obj === undefined) return null

  if (typeof obj === 'string') {
    return sanitizeString(obj, maxStringLength)
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => sanitizeJson(item, maxStringLength))
  }

  if (typeof obj === 'object') {
    const cleaned = {}
    const keys = Object.keys(obj).slice(0, 50)
    for (const key of keys) {
      const cleanKey = sanitizeString(key, 100)
      cleaned[cleanKey] = sanitizeJson(obj[key], maxStringLength)
    }
    return cleaned
  }

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
