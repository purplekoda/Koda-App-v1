'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { getMacroMembers, addMacroExtra, updateMacroExtra as dalUpdateExtra, getMacroExtrasForWeek, getMacroExtrasForMonth } from '@/lib/dal/macros'
import { apiLimiter, aiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { validateMacroExtra } from '@/lib/validators'

const MACRO_INSIGHT_SYSTEM =
  'You are a concise nutrition coach. Given a household member\'s macro targets, their projected daily totals for the week, and their health goals, ' +
  'return exactly two sentences: one observation about their nutrition this week and one specific actionable suggestion. ' +
  'Keep it warm, practical, and brief.'

/**
 * Generate a smart nutrition insight for a household member via Gemini.
 */
export async function generateMacroInsight(memberId) {
  const user = await requireUser()
  const rate = aiLimiter.check(user.id)
  if (!rate.success) return fail('Too many requests. Please wait a moment.')

  const members = await getMacroMembers(user.id)
  const member = members.find(m => m.id === memberId)
  if (!member) return fail('Member not found')

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    // Fallback when Gemini is not configured
    return ok({ insight: getFallbackInsight(member) })
  }

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    const prompt = [
      `Member: ${member.name} (${member.ageGroup})`,
      `Health goals: ${member.healthGoals.join(', ')}`,
      `Daily targets — Calories: ${member.targets.calories}, Protein: ${member.targets.protein}g, Carbs: ${member.targets.carbs}g, Fat: ${member.targets.fat}g`,
      `This week's daily actuals:`,
      ...member.weeklyActuals.map(d =>
        `  ${d.day}: ${d.calories} cal, ${d.protein}g protein, ${d.carbs}g carbs, ${d.fat}g fat`
      ),
    ].join('\n')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { systemInstruction: MACRO_INSIGHT_SYSTEM },
    })

    return ok({ insight: response.text })
  } catch (err) {
    console.error('[macros] Gemini insight error:', err?.message)
    return ok({ insight: getFallbackInsight(member) })
  }
}

function getFallbackInsight(member) {
  const avgProtein = member.weeklyActuals.reduce((sum, d) => sum + d.protein, 0) / member.weeklyActuals.length
  const proteinPct = Math.round((avgProtein / member.targets.protein) * 100)

  if (proteinPct >= 95) {
    return `${member.name} is hitting protein targets consistently this week. Keep up the balanced approach with high-protein meals at lunch and dinner.`
  } else if (proteinPct >= 80) {
    return `${member.name}'s protein is averaging ${proteinPct}% of target this week. Try adding a Greek yogurt snack or extra eggs at breakfast to close the gap.`
  }
  return `${member.name}'s protein intake is below target at ${proteinPct}%. Consider swapping one carb-heavy meal for a protein-rich option like grilled chicken or lentil soup.`
}

// ── Photo-Based Macro Logging ─────────────────────────

/**
 * Analyze a food photo using Gemini to extract/estimate nutrition.
 */
export async function analyzeFoodPhoto(image) {
  try {
    const user = await requireUser()
    const rate = uploadLimiter.check(user.id)
    if (!rate.success) return fail('Too many uploads. Please wait a moment.')

    if (!image?.base64 || !image?.mimeType) {
      return fail('No image provided. Please take or upload a photo.')
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      // Return mock analysis when Gemini is not configured
      return ok({
        food_name: 'Sample Food Item',
        label_found: false,
        serving_size: '1 serving',
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 8,
        confidence: 'medium',
        notes: 'Mock analysis — Gemini API key not configured.',
      })
    }

    const { analyzeFood } = await import('@/lib/gemini')
    const result = await analyzeFood(image)
    return ok(result)
  } catch (err) {
    console.error('[analyzeFoodPhoto] error:', err?.message || err)
    return fail('Could not analyze the photo. Please try again.')
  }
}

/**
 * Log a macro extra entry for a household member.
 */
export async function logMacroExtra(data) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateMacroExtra(data)
    if (!validation.valid) return fail(validation.errors[0])

    const entry = await addMacroExtra(user.id, validation.data)
    return ok(entry)
  } catch (err) {
    console.error('[logMacroExtra] error:', err?.message || err)
    return fail('Could not save the entry. Please try again.')
  }
}

/**
 * Update an existing macro extra (only within the editable weekly window).
 */
export async function updateMacroExtraAction(extraId, updates) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!extraId) return fail('Invalid entry')

    // Validate the numeric fields if present
    const cleanUpdates = {}
    if (updates.food_name !== undefined) {
      const { sanitizeString } = await import('@/lib/sanitize')
      cleanUpdates.food_name = sanitizeString(updates.food_name, 200)
      if (!cleanUpdates.food_name) return fail('Food name is required')
    }
    for (const key of ['calories', 'protein', 'carbs', 'fat']) {
      if (updates[key] !== undefined) {
        const val = key === 'calories' ? parseInt(updates[key], 10) : parseFloat(updates[key])
        if (isNaN(val) || val < 0) return fail(`Invalid ${key} value`)
        cleanUpdates[key] = key === 'calories' ? val : Math.round(val * 10) / 10
      }
    }

    const result = await dalUpdateExtra(user.id, extraId, cleanUpdates)
    if (!result) return fail('Entry not found or is locked.')
    return ok(result)
  } catch (err) {
    console.error('[updateMacroExtra] error:', err?.message || err)
    return fail('Could not update the entry. Please try again.')
  }
}

