'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeInteger } from '@/lib/sanitize'
import { apiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { getMockPantry, getMockDinnerIdeas, getMockLastScan } from '@/lib/dal/mock-store'

export async function startScan(images) {
  try {
    const user = await requireUser()
    const rate = uploadLimiter.check(user.id)
    if (!rate.success) return fail('Too many scans. Please wait a moment.')

    // Normalize: accept a single object or an array
    const imageList = Array.isArray(images) ? images : (images ? [images] : [])

    if (isMockMode()) {
      if (!imageList.length) {
        const pantryItems = await getMockPantry()
        const dinnerIdeas = await getMockDinnerIdeas()
        const lastScan = await getMockLastScan()
        return ok({ pantryItems, dinnerIdeas, lastScan })
      }

      if (!process.env.GOOGLE_AI_API_KEY) {
        const pantryItems = await getMockPantry()
        const dinnerIdeas = await getMockDinnerIdeas()
        const lastScan = await getMockLastScan()
        return ok({ pantryItems, dinnerIdeas, lastScan })
      }
    }

    if (!imageList.length || !imageList[0]?.base64) {
      return fail('No images provided. Please take or upload a photo.')
    }

    const { scanPantryFromImage, generateDinnerIdeas } = await import('@/lib/gemini')

    // Step 1: Analyze the images to detect pantry items
    const detectedItems = await scanPantryFromImage(
      imageList.map(img => ({ base64: img.base64, mimeType: img.mimeType }))
    )

    // Add IDs to items for the UI
    const pantryItems = detectedItems.map((item, i) => ({
      id: i + 1,
      ...item,
    }))

    // Step 2: Save scan results to database (non-mock mode)
    if (!isMockMode()) {
      const { saveScanResults } = await import('@/lib/dal/pantry')
      await saveScanResults(user.id, pantryItems)
    }

    // Step 3: Generate dinner ideas based on detected items
    let dinnerIdeas = []
    if (pantryItems.length > 0) {
      dinnerIdeas = await generateDinnerIdeas(pantryItems)
    }

    const now = new Date()
    const lastScan = {
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      itemsDetected: pantryItems.length,
      scannedAt: now.toISOString(),
    }

    return ok({ pantryItems, dinnerIdeas, lastScan })
  } catch (err) {
    console.error('[startScan] error:', err?.message || err)
    return fail('Could not analyze the photo. Please try again.')
  }
}

export async function addToMealPlan(ideaId, mealSlot) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeInteger(ideaId, 1, 999999)
    if (cleanId === null) return fail('Invalid idea')

    if (isMockMode()) {
      const ideas = await getMockDinnerIdeas()
      const idea = ideas.find(i => i.id === cleanId)
      if (!idea) return fail('Dinner idea not found')
      return ok({ addedMeal: idea.name })
    }

    // In production, insert into meal_slots
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}
