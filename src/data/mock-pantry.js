export const mockPantryItems = [
  // Fresh (green)
  { id: 1, name: 'Eggs (12ct)', freshness: 'fresh', daysLeft: 10, category: 'Dairy' },
  { id: 2, name: 'Greek yogurt', freshness: 'fresh', daysLeft: 8, category: 'Dairy' },
  { id: 3, name: 'Cheddar cheese', freshness: 'fresh', daysLeft: 14, category: 'Dairy' },
  { id: 4, name: 'Carrots', freshness: 'fresh', daysLeft: 7, category: 'Produce' },
  { id: 5, name: 'Apples', freshness: 'fresh', daysLeft: 12, category: 'Produce' },
  { id: 6, name: 'Ground beef', freshness: 'fresh', daysLeft: 3, category: 'Meat' },

  // Expiring soon (amber) — 1-2 days
  { id: 7, name: 'Avocados (3)', freshness: 'expiring', daysLeft: 2, category: 'Produce' },
  { id: 8, name: 'Chicken breast', freshness: 'expiring', daysLeft: 1, category: 'Meat' },
  { id: 9, name: 'Mixed greens', freshness: 'expiring', daysLeft: 2, category: 'Produce' },
  { id: 10, name: 'Milk (half gallon)', freshness: 'expiring', daysLeft: 1, category: 'Dairy' },

  // Low/empty (coral)
  { id: 11, name: 'Butter', freshness: 'low', daysLeft: null, category: 'Dairy' },
  { id: 12, name: 'Sourdough bread', freshness: 'low', daysLeft: null, category: 'Bakery' },
  { id: 13, name: 'Bananas', freshness: 'low', daysLeft: 0, category: 'Produce' },
]

export const mockDinnerIdeas = [
  {
    id: 1,
    name: 'Chicken & avocado salad',
    reason: 'Uses expiring chicken breast and avocados',
    prepTime: '15 min',
    pantryMatch: 5,
    pantryTotal: 6,
    tags: ['uses-expiring', 'quick', 'healthy'],
    priority: 1,
  },
  {
    id: 2,
    name: 'Avocado toast with eggs',
    reason: 'Uses expiring avocados and fresh eggs',
    prepTime: '10 min',
    pantryMatch: 4,
    pantryTotal: 4,
    tags: ['uses-expiring', 'pantry-ready', 'quick'],
    priority: 2,
  },
  {
    id: 3,
    name: 'Beef & veggie stir fry',
    reason: 'Uses ground beef and carrots from pantry',
    prepTime: '25 min',
    pantryMatch: 4,
    pantryTotal: 6,
    tags: ['pantry-ready', 'family-favorite'],
    priority: 3,
  },
  {
    id: 4,
    name: 'Greek yogurt parfait bowl',
    reason: 'Uses yogurt, apples, and pantry staples',
    prepTime: '5 min',
    pantryMatch: 3,
    pantryTotal: 3,
    tags: ['pantry-ready', 'no-cook', 'quick'],
    priority: 4,
  },
]

export const mockLastScan = {
  date: 'March 27, 2026',
  time: '2:15 PM',
  itemsDetected: 13,
}
