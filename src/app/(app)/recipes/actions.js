'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { apiLimiter, aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { validateRecipe } from '@/lib/validators'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeById,
} from '@/lib/dal/recipes'
import {
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
} from '@/lib/dal/collections'
import { validateCookingPreferences } from '@/lib/validators'

export async function createRecipeAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateRecipe(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (!isMockMode()) {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()

      // Check for duplicate by source URL (for URL-imported recipes)
      const sourceUrl = validation.data.source
      const isUrl = sourceUrl && sourceUrl !== 'gemini' && sourceUrl.startsWith('http')
      if (isUrl) {
        const { data: byUrl } = await supabase
          .from('recipes')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('source', sourceUrl)
          .limit(1)
          .single()
        if (byUrl) return ok({ ...byUrl, alreadyExists: true })
      }

      // Check for duplicate by name (case-insensitive)
      const { data: byName } = await supabase
        .from('recipes')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', validation.data.name)
        .limit(1)
        .single()
      if (byName) return ok({ ...byName, alreadyExists: true })
    }

    const recipe = await createRecipe(user.id, validation.data)

    // Silently update taste profile in the background
    import('@/lib/dal/taste-profile')
      .then(m => m.analyzeAndUpdateTasteProfile(user.id, { ...validation.data, id: recipe.id }))
      .catch(() => {})

    // Silently estimate nutrition in the background
    import('@/lib/gemini')
      .then(m => m.estimateNutrition(validation.data.ingredients, validation.data.servings || 4))
      .then(nutrition => updateRecipe(user.id, recipe.id, { nutrition, nutrition_is_estimated: true }))
      .catch(() => {})

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
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

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

function isPrivateHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  // Strip IPv6 brackets
  const bare = hostname.replace(/^\[|\]$/g, '')
  const parts = bare.split('.').map(Number)
  if (parts.length === 4 && parts.every((n) => n >= 0 && n <= 255)) {
    return (
      parts[0] === 127 ||                          // 127.0.0.0/8
      parts[0] === 10 ||                            // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) ||     // 192.168.0.0/16
      (parts[0] === 169 && parts[1] === 254) ||     // 169.254.0.0/16 (link-local / cloud metadata)
      parts[0] === 0                                // 0.0.0.0/8
    )
  }
  return false
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
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const files = formData.getAll('images')
    if (!files || files.length === 0) return fail('At least one photo is required.')
    if (files.length > MAX_IMAGES) return fail(`Maximum ${MAX_IMAGES} photos allowed.`)

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return fail(`Unsupported image type: ${file.type}`)
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return fail('Each image must be under 10 MB.')
      }
    }

    const images = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        return { mimeType: file.type, base64: buffer.toString('base64') }
      }),
    )

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

    const imgParsed = new URL(resolved)
    if (isPrivateHostname(imgParsed.hostname)) return null

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

/**
 * Detect the platform name from a URL hostname.
 */
function detectPlatform(hostname) {
  const h = hostname.toLowerCase()
  if (h.includes('tiktok.com')) return 'TikTok'
  if (h.includes('instagram.com')) return 'Instagram'
  if (h.includes('pinterest.com') || h.includes('pin.it')) return 'Pinterest'
  if (h.includes('youtube.com') || h.includes('youtu.be')) return 'YouTube'
  if (h.includes('facebook.com') || h.includes('fb.com')) return 'Facebook'
  if (h.includes('twitter.com') || h.includes('x.com')) return 'X'
  return 'Website'
}

