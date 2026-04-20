'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter, aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { validateRecipe } from '@/lib/validators'
import { sanitizeString } from '@/lib/sanitize'
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '@/lib/dal/recipes'
import { validateCookingPreferences } from '@/lib/validators'

export async function createRecipeAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateRecipe(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const recipe = await createRecipe(user.id, validation.data)
    revalidatePath('/recipes')
    return ok(recipe)
  } catch {
    return fail('Could not create recipe.')
  }
}

export async function updateRecipeAction(recipeId, formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId) return fail('Recipe ID is required')

    const validation = validateRecipe(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const recipe = await updateRecipe(user.id, recipeId, validation.data)
    if (!recipe) return fail('Recipe not found')

    revalidatePath('/recipes')
    revalidatePath(`/recipes/${recipeId}`)
    return ok(recipe)
  } catch {
    return fail('Could not update recipe.')
  }
}

export async function getRecipeGenerationContextAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { getPantryItems } = await import('@/lib/dal/pantry')
    const { getCookingPreferences, getDietaryRestrictions } = await import('@/lib/dal/cooking-preferences')

    const [pantryItems, preferences, dietaryRestrictions] = await Promise.all([
      getPantryItems(user.id).catch(() => []),
      getCookingPreferences(user.id).catch(() => null),
      getDietaryRestrictions(user.id).catch(() => []),
    ])

    return ok({ pantryItems, preferences, dietaryRestrictions })
  } catch {
    return fail('Could not load generation context.')
  }
}

export async function saveCookingPreferencesAction(prefs) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateCookingPreferences(prefs || {})
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { saveCookingPreferences } = await import('@/lib/dal/cooking-preferences')
    await saveCookingPreferences(user.id, validation.data)

    return ok(validation.data)
  } catch {
    return fail('Could not save preferences.')
  }
}

export async function generateRecipeAction(prompt, options = {}) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many AI requests. Please wait a moment.')

    const cleanPrompt = sanitizeString(prompt, 500)
    if (!cleanPrompt) return fail('Describe the recipe you want to generate.')

    const { getCookingPreferences, getDietaryRestrictions } = await import('@/lib/dal/cooking-preferences')

    const contextPromises = [
      getCookingPreferences(user.id).catch(() => null),
      getDietaryRestrictions(user.id).catch(() => []),
    ]

    if (options.includePantry) {
      const { getPantryItems } = await import('@/lib/dal/pantry')
      contextPromises.push(getPantryItems(user.id).catch(() => []))
    }

    const results = await Promise.all(contextPromises)
    const context = {
      preferences: results[0],
      dietaryRestrictions: results[1],
      pantryItems: options.includePantry ? results[2] : null,
    }

    const { generateRecipe } = await import('@/lib/gemini')
    const raw = await generateRecipe(cleanPrompt, context)

    const validation = validateRecipe(raw)
    if (!validation.valid) return fail('Generated recipe was invalid. Try a different prompt.')

    return ok({ ...validation.data, source: 'gemini' })
  } catch {
    return fail('Could not generate recipe. Please try again.')
  }
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
const MAX_IMAGES = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export async function scanRecipeAction(formData) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many AI requests. Please wait a moment.')

    const files = formData.getAll('images')
    if (!files || files.length === 0) return fail('At least one photo is required.')
    if (files.length > MAX_IMAGES) return fail(`Maximum ${MAX_IMAGES} photos allowed.`)

    const images = []
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return fail(`Unsupported image type: ${file.type}`)
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return fail('Each image must be under 10 MB.')
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      images.push({
        mimeType: file.type,
        base64: buffer.toString('base64'),
      })
    }

    const { scanRecipeFromImages } = await import('@/lib/gemini')
    const raw = await scanRecipeFromImages(images)

    const validation = validateRecipe(raw)
    if (!validation.valid) return fail('Could not extract a valid recipe. Try clearer photos.')

    return ok({ ...validation.data, source: 'gemini' })
  } catch {
    return fail('Could not scan recipe. Please try again.')
  }
}

const RECIPE_IMAGE_BUCKET = 'recipe-images'
const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Extract a recipe image from the page HTML, download it server-side,
 * and upload it to Supabase Storage.
 *
 * Downloading on the server avoids browser hotlink protection (the browser's
 * Referer header exposes your domain; the server fetch does not).
 * Storing in Supabase means the image is hosted on your own infrastructure
 * and always loads regardless of where the app is deployed.
 *
 * Priority:
 *  1. Recipe JSON-LD structured data image (recipe-specific dish photo)
 *  2. og:image / twitter:image as fallback
 */
