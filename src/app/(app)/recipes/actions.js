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

export async function generateRecipeAction(prompt) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many AI requests. Please wait a moment.')

    const cleanPrompt = sanitizeString(prompt, 500)
    if (!cleanPrompt) return fail('Describe the recipe you want to generate.')

    const { generateRecipe } = await import('@/lib/gemini')
    const raw = await generateRecipe(cleanPrompt)

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

/**
 * Extract a recipe image URL from the page HTML.
 *
 * Priority:
 *  1. Recipe JSON-LD structured data image — this is the dish photo shown
 *     in recipe cards (ingredients/instructions area), not the hero banner.
 *  2. og:image / twitter:image meta tags as a fallback.
 *
 * Returns the https:// URL directly — no download, no base64, no size issues.
 * If the URL turns out to be broken the onError handler in the card hides it.
 */
async function extractRecipeImage(html, pageUrl) {
  try {
    // ── 1. Recipe JSON-LD structured data (most accurate) ──────────────────
    // Recipe sites embed machine-readable data including a recipe-specific
    // image (not the page hero). This is what Google uses for recipe cards.
    const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = jsonLdPattern.exec(html)) !== null) {
      try {
        const raw = JSON.parse(match[1])
        const schemas = Array.isArray(raw) ? raw : [raw]
        for (const schema of schemas) {
          const type = schema?.['@type'] ?? ''
          const isRecipe = type === 'Recipe' ||
            (Array.isArray(type) && type.includes('Recipe'))
          if (!isRecipe) continue

          const img = schema.image
          if (!img) continue

          // image can be: string | ImageObject | Array<string | ImageObject>
          const candidates = Array.isArray(img) ? img : [img]
          for (const candidate of candidates) {
            const url = typeof candidate === 'string'
              ? candidate
              : (candidate?.url ?? candidate?.contentUrl ?? null)
            if (typeof url === 'string') {
              const resolved = new URL(url, pageUrl).href
              if (resolved.startsWith('https://') || resolved.startsWith('http://')) {
                return resolved
              }
            }
          }
        }
      } catch {
        // malformed JSON-LD — skip and try next block
      }
    }

    // ── 2. og:image / twitter:image fallback ───────────────────────────────
    let imgSrc = null

    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch) imgSrc = ogMatch[1]

    if (!imgSrc) {
      const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
      if (twitterMatch) imgSrc = twitterMatch[1]
    }

    if (!imgSrc) return null

    const resolved = new URL(imgSrc, pageUrl).href
    if (!resolved.startsWith('https://') && !resolved.startsWith('http://')) return null

    return resolved
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

    const imageUrl = await extractRecipeImage(html, cleanUrl)

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