export async function importRecipeFromUrlAction(url) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

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
    if (isPrivateHostname(parsed.hostname)) {
      return fail('URLs pointing to internal networks are not allowed.')
    }

    const platform = detectPlatform(parsed.hostname)

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Koda/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })

    // Detect login walls and platform-specific issues
    if (res.status === 401 || res.status === 403) {
      return fail('We couldn\'t read this page \u2014 it may require a login. Try copying the recipe text directly instead.')
    }
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

    // Detect login walls in page content
    const lowerHtml = html.slice(0, 5000).toLowerCase()
    if (
      (lowerHtml.includes('sign in') || lowerHtml.includes('log in')) &&
      lowerHtml.includes('password') &&
      !lowerHtml.includes('recipe')
    ) {
      return fail('We couldn\'t read this page \u2014 it may require a login. Try copying the recipe text directly instead.')
    }

    const { extractRecipeFromHtml } = await import('@/lib/gemini')
    const raw = await extractRecipeFromHtml(html, cleanUrl)

    const validation = validateRecipe(raw)
    if (!validation.valid) {
      console.error('[importRecipe] Validation failed:', validation.errors, cleanUrl)
      return fail('Could not extract a valid recipe from this page.')
    }

    // Check for partial extraction (fewer than 3 ingredients)
    const ingredientCount = (validation.data.ingredients || []).length
    const isPartial = ingredientCount < 3

    // Pass userId so extractRecipeImage can upload to the user's Storage folder
    const imageUrl = await extractRecipeImage(html, cleanUrl, user.id)

    return ok({
      ...validation.data,
      source: cleanUrl,
      imported_from: platform,
      imported_at: new Date().toISOString(),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(isPartial ? { _isPartial: true } : {}),
    })
  } catch (err) {
    console.error('[importRecipe] error:', err?.message || err)
    return fail('Could not import recipe. Please try again.')
  }
}

export async function importRecipeFromPhotoAction(formData) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const files = formData.getAll('images')
    if (!files || files.length === 0) return fail('At least one photo is required.')
    if (files.length > MAX_IMAGES) return fail(`Maximum ${MAX_IMAGES} photos allowed.`)

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return fail(`Unsupported image type: ${file.type}`)
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return fail('Each image must be under 10 MB.')
      }
    }

    const images = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        return { mimeType: file.type, base64: buffer.toString('base64') }
      }),
    )

    const { identifyDishFromPhoto } = await import('@/lib/gemini')
    const raw = await identifyDishFromPhoto(images)

    const validation = validateRecipe(raw)
    if (!validation.valid) return fail('Could not identify a recipe from this photo. Try a clearer image.')

    // Upload the first photo to Supabase Storage as the recipe image
    let imageUrl = null
    if (!isMockMode()) {
      try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/server')
        const supabase = await getSupabaseServerClient()
        const ext = images[0].mimeType === 'image/png' ? 'png' : 'jpg'
        const storagePath = `${user.id}/${Date.now()}-photo.${ext}`
        const imgBuf = Buffer.from(images[0].base64, 'base64')

        const { error: uploadError } = await supabase.storage
          .from(RECIPE_IMAGE_BUCKET)
          .upload(storagePath, imgBuf, { contentType: images[0].mimeType, upsert: false })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from(RECIPE_IMAGE_BUCKET)
            .getPublicUrl(storagePath)
          imageUrl = publicUrl
        }
      } catch {
        // Photo upload failed — continue without image
      }
    }

    const ingredientCount = (validation.data.ingredients || []).length
    const isPartial = ingredientCount < 3

    return ok({
      ...validation.data,
      imported_from: 'Photo',
      imported_at: new Date().toISOString(),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(raw.confidence ? { _confidence: raw.confidence } : {}),
      ...(isPartial ? { _isPartial: true } : {}),
    })
  } catch {
    return fail('Could not identify recipe from photo. Please try again.')
  }
}

export async function generateRecipeIdeasAction(mode) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const cleanMode = sanitizeEnum(mode, ['general', 'expiring']) || 'general'

    const { getCookingPreferences, getDietaryRestrictions } = await import('@/lib/dal/cooking-preferences')
    const { getPantryItems } = await import('@/lib/dal/pantry')
    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')

    const [preferences, dietaryRestrictions, pantryItems, { systemPromptPrefix }] = await Promise.all([
      getCookingPreferences(user.id).catch(() => null),
      getDietaryRestrictions(user.id).catch(() => []),
      getPantryItems(user.id).catch(() => []),
      buildMealPlanPrompt(user.id).catch(() => ({ systemPromptPrefix: '' })),
    ])

    const context = { preferences, dietaryRestrictions, pantryItems, mealPlanSystemPrompt: systemPromptPrefix }

    const { generateRecipeIdeas } = await import('@/lib/gemini')
    const result = await generateRecipeIdeas(cleanMode, context)

    return ok(result.ideas || [])
  } catch {
    return fail('Could not generate recipe ideas. Please try again.')
  }
}

