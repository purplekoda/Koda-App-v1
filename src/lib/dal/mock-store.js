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

export async function getMockMeals() {
  return ensureInitialized('meals', async () => {
    const { mockWeeklyMeals } = await import('@/data/mock-meals')
    return mockWeeklyMeals
  })
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
  const meals = await getMockMeals()
  const dayObj = meals.find(d => d.day === day)
  if (!dayObj) return null

  const mealObj = dayObj.meals.find(m => m.type === type)
  if (!mealObj) return null

  Object.assign(mealObj, update)
  return mealObj
}

export async function clearMockMeal(day, type) {
  return updateMockMeal(day, type, { name: null, ingredients: [] })
}

export async function fillMockWeek() {
  const meals = await getMockMeals()
  const fillerMeals = {
    breakfast: ['French toast', 'Egg muffins', 'Banana bread', 'Cereal', 'Bagel & cream cheese'],
    lunch: ['Caesar salad', 'BLT sandwich', 'Quinoa bowl', 'Veggie wrap', 'Ramen'],
    dinner: ['Lasagna', 'Grilled chicken', 'Fish tacos', 'Beef stew', 'Pad thai'],
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
