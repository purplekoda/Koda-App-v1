import 'server-only'

/**
 * In-memory store for mock-mode mutations.
 * Data persists within a server session (resets on restart).
 * This file is server-only and never shipped to the client.
 */

const store = new Map()

async function ensureInitialized(key, loader) {
  if (!store.has(key)) {
    const data = await loader()
    // Deep clone to avoid mutating the original mock data module
    store.set(key, JSON.parse(JSON.stringify(data)))
  }
  return store.get(key)
}

// ── Meals ──────────────────────────────────────────────

// Returns the live store array — mutations here persist.
async function getRawMeals() {
  return ensureInitialized('meals', async () => {
    const { mockWeeklyMeals } = await import('@/data/mock-meals')
    const cloned = JSON.parse(JSON.stringify(mockWeeklyMeals))
    cloned.forEach(day => {
      day.meals.forEach(m => {
        if (m.recipeId === undefined) m.recipeId = null
        if (m.slotId === undefined) m.slotId = null
        if (m.recipe === undefined) m.recipe = null
        if (m.suggestedByKoda === undefined) m.suggestedByKoda = false
      })
    })
    return cloned
  })
}

export async function getMockMeals() {
  const data = await getRawMeals()
  // Shallow-copy the array and each day so every call returns a new reference.
  // Without this, setMeals(data) is a no-op because React sees the same object
  // identity as the previous state and skips the re-render.
  return data.map(day => ({ ...day, meals: [...day.meals] }))
}

export async function getMockTodayMeals() {
  return ensureInitialized('todayMeals', async () => {
    const { mockTodayMeals } = await import('@/data/mock-meals')
    return mockTodayMeals
  })
}

export async function getMockSwapSuggestions() {
  return ensureInitialized('swapSuggestions', async () => {
    const { mockSwapSuggestions } = await import('@/data/mock-meals')
    return mockSwapSuggestions
  })
}

export async function updateMockMeal(day, type, update) {
  const meals = await getRawMeals()
  const dayObj = meals.find(d => d.day === day)
  if (!dayObj) return null

  let mealObj = dayObj.meals.find(m => m.type === type)
  if (!mealObj) {
    // Dynamically create extra sides slots (sides2–4) when first used
    if (['sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'].includes(type)) {
      mealObj = { type, name: null, recipeId: null, slotId: null, recipe: null, ingredients: [], suggestedByKoda: false }
      dayObj.meals.push(mealObj)
    } else {
      return null
    }
  }

  Object.assign(mealObj, update)
  return mealObj
}

export async function clearMockMeal(day, type) {
  return updateMockMeal(day, type, { name: null, ingredients: [], recipeId: null, slotId: null, recipe: null })
}

export async function setMockMealRecipe(day, type, recipeId, recipeName) {
  return updateMockMeal(day, type, {
    name: recipeName,
    recipeId,
    recipe: { id: recipeId, name: recipeName },
    ingredients: [],
  })
}

export async function fillMockWeek() {
  const meals = await getRawMeals()
  const fillerMeals = {
    breakfast: ['French toast', 'Egg muffins', 'Banana bread', 'Cereal', 'Bagel & cream cheese'],
    lunch: ['Caesar salad', 'BLT sandwich', 'Quinoa bowl', 'Veggie wrap', 'Ramen'],
    dinner: ['Lasagna', 'Grilled chicken', 'Fish tacos', 'Beef stew', 'Pad thai'],
    sides: ['Roasted veggies', 'Garlic bread', 'Side salad', 'Mashed potatoes', 'Steamed broccoli'],
  }

  let filledCount = 0
  meals.forEach(day => {
    day.meals.forEach(m => {
      if (!m.name) {
        const options = fillerMeals[m.type] || fillerMeals.dinner
        m.name = options[Math.floor(Math.random() * options.length)]
        m.ingredients = []
        filledCount++
      }
    })
  })
  return { filledCount, meals }
}

// ── Grocery ────────────────────────────────────────────

