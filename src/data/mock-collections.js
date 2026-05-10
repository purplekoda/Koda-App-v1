export const mockCollections = [
  {
    id: 'col-1',
    name: 'Weeknight Wins',
    description: 'Fast and easy recipes for busy weeknights',
    emoji: '\uD83C\uDF19',
    sort_order: 1,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'col-2',
    name: 'Meal Prep',
    description: 'Batch-cook friendly recipes',
    emoji: '\uD83D\uDCE6',
    sort_order: 2,
    created_at: '2026-03-05T10:00:00Z',
    updated_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 'col-3',
    name: 'Breakfast Favorites',
    description: 'Morning staples the whole family loves',
    emoji: '\uD83C\uDF05',
    sort_order: 3,
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
];

// Junction table linking recipes to collections (many-to-many)
export const mockRecipeCollections = [
  { recipe_id: 2, collection_id: 'col-1' }, // Sheet Pan Chicken → Weeknight Wins
  { recipe_id: 3, collection_id: 'col-1' }, // Pasta Primavera → Weeknight Wins
  { recipe_id: 2, collection_id: 'col-2' }, // Sheet Pan Chicken → Meal Prep
  { recipe_id: 1, collection_id: 'col-3' }, // Overnight Oats → Breakfast Favorites
  { recipe_id: 4, collection_id: 'col-3' }, // Avocado Toast → Breakfast Favorites
];