export async function generateRecipeImageAction(recipeName, description) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const cleanName = sanitizeString(recipeName, 200)
    if (!cleanName) return fail('Recipe name is required to generate a photo.')

    const cleanDesc = description ? sanitizeString(description, 500) : ''

    const { generateRecipeImage } = await import('@/lib/gemini')
    const { imageBytes, mimeType } = await generateRecipeImage(cleanName, cleanDesc)

    // Upload to Supabase Storage
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const ext = extMap[mimeType] ?? 'png'
    const storagePath = `${user.id}/${Date.now()}-ai.${ext}`

    const imgBuf = Buffer.from(imageBytes, 'base64')
    const { error: uploadError } = await supabase.storage
      .from(RECIPE_IMAGE_BUCKET)
      .upload(storagePath, imgBuf, { contentType: mimeType, upsert: false })

    if (uploadError) {
      console.error('[generateRecipeImage] Upload failed:', uploadError.message)
      return fail('Generated photo but could not save it. Check that the recipe-images storage bucket exists.')
    }

    const { data: { publicUrl } } = supabase.storage
      .from(RECIPE_IMAGE_BUCKET)
      .getPublicUrl(storagePath)

    return ok({ image_url: publicUrl })
  } catch (err) {
    console.error('[generateRecipeImage] error:', err?.message || err)
    return fail('Could not generate photo. Please try again.')
  }
}

const MOCK_WEB_SEARCH_RESULTS = [
  {
    name: 'Classic Chicken Parmesan',
    description: 'Crispy breaded chicken cutlets topped with marinara and melted mozzarella. A beloved Italian-American comfort food classic perfect for weeknight dinners.',
    rating: 4.8,
    review_count: 3241,
    cook_time_minutes: 30,
    prep_time_minutes: 20,
    servings: 4,
    source_url: 'https://example.com/chicken-parmesan',
    image_url: null,
    ingredients: [
      { name: 'boneless chicken breasts', quantity: '4 (about 2 lbs)' },
      { name: 'marinara sauce', quantity: '1½ cups' },
      { name: 'shredded mozzarella', quantity: '1 cup' },
      { name: 'Italian breadcrumbs', quantity: '1 cup' },
      { name: 'eggs', quantity: '2, beaten' },
      { name: 'grated parmesan', quantity: '¼ cup' },
      { name: 'olive oil', quantity: '3 tbsp' },
      { name: 'garlic powder', quantity: '½ tsp' },
    ],
    instructions: '1. Preheat oven to 400°F. Pound chicken to even ½-inch thickness.\n2. Season with salt, pepper, and garlic powder.\n3. Dip each breast in beaten egg, then coat with breadcrumbs mixed with parmesan.\n4. Heat olive oil in oven-safe skillet over medium-high heat. Pan-fry chicken 3–4 min per side until golden.\n5. Spoon marinara over each breast and top with mozzarella.\n6. Bake 15–20 min until chicken is cooked through and cheese is bubbly.\n7. Serve immediately, garnished with fresh basil if desired.',
  },
  {
    name: 'Easy One-Pot Pasta Primavera',
    description: 'Creamy pasta loaded with fresh vegetables, all cooked together in a single pot for maximum flavor with minimal cleanup.',
    rating: 4.6,
    review_count: 1872,
    cook_time_minutes: 20,
    prep_time_minutes: 10,
    servings: 4,
    source_url: 'https://example.com/one-pot-pasta',
    image_url: null,
    ingredients: [
      { name: 'penne pasta', quantity: '12 oz' },
      { name: 'cherry tomatoes', quantity: '1 cup, halved' },
      { name: 'zucchini', quantity: '1, diced' },
      { name: 'garlic cloves', quantity: '4, minced' },
      { name: 'chicken or vegetable broth', quantity: '3 cups' },
      { name: 'heavy cream', quantity: '½ cup' },
      { name: 'parmesan cheese', quantity: '½ cup, for serving' },
      { name: 'fresh basil', quantity: '¼ cup' },
    ],
    instructions: '1. Combine pasta, broth, tomatoes, zucchini, and garlic in a large pot.\n2. Bring to a boil over high heat, then reduce to a strong simmer.\n3. Cook 12–15 min, stirring frequently, until pasta is tender and liquid is mostly absorbed.\n4. Stir in cream and cook 2 more min until sauce coats the pasta.\n5. Season with salt and pepper. Stir in basil.\n6. Serve immediately topped with parmesan.',
  },
]