async function extractRecipeImage(html, pageUrl, userId) {
  try {
    let imageUrl = null

    // ── 1. Recipe JSON-LD (most accurate: dish photo, not hero banner) ──────
    const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let ldMatch
    // eslint-disable-next-line no-cond-assign
    while ((ldMatch = jsonLdPattern.exec(html)) !== null) {
      try {
        const raw = JSON.parse(ldMatch[1])
        const schemas = Array.isArray(raw) ? raw : [raw]
        for (const schema of schemas) {
          const type = schema?.['@type'] ?? ''
          const isRecipe = type === 'Recipe' ||
            (Array.isArray(type) && type.includes('Recipe'))
          if (!isRecipe) continue

          const img = schema.image
          if (!img) continue

          const candidates = Array.isArray(img) ? img : [img]
          for (const candidate of candidates) {
            const url = typeof candidate === 'string'
              ? candidate
              : (candidate?.url ?? candidate?.contentUrl ?? null)
            if (typeof url === 'string') {
              const resolved = new URL(url, pageUrl).href
              if (resolved.startsWith('https://') || resolved.startsWith('http://')) {
                imageUrl = resolved
                break
              }
            }
          }
          if (imageUrl) break
        }
      } catch {
        // malformed JSON-LD — skip
      }
      if (imageUrl) break
    }

    // ── 2. og:image / twitter:image fallback ─────────────────────────────────
    if (!imageUrl) {
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      if (ogMatch) imageUrl = ogMatch[1]
    }

    if (!imageUrl) {
      const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
      if (twitterMatch) imageUrl = twitterMatch[1]
    }

    if (!imageUrl) return null

    const resolved = new URL(imageUrl, pageUrl).href
    if (!resolved.startsWith('https://') && !resolved.startsWith('http://')) return null

    // ── 3. Download the image server-side ────────────────────────────────────
    // Server fetches don't send a browser Referer header, so hotlink
    // protection on recipe sites doesn't trigger.
    let imgBuf, contentType
    try {
      const imgRes = await fetch(resolved, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Koda/1.0)',
          // Send the recipe page as referrer so CDNs see a valid page context
          'Referer': pageUrl,
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      })
      if (!imgRes.ok) return null

      contentType = (imgRes.headers.get('content-type') || '').split(';')[0].trim()
      if (!contentType.startsWith('image/')) return null

      imgBuf = Buffer.from(await imgRes.arrayBuffer())
      if (imgBuf.length > MAX_RECIPE_IMAGE_BYTES) return null
    } catch {
      return null
    }

    // ── 4. Upload to Supabase Storage ─────────────────────────────────────────
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()

      const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
      const ext = extMap[contentType] ?? 'jpg'
      const storagePath = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(RECIPE_IMAGE_BUCKET)
        .upload(storagePath, imgBuf, { contentType, upsert: false })

      if (uploadError) {
        console.error('[extractRecipeImage] Storage upload failed:', uploadError.message)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from(RECIPE_IMAGE_BUCKET)
        .getPublicUrl(storagePath)

      return publicUrl
    } catch (storageErr) {
      console.error('[extractRecipeImage] Storage error:', storageErr?.message)
      return null
    }
  } catch (err) {
    console.error('[extractRecipeImage] error:', err?.message || err)
    return null
  }
}

export async function importRecipeFromUrlAction(url) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many AI requests. Please wait a moment.')

    const cleanUrl = sanitizeString(url, 2000)
    if (!cleanUrl) return fail('URL is required.')

    let parsed
    try {
      parsed = new URL(cleanUrl)
    } catch {
      return fail('Invalid URL.')
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return fail('Only HTTP/HTTPS URLs are supported.')
    }

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Koda/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.error('[importRecipe] Fetch failed:', res.status, res.statusText, cleanUrl)
      return fail(`Could not fetch page (${res.status}). The site may block automated requests.`)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('html') && !contentType.includes('xml') && !contentType.includes('text/plain')) {
      console.error('[importRecipe] Unexpected content-type:', contentType, cleanUrl)
      return fail(`URL returned unexpected content type: ${contentType}`)
    }

    const html = await res.text()
    if (html.length < 100) return fail('Page content is too short to contain a recipe.')

    const { extractRecipeFromHtml } = await import('@/lib/gemini')
    const raw = await extractRecipeFromHtml(html, cleanUrl)

    const validation = validateRecipe(raw)
    if (!validation.valid) {
      console.error('[importRecipe] Validation failed:', validation.errors, cleanUrl)
      return fail('Could not extract a valid recipe from this page.')
    }

    // Pass userId so extractRecipeImage can upload to the user's Storage folder
    const imageUrl = await extractRecipeImage(html, cleanUrl, user.id)

    return ok({ ...validation.data, source: cleanUrl, ...(imageUrl ? { image_url: imageUrl } : {}) })
  } catch (err) {
    console.error('[importRecipe] error:', err?.message || err)
    return fail('Could not import recipe. Please try again.')
  }
}

export async function deleteRecipeAction(recipeId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId) return fail('Recipe ID is required')

    const success = await deleteRecipe(user.id, recipeId)
    if (!success) return fail('Recipe not found')

    revalidatePath('/recipes')
    return ok()
  } catch {
    return fail('Could not delete recipe.')
  }
}