export async function getMockGrocery() {
  return ensureInitialized('grocery', async () => {
    const { mockGroceryItems } = await import('@/data/mock-grocery')
    return mockGroceryItems
  })
}

export async function getMockStores() {
  return ensureInitialized('stores', async () => {
    const { mockStores } = await import('@/data/mock-grocery')
    return mockStores
  })
}

export async function getMockWeekSummary() {
  return ensureInitialized('weekSummary', async () => {
    const { mockWeekSummary } = await import('@/data/mock-grocery')
    return mockWeekSummary
  })
}

export async function toggleMockGroceryItem(itemId, newStatus) {
  const items = await getMockGrocery()
  const item = items.find(i => i.id === itemId)
  if (!item) return null
  item.status = newStatus
  return item
}

export async function addMockGroceryItems(itemsOrNames) {
  const items = await getMockGrocery()
  for (const itemOrName of itemsOrNames) {
    const isObj = typeof itemOrName === 'object' && itemOrName !== null
    items.push({
      id: `g-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: isObj ? itemOrName.name : itemOrName,
      quantity: isObj ? (itemOrName.quantity || '1') : '1',
      category: isObj ? (itemOrName.category || 'Other') : 'Other',
      store_assignment: isObj ? (itemOrName.store_assignment || null) : null,
      status: 'need',
      checked: false,
      source: 'chat',
    })
  }
}

export async function assignMockGroceryItemStore(itemId, storeId) {
  const items = await getMockGrocery()
  const item = items.find(i => String(i.id) === String(itemId))
  if (!item) return null
  item.store_assignment = storeId
  return item
}

// ── Pantry ─────────────────────────────────────────────

export async function getMockPantry() {
  return ensureInitialized('pantry', async () => {
    const { mockPantryItems } = await import('@/data/mock-pantry')
    return mockPantryItems
  })
}

export async function getMockDinnerIdeas() {
  return ensureInitialized('dinnerIdeas', async () => {
    const { mockDinnerIdeas } = await import('@/data/mock-pantry')
    return mockDinnerIdeas
  })
}

export async function getMockLastScan() {
  return ensureInitialized('lastScan', async () => {
    const { mockLastScan } = await import('@/data/mock-pantry')
    return mockLastScan
  })
}

// ── Managed Pantry (pantry table) ─────────────────────

const MOCK_MANAGED_PANTRY_SEED = [
  {
    id: 'mp-1',
    ingredient_name: 'Chicken Breast',
    quantity: 1.5,
    unit: 'lbs',
    purchase_date: '2026-04-26',
    expiry_date: '2026-04-30',
    category: 'Meat',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-04-26T10:00:00.000Z',
  },
  {
    id: 'mp-2',
    ingredient_name: 'Baby Spinach',
    quantity: 5,
    unit: 'oz',
    purchase_date: '2026-04-25',
    expiry_date: '2026-05-01',
    category: 'Produce',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-04-25T10:00:00.000Z',
  },
  {
    id: 'mp-3',
    ingredient_name: 'Eggs',
    quantity: 8,
    unit: 'whole',
    purchase_date: '2026-04-22',
    expiry_date: '2026-05-06',
    category: 'Dairy',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-04-22T10:00:00.000Z',
  },
  {
    id: 'mp-4',
    ingredient_name: 'Cheddar Cheese',
    quantity: 0.5,
    unit: 'lbs',
    purchase_date: '2026-04-20',
    expiry_date: '2026-05-10',
    category: 'Dairy',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-04-20T10:00:00.000Z',
  },
  {
    id: 'mp-5',
    ingredient_name: 'Pasta',
    quantity: 1,
    unit: 'lbs',
    purchase_date: '2026-03-01',
    expiry_date: null,
    category: 'Pantry',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'mp-6',
    ingredient_name: 'Canned Tomatoes',
    quantity: 2,
    unit: 'cans',
    purchase_date: '2026-03-15',
    expiry_date: null,
    category: 'Pantry',
    is_depleted: false,
    source: 'manual',
    created_at: '2026-03-15T10:00:00.000Z',
  },
]

export async function getMockManagedPantry() {
  return ensureInitialized('managedPantry', async () =>
    JSON.parse(JSON.stringify(MOCK_MANAGED_PANTRY_SEED))
  )
}

export async function addMockPantryItem(item) {
  const items = await getMockManagedPantry()
  const newItem = {
    id: `mp-${Date.now()}`,
    ...item,
    is_depleted: false,
  }
  items.push(newItem)
  return newItem
}

export async function updateMockPantryItem(itemId, updates) {
  const items = await getMockManagedPantry()
  const item = items.find(i => i.id === itemId)
  if (!item) return null
  Object.assign(item, updates)
  return item
}

export async function deleteMockPantryItem(itemId) {
  const items = await getMockManagedPantry()
  const idx = items.findIndex(i => i.id === itemId)
  if (idx !== -1) items.splice(idx, 1)
}

export async function saveCommittedScanItemsToMock(scanItems, manualItems, deleteExistingManual) {
  const items = await getMockManagedPantry()
  const now = new Date().toISOString()

  // Remove old scan-sourced items
  const kept = items.filter(i => i.source !== 'scan' && (deleteExistingManual ? i.source !== 'manual' : true))
  items.length = 0
  items.push(...kept)

  // Add curated AI-detected items
  scanItems.forEach((item, idx) => {
    let expiryDate = null
    if (item.daysLeft != null && item.daysLeft >= 0) {
      const d = new Date()
      d.setDate(d.getDate() + item.daysLeft)
      expiryDate = d.toISOString().slice(0, 10)
    }
    items.push({
      id: `scan-${Date.now()}-${idx}`,
      ingredient_name: item.name,
      quantity: null,
      unit: null,
      purchase_date: null,
      expiry_date: expiryDate,
      category: item.category || 'Other',
      is_depleted: false,
      source: 'scan',
      created_at: now,
    })
  })

  // Add new manually-added items from review
  manualItems.forEach((item, idx) => {
    items.push({
      id: `madd-${Date.now()}-${idx}`,
      ingredient_name: item.name,
      quantity: null,
      unit: null,
      purchase_date: null,
      expiry_date: null,
      category: item.category || 'Other',
      is_depleted: false,
      source: 'manual',
      created_at: now,
    })
  })
}

export async function saveScannedItemsToMockManagedPantry(scannedItems, scannedAt) {
  const items = await getMockManagedPantry()
  // Remove all previous scan-sourced items
  const manualItems = items.filter(i => i.source !== 'scan')
  items.length = 0
  items.push(...manualItems)

  const scanDate = scannedAt ? new Date(scannedAt) : new Date()
  scannedItems.forEach((item, i) => {
    let expiryDate = null
    if (item.daysLeft != null && item.daysLeft >= 0) {
      const d = new Date(scanDate)
      d.setDate(d.getDate() + item.daysLeft)
      expiryDate = d.toISOString().slice(0, 10)
    }
    items.push({
      id: `scan-${Date.now()}-${i}`,
      ingredient_name: item.name,
      quantity: null,
      unit: null,
      purchase_date: null,
      expiry_date: expiryDate,
      category: item.category || 'Other',
      is_depleted: false,
      source: 'scan',
      created_at: scanDate.toISOString(),
    })
  })
}

// ── Recipes ────────────────────────────────────────────

export async function getMockRecipes() {
  return ensureInitialized('recipes', async () => {
    const { mockRecipes } = await import('@/data/mock-recipes')
    return mockRecipes
  })
}

export async function getMockRecipeById(id) {
  const recipes = await getMockRecipes()
  return recipes.find(r => String(r.id) === String(id)) || null
}

export async function createMockRecipe(recipe) {
  const recipes = await getMockRecipes()
  const nextId = recipes.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1
  const now = new Date().toISOString()
  const newRecipe = {
    id: nextId,
    ...recipe,
    created_at: now,
    updated_at: now,
  }
  recipes.push(newRecipe)
  return newRecipe
}

export async function updateMockRecipe(id, updates) {
  const recipes = await getMockRecipes()
  const recipe = recipes.find(r => String(r.id) === String(id))
  if (!recipe) return null
  Object.assign(recipe, updates, { updated_at: new Date().toISOString() })
  return recipe
}

export async function deleteMockRecipe(id) {
  const recipes = await getMockRecipes()
  const index = recipes.findIndex(r => String(r.id) === String(id))
  if (index === -1) return false
  recipes.splice(index, 1)
  return true
}

// ── Profile ────────────────────────────────────────────

let mockProfile = {
  display_name: 'Demo User',
  family_name: 'Demo Family',
  location: '',
  preferred_store: '',
  shopping_style: null,
  preferred_delivery_service: null,
}

export function getMockProfile() {
  return { ...mockProfile }
}

export function saveMockProfile(updates) {
  mockProfile = { ...mockProfile, ...updates }
  return getMockProfile()
}

// ── Faith-Based Practices ─────────────────────────────

let mockHouseholdFaithPractices = { follows_faith_based_diet: false }

export function getMockHouseholdFaithPractices() {
  return { ...mockHouseholdFaithPractices }
}

export function saveMockHouseholdFaithPractices(practices) {
  mockHouseholdFaithPractices = { ...practices }
}

export function getMockMemberFaithPractices(memberId) {
  const member = mockHouseholdMembers.find(m => m.id === memberId)
  return member?.individual_faith_practices || { follows_individual_faith_diet: false }
}

export function saveMockMemberFaithPractices(memberId, practices) {
  const member = mockHouseholdMembers.find(m => m.id === memberId)
  if (member) {
    member.individual_faith_practices = { ...practices }
  }
}

// ── Cooking Preferences ───────────────────────────────

let mockCookingPreferences = null

export function getMockCookingPreferences() {
  return mockCookingPreferences
}

export function saveMockCookingPreferences(prefs) {
  mockCookingPreferences = prefs
}

let mockDietaryRestrictions = ['nut-free']

export function getMockDietaryRestrictions() {
  return [...mockDietaryRestrictions]
}

export function saveMockDietaryRestrictions(restrictions) {
  mockDietaryRestrictions = [...restrictions]
  return getMockDietaryRestrictions()
}

// ── Taste Profile ─────────────────────────────────────

let mockTasteProfile = null

export function getMockTasteProfile() {
  return mockTasteProfile ? { ...mockTasteProfile } : null
}

export function saveMockTasteProfile(updates) {
  mockTasteProfile = mockTasteProfile
    ? { ...mockTasteProfile, ...updates }
    : {
        cuisine_types: [],
        cooking_styles: [],
        protein_preferences: [],
        flavor_profiles: [],
        avoided_ingredients: [],
        favorite_recipes: [],
        source_websites: [],
        recipe_count: 0,
        rejected_meals: [],
        disliked_ingredients: [],
        ...updates,
      }
  return getMockTasteProfile()
}

// ── Recipe Card Settings ──────────────────────────────

let mockRecipeCardSettings = null

export function getMockRecipeCardSettings() {
  return mockRecipeCardSettings ? { ...mockRecipeCardSettings } : null
}

export function saveMockRecipeCardSettings(settings) {
  mockRecipeCardSettings = { ...settings }
  return getMockRecipeCardSettings()
}

// ── Grocery Preferences ────────────────────────────────

// grocery_preferences shape:
// {
//   store_list: [{ value, label, is_default, categories: string[] }],
//   split_by_store: bool, allow_override: bool, smart_suggestions: bool,
//   fulfillment: string, delivery_address: string,
//   // legacy flat fields (kept for GroceryDeliveryHeader backward compat)
//   stores: string[], other_store_name: string,
// }
let mockGroceryPreferences = {
  store_list: [],
  split_by_store: true,
  allow_override: true,
  smart_suggestions: false,
  fulfillment: '',
  delivery_address: '',
  stores: [],
  other_store_name: '',
}

export function getMockGroceryPreferences() {
  return { ...mockGroceryPreferences }
}

export function saveMockGroceryPreferences(prefs) {
  mockGroceryPreferences = { ...mockGroceryPreferences, ...prefs }
  return getMockGroceryPreferences()
}

// ── Onboarding Profile ────────────────────────────────

let mockOnboardingProfile = {
  onboarding_completed: true,
  onboarding_skipped: false,
  onboarding_step: 0,
  onboarding_mode: null,
  household_size: 2,
  household_type: null,
  cook_time_preference: null,
  meal_plan_days: [],
  meal_prep_days: [],
  adventurousness: null,
  meal_prep_style: null,
  cooking_frustrations: [],
  health_goals: [],
  track_macros: false,
  budget_priorities: [],
  shopping_style: null,
  preferred_delivery_service: null,
  preferred_stores: [],
  store_category_assignments: {},
  location_state: null,
  onboarding_partial_data: null,
}

export function getMockOnboardingProfile() {
  return { ...mockOnboardingProfile }
}

export function saveMockOnboardingProfile(updates) {
  mockOnboardingProfile = { ...mockOnboardingProfile, ...updates }
  return getMockOnboardingProfile()
}

// ── Household Members ─────────────────────────────────

let mockHouseholdMembers = []

export function getMockHouseholdMembers() {
  return mockHouseholdMembers.map(m => ({ ...m }))
}

export function saveMockHouseholdMembers(members) {
  mockHouseholdMembers = members.map((m, i) => ({
    id: m.id || `hm-${Date.now()}-${i}`,
    name: m.name,
    age: m.age ?? null,
    is_picky_eater: m.is_picky_eater ?? false,
    picky_issues: m.picky_issues || [],
    allergies: m.allergies || [],
    dietary_restrictions: m.dietary_restrictions || [],
    individual_faith_practices: m.individual_faith_practices || null,
    track_macros: m.track_macros ?? false,
    macro_calories: m.macro_calories ?? null,
    macro_protein_g: m.macro_protein_g ?? null,
    macro_carbs_g: m.macro_carbs_g ?? null,
    macro_fat_g: m.macro_fat_g ?? null,
    created_at: m.created_at || new Date().toISOString(),
  }))
  return getMockHouseholdMembers()
}

// ── Invites ───────────────────────────────────────────

let mockInvites = []

export function getMockInvites() {
  return mockInvites.map(i => ({ ...i }))
}

export function addMockInvite(invite) {
  const newInvite = {
    id: `inv-${Date.now()}`,
    ...invite,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  mockInvites.push(newInvite)
  return { ...newInvite }
}

// ── Events / Todos ─────────────────────────────────────

export async function getMockEvents() {
  return ensureInitialized('events', async () => {
    const { mockUpcomingEvents } = await import('@/data/mock-events')
    return mockUpcomingEvents
  })
}

export async function getMockSchedule() {
  return ensureInitialized('schedule', async () => {
    const { mockTodaySchedule } = await import('@/data/mock-events')
    return mockTodaySchedule
  })
}

export async function getMockTodos() {
  return ensureInitialized('todos', async () => {
    const { mockTodos } = await import('@/data/mock-events')
    return mockTodos
  })
}

export async function toggleMockTodo(todoId) {
  const todos = await getMockTodos()
  const todo = todos.find(t => t.id === todoId)
  if (!todo) return null
  todo.done = !todo.done
  return todo
}

// ── Dashboard Sections ───────────────────────────────

let mockDashboardSections = null

export function getMockDashboardSections() {
  return mockDashboardSections ? mockDashboardSections.map(s => ({ ...s })) : null
}

export function saveMockDashboardSections(sections) {
  mockDashboardSections = sections.map(s => ({ ...s }))
  return getMockDashboardSections()
}

// ── Voice Settings ───────────────────────────────────

let mockVoiceSettings = { voice_responses_enabled: false, hands_free_chat_enabled: false }

export function getMockVoiceSettings() {
  return { ...mockVoiceSettings }
}

export function saveMockVoiceSettings(settings) {
  mockVoiceSettings = { ...mockVoiceSettings, ...settings }
  return getMockVoiceSettings()
}

// ── Chat Button Position ──────────────────────────────

let mockChatButtonPosition = { corner: 'bottom-right', offset: 0 }

export function getMockChatButtonPosition() {
  return { ...mockChatButtonPosition }
}

export function saveMockChatButtonPosition(position) {
  mockChatButtonPosition = { ...position }
  return getMockChatButtonPosition()
}

// ── Macro Extras ──────────────────────────────────────

async function getRawMacroExtras() {
  return ensureInitialized('macroExtras', async () => {
    const { mockMacroExtras } = await import('@/data/mock-macros')
    return mockMacroExtras
  })
}

export async function getMockMacroExtras() {
  const data = await getRawMacroExtras()
  return data.map(e => ({ ...e }))
}

export async function addMockMacroExtra(entry) {
  const data = await getRawMacroExtras()
  const newEntry = {
    ...entry,
    id: `extra-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  data.push(newEntry)
  return { ...newEntry }
}

export async function updateMockMacroExtra(id, updates) {
  const data = await getRawMacroExtras()
  const entry = data.find(e => e.id === id)
  if (!entry) return null
  if (entry.is_locked) return null
  Object.assign(entry, updates, { edited_by_user: true })
  return { ...entry }
}

// ── Pantry Staples ───────────────────────────────────

const MOCK_STAPLES_SEED = [
  { id: 'st-1', name: 'Flour', category: 'Baking Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-2', name: 'Sugar', category: 'Baking Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-3', name: 'Salt', category: 'Baking Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-4', name: 'Black pepper', category: 'Spices & Seasonings', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-5', name: 'Garlic powder', category: 'Spices & Seasonings', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-6', name: 'Olive oil', category: 'Oils & Condiments', is_out_of_stock: true, out_of_stock_since: '2026-05-06T10:00:00.000Z', is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-7', name: 'Soy sauce', category: 'Oils & Condiments', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-8', name: 'Pasta', category: 'Grains & Pasta', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-9', name: 'White rice', category: 'Grains & Pasta', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-10', name: 'Chicken broth', category: 'Canned & Jarred Goods', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-11', name: 'Garlic cloves', category: 'Fresh Produce Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-12', name: 'Onions', category: 'Fresh Produce Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-13', name: 'Butter', category: 'Dairy & Refrigerator Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-14', name: 'Eggs', category: 'Dairy & Refrigerator Staples', is_out_of_stock: false, out_of_stock_since: null, is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
  { id: 'st-15', name: 'Milk', category: 'Dairy & Refrigerator Staples', is_out_of_stock: true, out_of_stock_since: '2026-05-07T08:00:00.000Z', is_custom: false, created_at: '2026-03-01T10:00:00.000Z' },
]

export async function getMockStaples() {
  return ensureInitialized('staples', async () =>
    JSON.parse(JSON.stringify(MOCK_STAPLES_SEED))
  )
}

export async function addMockStaple(staple) {
  const items = await getMockStaples()
  const newItem = {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...staple,
    is_out_of_stock: false,
    out_of_stock_since: null,
    created_at: new Date().toISOString(),
  }
  items.push(newItem)
  return { ...newItem }
}

export async function deleteMockStaple(stapleId) {
  const items = await getMockStaples()
  const idx = items.findIndex(i => i.id === stapleId)
  if (idx === -1) return false
  items.splice(idx, 1)
  return true
}

export async function toggleMockStapleStock(stapleId, isOutOfStock) {
  const items = await getMockStaples()
  const item = items.find(i => i.id === stapleId)
  if (!item) return null
  item.is_out_of_stock = isOutOfStock
  item.out_of_stock_since = isOutOfStock ? new Date().toISOString() : null
  return { ...item }
}

// ── Collections ──────────────────────────────────────

export async function getMockCollections() {
  return ensureInitialized('collections', async () => {
    const { mockCollections } = await import('@/data/mock-collections')
    return mockCollections
  })
}

async function getRawRecipeCollections() {
  return ensureInitialized('recipeCollections', async () => {
    const { mockRecipeCollections } = await import('@/data/mock-collections')
    return mockRecipeCollections
  })
}

export async function getMockRecipeCollections() {
  const data = await getRawRecipeCollections()
  return data.map(rc => ({ ...rc }))
}

export async function createMockCollection(col) {
  const collections = await getMockCollections()
  const newCol = {
    id: `col-${Date.now()}`,
    ...col,
    sort_order: collections.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  collections.push(newCol)
  return { ...newCol }
}

export async function updateMockCollection(id, updates) {
  const collections = await getMockCollections()
  const col = collections.find(c => c.id === id)
  if (!col) return null
  Object.assign(col, updates, { updated_at: new Date().toISOString() })
  return { ...col }
}

export async function deleteMockCollection(id) {
  const collections = await getMockCollections()
  const idx = collections.findIndex(c => c.id === id)
  if (idx === -1) return false
  collections.splice(idx, 1)
  // Also remove junction rows
  const links = await getRawRecipeCollections()
  for (let i = links.length - 1; i >= 0; i--) {
    if (links[i].collection_id === id) links.splice(i, 1)
  }
  return true
}

export async function addRecipeToMockCollection(recipeId, collectionId) {
  const links = await getRawRecipeCollections()
  const exists = links.some(
    rc => String(rc.recipe_id) === String(recipeId) && rc.collection_id === collectionId
  )
  if (exists) return false
  links.push({ recipe_id: recipeId, collection_id: collectionId })
  return true
}

export async function removeRecipeFromMockCollection(recipeId, collectionId) {
  const links = await getRawRecipeCollections()
  const idx = links.findIndex(
    rc => String(rc.recipe_id) === String(recipeId) && rc.collection_id === collectionId
  )
  if (idx === -1) return false
  links.splice(idx, 1)
  return true
}

// ── Budget ─────────────────────────────────────────────

export async function getMockBudget() {
  return ensureInitialized('budget', async () => {
    const { mockUserBudget } = await import('@/data/mock-budget')
    return { ...mockUserBudget }
  })
}

export async function setMockBudget(weeklyBudget, monthlyBudget) {
  const budget = await getMockBudget()
  budget.weekly_budget = weeklyBudget
  budget.monthly_budget = monthlyBudget ?? null
  budget.updated_at = new Date().toISOString()
  return { ...budget }
}

async function getRawReceipts() {
  return ensureInitialized('receipts', async () => {
    const { mockReceipts } = await import('@/data/mock-budget')
    return JSON.parse(JSON.stringify(mockReceipts))
  })
}

async function getRawReceiptItems() {
  return ensureInitialized('receiptItems', async () => {
    const { mockReceiptItems } = await import('@/data/mock-budget')
    return JSON.parse(JSON.stringify(mockReceiptItems))
  })
}

export async function getMockReceipts(weekStart) {
  const receipts = await getRawReceipts()
  const filtered = weekStart ? receipts.filter(r => r.week_start === weekStart) : receipts
  return [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function getMockReceiptItems(receiptId) {
  const items = await getRawReceiptItems()
  return items.filter(i => i.receipt_id === receiptId)
}

export async function addMockReceipt(receipt, items) {
  const receipts = await getRawReceipts()
  const receiptItems = await getRawReceiptItems()
  const now = new Date().toISOString()
  const id = `receipt-${Date.now()}`
  const newReceipt = { ...receipt, id, created_at: now }
  receipts.unshift(newReceipt)
  if (items?.length) {
    items.forEach((item, idx) => {
      receiptItems.push({ ...item, id: `item-${Date.now()}-${idx}`, receipt_id: id, created_at: now })
    })
  }
  return newReceipt
}

export async function updateMockReceipt(receiptId, updates) {
  const receipts = await getRawReceipts()
  const receipt = receipts.find(r => r.id === receiptId)
  if (!receipt) return null
  Object.assign(receipt, updates)
  return { ...receipt }
}

export async function deleteMockReceipt(receiptId) {
  const receipts = await getRawReceipts()
  const receiptItems = await getRawReceiptItems()
  const idx = receipts.findIndex(r => r.id === receiptId)
  if (idx !== -1) receipts.splice(idx, 1)
  const itemIdxs = []
  receiptItems.forEach((item, i) => { if (item.receipt_id === receiptId) itemIdxs.unshift(i) })
  itemIdxs.forEach(i => receiptItems.splice(i, 1))
}

export async function updateMockReceiptItems(receiptId, items) {
  const receiptItems = await getRawReceiptItems()
  const now = new Date().toISOString()
  // Remove existing items for this receipt
  const toRemove = []
  receiptItems.forEach((item, i) => { if (item.receipt_id === receiptId) toRemove.unshift(i) })
  toRemove.forEach(i => receiptItems.splice(i, 1))
  // Add new items
  items.forEach((item, idx) => {
    receiptItems.push({ ...item, id: item.id || `item-${Date.now()}-${idx}`, receipt_id: receiptId, created_at: now })
  })
}

export async function getMockClassifiedItems(receiptId) {
  const items = await getRawReceiptItems()
  // Each item may have classified_data stored on it
  return items.filter(i => i.receipt_id === receiptId && i._classified)
    .map(i => i._classified)
}

export async function saveMockClassifiedItems(receiptId, classifiedItems) {
  const items = await getRawReceiptItems()
  // Store classification keyed on item_name since mock items have names
  const classMap = Object.fromEntries(classifiedItems.map(c => [c.item_name.toLowerCase(), c]))
  items.filter(i => i.receipt_id === receiptId).forEach(item => {
    item._classified = classMap[item.item_name.toLowerCase()] || null
  })
}

export async function markMockReceiptItemsAddedToPantry(itemIds) {
  const items = await getRawReceiptItems()
  const now = new Date().toISOString()
  const idSet = new Set(itemIds)
  items.forEach(item => {
    if (idSet.has(item.id)) item.added_to_pantry_at = now
  })
}

export async function findMockStapleByName(name) {
  const staples = await getMockStaples()
  const lower = name.toLowerCase()
  return staples.find(s => s.name.toLowerCase() === lower) || null
}

export async function restockMockStaple(stapleId, sourceReceiptId) {
  const staples = await getMockStaples()
  const staple = staples.find(s => s.id === stapleId)
  if (!staple) return null
  staple.is_out_of_stock = false
  staple.out_of_stock_since = null
  staple.last_restocked_at = new Date().toISOString()
  if (sourceReceiptId) staple.source_receipt_id = sourceReceiptId
  return { ...staple }
}

export async function addMockStapleFromReceipt(staple, sourceReceiptId) {
  const result = await addMockStaple(staple)
  result.source_receipt_id = sourceReceiptId || null
  result.last_restocked_at = new Date().toISOString()
  return result
}

export async function addMockPantryItemFromReceipt(item, sourceReceiptId) {
  const result = await addMockPantryItem(item)
  result.source_receipt_id = sourceReceiptId || null
  result.expires_at = item.expires_at || null
  return result
}

export async function findMockPantryItemByNameRecent(name, withinDays = 7) {
  const items = await getMockManagedPantry()
  const lower = name.toLowerCase()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - withinDays)
  return items.find(i =>
    i.ingredient_name.toLowerCase() === lower &&
    !i.is_depleted &&
    new Date(i.created_at) >= cutoff
  ) || null
}

// ── Meal Feedback ──────────────────────────────────────
let mockMealFeedbackStore = []

export function getMockMealFeedback() {
  return [...mockMealFeedbackStore]
}

export function addMockMealFeedback(entry) {
  mockMealFeedbackStore.push({ ...entry, id: String(Date.now()), created_at: new Date().toISOString() })
}

// ── Yesterday's Koda meals (demo data for dashboard rating cards) ──
export async function getMockYesterdayKodaMeals() {
  return [
    { name: 'Lemon Herb Chicken', type: 'dinner', day: 'yesterday', weekStart: new Date().toISOString().split('T')[0] },
    { name: 'Avocado Toast', type: 'breakfast', day: 'yesterday', weekStart: new Date().toISOString().split('T')[0] },
  ]
}
