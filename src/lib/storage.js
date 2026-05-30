import 'server-only'

import { isMockMode } from './dal/require-user'

export const RECIPE_IMAGE_BUCKET = 'recipe-images'
const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Generate a signed URL for a single file in a Storage bucket.
 * Returns null in mock mode or on error.
 */
export async function getSignedUrl(bucket, storagePath, expiresIn = 86400) {
  if (!storagePath || isMockMode()) return null
  const { getSupabaseServerClient } = await import('./supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn)
  return data?.signedUrl ?? null
}

/**
 * Batch-generate signed URLs for multiple paths in the same bucket.
 * Returns a map of { [storagePath]: signedUrl }.
 */
export async function batchGetSignedUrls(bucket, storagePaths, expiresIn = 86400) {
  const paths = (storagePaths || []).filter(Boolean)
  if (!paths.length || isMockMode()) return {}
  const { getSupabaseServerClient } = await import('./supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresIn)
  if (!data) return {}
  return Object.fromEntries(
    data.filter(item => item.signedUrl).map(item => [item.path, item.signedUrl])
  )
}

/**
 * Upload a buffer to the recipe-images bucket.
 * Returns { storagePath, signedUrl } or null on failure.
 * signedUrl is short-lived (1 hour) for immediate display before DB save.
 */
export async function uploadRecipeImage(buffer, contentType, userId, suffix = '') {
  if (!buffer || !userId || isMockMode()) return null

  const { getSupabaseServerClient } = await import('./supabase/server')
  const supabase = await getSupabaseServerClient()

  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
  const ext = extMap[contentType] ?? 'jpg'
  const storagePath = `${userId}/${Date.now()}${suffix}.${ext}`

  const { error } = await supabase.storage
    .from(RECIPE_IMAGE_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false })

  if (error) {
    console.error('[uploadRecipeImage] Upload failed:', error.message)
    return null
  }

  const signedUrl = await getSignedUrl(RECIPE_IMAGE_BUCKET, storagePath, 3600)
  return { storagePath, signedUrl }
}

/**
 * Download an external image URL and upload it to the recipe-images bucket.
 * Returns { storagePath, signedUrl } or null on any failure.
 */
// Rejects non-HTTPS and RFC-1918 / link-local hosts to prevent SSRF.
function isSafeExternalImageUrl(imageUrl) {
  let parsed
  try { parsed = new URL(imageUrl) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  const h = parsed.hostname
  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^fc00:/i.test(h) ||
    /^fe80:/i.test(h)
  ) return false
  return true
}

export async function downloadExternalImageToStorage(imageUrl, userId) {
  if (!imageUrl || !userId || isMockMode()) return null
  if (!isSafeExternalImageUrl(imageUrl)) return null
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Koda/1.0)',
        Accept: 'image/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim()
    if (!contentType.startsWith('image/')) return null

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > MAX_RECIPE_IMAGE_BYTES) return null

    return await uploadRecipeImage(buf, contentType, userId)
  } catch {
    return null
  }
}

/**
 * Enrich an array of recipe-like objects: for each with photo_path set,
 * replace image_url with a fresh 24-hour signed URL.
 * Objects without photo_path are returned unchanged.
 */
export async function enrichRecipesWithSignedUrls(recipes) {
  if (!recipes || !recipes.length || isMockMode()) return recipes

  const paths = [...new Set(recipes.filter(r => r.photo_path).map(r => r.photo_path))]
  if (!paths.length) return recipes

  const urlMap = await batchGetSignedUrls(RECIPE_IMAGE_BUCKET, paths)

  return recipes.map(r => {
    if (r.photo_path && urlMap[r.photo_path]) {
      return { ...r, image_url: urlMap[r.photo_path] }
    }
    return r
  })
}