/**
 * Fetch macro extras for the weekly history view.
 */
export async function fetchWeeklyExtras(memberId, weekStart) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')
    const extras = await getMacroExtrasForWeek(user.id, memberId, weekStart)
    return ok(extras)
  } catch (err) {
    console.error('[fetchWeeklyExtras] error:', err?.message || err)
    return fail('Could not load history.')
  }
}

/**
 * Fetch macro extras for the monthly history view.
 */
export async function fetchMonthlyExtras(memberId, year, month) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')
    const extras = await getMacroExtrasForMonth(user.id, memberId, year, month)
    return ok(extras)
  } catch (err) {
    console.error('[fetchMonthlyExtras] error:', err?.message || err)
    return fail('Could not load history.')
  }
}

/**
 * Save macro targets for a household member.
 */
export async function saveMacroTargetsAction(data) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!data.member_id) return fail('Member ID required.')

    const targets = {
      member_id: data.member_id,
      track_macros: Boolean(data.track_macros),
      daily_calorie_target: Math.max(0, parseInt(data.daily_calorie_target || 0, 10)),
      daily_protein_target: Math.max(0, parseInt(data.daily_protein_target || 0, 10)),
      daily_carb_target: Math.max(0, parseInt(data.daily_carb_target || 0, 10)),
      daily_fat_target: Math.max(0, parseInt(data.daily_fat_target || 0, 10)),
      macro_meal_distribution: data.macro_meal_distribution || { breakfast: 25, lunch: 35, dinner: 40 },
    }

    const { saveMacroTargets } = await import('@/lib/dal/macros')
    await saveMacroTargets(user.id, targets)
    return ok(targets)
  } catch (err) {
    console.error('[saveMacroTargets] error:', err?.message || err)
    return fail('Could not save macro targets.')
  }
}

/**
 * Use Gemini to calculate suggested macro targets based on user goals.
 * Accepts: { goal, activity, weight_optional }
 */
export async function calculateMacroTargetsAction({ goal, activity, weight_optional }) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      // Sensible defaults when no API key
      const defaults = {
        'lose weight': { calories: 1600, protein: 130, carbs: 160, fat: 55 },
        'maintain': { calories: 2000, protein: 150, carbs: 220, fat: 65 },
        'build muscle': { calories: 2400, protein: 190, carbs: 260, fat: 75 },
        'improve energy': { calories: 1900, protein: 140, carbs: 210, fat: 65 },
      }
      const targets = defaults[goal] || defaults['maintain']
      return ok({ ...targets, reasoning: 'Suggested targets based on your goal. You can adjust these anytime.' })
    }

    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    const prompt = [
      `Calculate daily macro targets for someone with these preferences:`,
      `- Main goal: ${goal}`,
      `- Activity level: ${activity}`,
      weight_optional ? `- Weight: ${weight_optional}` : `- Weight: not provided`,
      ``,
      `Return ONLY a JSON object with: calories (integer), protein (integer in grams), carbs (integer in grams), fat (integer in grams), reasoning (1 sentence explaining the recommendations).`,
      `Be practical and evidence-based. Protein should be adequate for goals (at least 0.8g/lb body weight for muscle building if weight given).`,
    ].join('\n')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })

    const parsed = JSON.parse(response.text)
    return ok({
      calories: Math.round(parsed.calories || 2000),
      protein: Math.round(parsed.protein || 150),
      carbs: Math.round(parsed.carbs || 200),
      fat: Math.round(parsed.fat || 65),
      reasoning: parsed.reasoning || 'Targets calculated based on your goals.',
    })
  } catch (err) {
    console.error('[calculateMacroTargets] error:', err?.message || err)
    return fail('Could not calculate targets. Please enter them manually.')
  }
}

/**
 * Estimate macros for a food name/description using Gemini.
 * Returns { calories, protein, carbs, fat, serving_description, confidence, notes }
 */
export async function estimateFoodMacros({ food_name, serving }) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const query = [food_name, serving].filter(Boolean).join(', ')
    if (!query.trim()) return fail('Enter a food name first.')

    if (!process.env.GOOGLE_AI_API_KEY) {
      return ok({
        calories: 200, protein: 10, carbs: 25, fat: 8,
        serving_description: serving || '1 serving',
        confidence: 'low',
        notes: 'Gemini not configured — placeholder values.',
      })
    }

    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

    const prompt = `Estimate the nutritional content of: "${query}".
Return ONLY a JSON object with these fields:
- calories: integer
- protein: number (grams, one decimal)
- carbs: number (grams, one decimal)
- fat: number (grams, one decimal)
- serving_description: string describing the portion assumed
- confidence: "high", "medium", or "low"
- notes: one short sentence explaining your estimate

Base estimates on typical preparation and standard portion sizes. Never return null for macro values.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })

    const parsed = JSON.parse(response.text)
    return ok({
      calories: Math.round(parsed.calories || 0),
      protein: Math.round((parsed.protein || 0) * 10) / 10,
      carbs: Math.round((parsed.carbs || 0) * 10) / 10,
      fat: Math.round((parsed.fat || 0) * 10) / 10,
      serving_description: parsed.serving_description || serving || '1 serving',
      confidence: parsed.confidence || 'medium',
      notes: parsed.notes || '',
    })
  } catch (err) {
    console.error('[estimateFoodMacros] error:', err?.message || err)
    return fail('Could not estimate macros. Try entering them manually.')
  }
}