export async function searchWebRecipesAction(query) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const cleanQuery = sanitizeString(query, 200)
    if (!cleanQuery) return fail('Search query is required.')

    if (isMockMode()) {
      return ok(MOCK_WEB_SEARCH_RESULTS)
    }

    const { searchWebRecipes } = await import('@/lib/gemini')
    const results = await searchWebRecipes(cleanQuery)

    if (!results || results.length === 0) {
      return fail('No qualifying recipes found. Try a different search.')
    }

    return ok(results)
  } catch (err) {
    console.error('[searchWebRecipesAction] error:', err?.message || err)
    return fail('Could not search for recipes. Please try again.')
  }
}

export async function fetchNutritionAction(recipeId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId) return fail('Recipe ID is required')

    const recipe = await getRecipeById(user.id, recipeId)
    if (!recipe) return fail('Recipe not found')

    // Return cached nutrition if already present
    if (recipe.nutrition) return ok(recipe.nutrition)

    // In mock mode, return a simple estimate without calling Gemini
    if (isMockMode()) {
      return fail('Nutrition data not available in mock mode.')
    }

    const { estimateNutrition } = await import('@/lib/gemini')
    const nutrition = await estimateNutrition(recipe.ingredients, recipe.servings || 4)

    await updateRecipe(user.id, recipeId, { nutrition, nutrition_is_estimated: true })
    revalidatePath(`/recipes/${recipeId}`)

    return ok(nutrition)
  } catch {
    return fail('Could not estimate nutrition.')
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

// ── Collection Actions ──────────────────────────────────

export async function createCollectionAction({ name, description, emoji }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(name, 100)
    if (!cleanName) return fail('Collection name is required.')

    const cleanDesc = sanitizeString(description || '', 300)
    const cleanEmoji = sanitizeString(emoji || '', 10)

    const col = await createCollection(user.id, {
      name: cleanName,
      description: cleanDesc,
      emoji: cleanEmoji,
    })

    revalidatePath('/recipes')
    return ok(col)
  } catch {
    return fail('Could not create collection.')
  }
}

export async function updateCollectionAction(collectionId, { name, description, emoji }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!collectionId) return fail('Collection ID is required.')

    const updates = {}
    if (name !== undefined) {
      const cleanName = sanitizeString(name, 100)
      if (!cleanName) return fail('Collection name is required.')
      updates.name = cleanName
    }
    if (description !== undefined) updates.description = sanitizeString(description, 300)
    if (emoji !== undefined) updates.emoji = sanitizeString(emoji, 10)

    const col = await updateCollection(user.id, collectionId, updates)
    if (!col) return fail('Collection not found.')

    revalidatePath('/recipes')
    return ok(col)
  } catch {
    return fail('Could not update collection.')
  }
}

export async function deleteCollectionAction(collectionId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!collectionId) return fail('Collection ID is required.')

    await deleteCollection(user.id, collectionId)

    revalidatePath('/recipes')
    return ok()
  } catch {
    return fail('Could not delete collection.')
  }
}

export async function addRecipeToCollectionAction(recipeId, collectionId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId || !collectionId) return fail('Recipe ID and collection ID are required.')

    await addRecipeToCollection(user.id, recipeId, collectionId)

    revalidatePath('/recipes')
    return ok()
  } catch {
    return fail('Could not add recipe to collection.')
  }
}

export async function removeRecipeFromCollectionAction(recipeId, collectionId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId || !collectionId) return fail('Recipe ID and collection ID are required.')

    await removeRecipeFromCollection(user.id, recipeId, collectionId)

    revalidatePath('/recipes')
    return ok()
  } catch {
    return fail('Could not remove recipe from collection.')
  }
}
