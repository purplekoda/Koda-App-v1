/**
 * Lightweight intent classifier for chat messages.
 * Runs server-side before calling Gemini to determine if a message
 * is a meal plan editing request or a general conversation.
 */

const DAY_MAP = {
  monday: 'Mon', mon: 'Mon',
  tuesday: 'Tue', tue: 'Tue', tues: 'Tue',
  wednesday: 'Wed', wed: 'Wed',
  thursday: 'Thu', thu: 'Thu', thurs: 'Thu',
  friday: 'Fri', fri: 'Fri',
  saturday: 'Sat', sat: 'Sat',
  sunday: 'Sun', sun: 'Sun',
}

const MEAL_TYPE_MAP = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  supper: 'dinner',
}

const ITEM_TYPE_PATTERNS = [
  { pattern: /\b(side\s*dish|side|sides|vegetable\s*side)\b/i, type: 'side_dish' },
  { pattern: /\b(bread|roll|rolls|baguette|focaccia|naan|garlic\s*bread)\b/i, type: 'bread' },
  { pattern: /\b(dessert|sweet|cake|pie|cookie|cookies|ice\s*cream|pudding)\b/i, type: 'dessert' },
  { pattern: /\b(drink|beverage|smoothie|juice|lemonade|cocktail|mocktail)\b/i, type: 'drink' },
  { pattern: /\b(appetizer|starter|app)\b/i, type: 'appetizer' },
]

const ADD_PATTERNS = [
  /\badd\s+(a\s+)?/i,
  /\bsuggest\s+(a\s+)?/i,
  /\bwhat\s+(would|could|should|might)\s+(go|pair|work)\s+with\b/i,
  /\bwhat\s+(goes|pairs)\s+with\b/i,
  /\bcan\s+you\s+add\b/i,
  /\bi\s+want\s+(a\s+|something\s+)/i,
  /\bpair\s+something\s+with\b/i,
  /\b(recommend|pick)\s+(a\s+)?/i,
]

const REMOVE_PATTERNS = [
  /\bremove\s+(the\s+)?/i,
  /\btake\s+(off|out|away)\b/i,
  /\bdelete\s+(the\s+)?/i,
  /\bi\s+don'?t\s+want\s+(that|the|this)\b/i,
  /\bget\s+rid\s+of\b/i,
]

const SWAP_PATTERNS = [
  /\bswap\s+(the\s+)?/i,
  /\bchange\s+(the\s+)?/i,
  /\breplace\s+(the\s+)?/i,
  /\bdifferent\s+/i,
  /\bsomething\s+else\s+(for|instead)\b/i,
]

const PLAN_WEEK_PATTERNS = [
  /\bplan\s+(my\s+)?week\b/i,
  /\bfill\s+(my\s+)?week\b/i,
  /\bplan\s+(this|the)\s+week\b/i,
  /\bfill\s+(all|the|my)\s+(empty\s+)?slots?\b/i,
  /\bplan\s+meals?\s+(for\s+)?(the\s+)?week\b/i,
]

const SURPRISE_ME_PATTERNS = [
  /\bsurprise\s+me\b/i,
  /\bsomething\s+(fun|new|exciting|different|random)\b/i,
  /\bfeel(ing)?\s+adventurous\b/i,
  /\bwhat'?s?\s+trending\b/i,
  /\bviral\s+recipe\b/i,
]

/**
 * Resolve "tonight", "today", "tomorrow" to a day abbreviation.
 */
function resolveRelativeDay(text) {
  const lower = text.toLowerCase()
  const now = new Date()
  const todayDow = now.getDay() || 7 // Sun=0→7

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (/\btonight\b|\btoday\b|\bthis\s+evening\b/.test(lower)) {
    return dayNames[todayDow]
  }
  if (/\btomorrow\b/.test(lower)) {
    const tomorrowDow = todayDow === 7 ? 1 : todayDow + 1
    return dayNames[tomorrowDow]
  }
  return null
}

/**
 * Extract a day reference from the message text.
 * Returns a day abbreviation (Mon, Tue, etc.) or null.
 */
function extractDay(text) {
  const relative = resolveRelativeDay(text)
  if (relative) return relative

  const lower = text.toLowerCase()
  for (const [keyword, day] of Object.entries(DAY_MAP)) {
    // Match as a word boundary to avoid "friday" matching inside another word
    const regex = new RegExp(`\\b${keyword}(?:'s)?\\b`, 'i')
    if (regex.test(lower)) return day
  }
  return null
}

/**
 * Extract a meal type from the message text.
 */
function extractMealType(text) {
  const lower = text.toLowerCase()

  // "tonight" defaults to dinner
  if (/\btonight\b|\bthis\s+evening\b/.test(lower)) return 'dinner'

  for (const [keyword, type] of Object.entries(MEAL_TYPE_MAP)) {
    const regex = new RegExp(`\\b${keyword}(?:'s)?\\b`, 'i')
    if (regex.test(lower)) return type
  }

  // Check for "after lunch" → dessert context for lunch, "after dinner" → dessert for dinner
  const afterMatch = lower.match(/\bafter\s+(breakfast|lunch|dinner|supper)\b/)
  if (afterMatch) {
    return MEAL_TYPE_MAP[afterMatch[1]] || null
  }

  return null
}

/**
 * Extract what type of accompaniment is being requested.
 */
function extractItemType(text) {
  for (const { pattern, type } of ITEM_TYPE_PATTERNS) {
    if (pattern.test(text)) return type
  }

  // "something sweet after" → dessert
  if (/\bsomething\s+sweet\b/i.test(text)) return 'dessert'
  // "something to drink" → drink
  if (/\bsomething\s+to\s+drink\b/i.test(text)) return 'drink'

  return null
}

/**
 * Classify a chat message into an intent.
 *
 * @param {string} text - The user's message
 * @returns {{ intent: string, day: string|null, mealType: string|null, itemType: string|null }}
 */
export function classifyChatIntent(text) {
  if (!text || typeof text !== 'string') {
    return { intent: 'general', day: null, mealType: null, itemType: null }
  }

  const day = extractDay(text)
  const mealType = extractMealType(text)
  const itemType = extractItemType(text)

  // Check for plan week intent (before add/swap so "plan my week" isn't misclassified)
  const isPlanWeek = PLAN_WEEK_PATTERNS.some(p => p.test(text))
  if (isPlanWeek) {
    return { intent: 'plan_week', day: null, mealType: null, itemType: null }
  }

  // Check for surprise me intent
  const isSurprise = SURPRISE_ME_PATTERNS.some(p => p.test(text))
  if (isSurprise) {
    return { intent: 'surprise_me', day, mealType, itemType: null }
  }

  // Check for add intent
  const isAdd = ADD_PATTERNS.some(p => p.test(text))
  if (isAdd && (itemType || mealType || day)) {
    return { intent: 'add_accompaniment', day, mealType, itemType }
  }

  // "what goes with X" / "what pairs with X" patterns
  if (/\bwhat\s+(goes|pairs|would\s+go)\s+with\b/i.test(text)) {
    return { intent: 'add_accompaniment', day, mealType, itemType }
  }

  // Check for remove intent
  const isRemove = REMOVE_PATTERNS.some(p => p.test(text))
  if (isRemove && (itemType || mealType)) {
    return { intent: 'remove_item', day, mealType, itemType }
  }

  // Check for swap intent
  const isSwap = SWAP_PATTERNS.some(p => p.test(text))
  if (isSwap && (mealType || day)) {
    return { intent: 'swap_item', day, mealType, itemType }
  }

  return { intent: 'general', day: null, mealType: null, itemType: null }
}
