export const mockGroceryItems = [
  // Need (don't have)
  { id: 1, name: 'Blueberries', category: 'Produce', status: 'need', meal: 'Overnight oats', store_assignment: 'kroger' },
  { id: 2, name: 'Turkey slices', category: 'Deli', status: 'need', meal: 'Turkey wrap', store_assignment: 'walmart' },
  { id: 3, name: 'Zucchini', category: 'Produce', status: 'need', meal: 'Pasta primavera', store_assignment: 'kroger' },
  { id: 4, name: 'Cherry tomatoes', category: 'Produce', status: 'need', meal: 'Pasta primavera', store_assignment: 'kroger' },
  { id: 5, name: 'Lemon', category: 'Produce', status: 'need', meal: 'Avocado toast', store_assignment: 'kroger' },
  { id: 6, name: 'Cucumber', category: 'Produce', status: 'need', meal: 'Chicken salad', store_assignment: 'kroger' },
  { id: 7, name: 'Salsa', category: 'Pantry', status: 'need', meal: 'Taco night', store_assignment: 'walmart' },
  { id: 8, name: 'Granola', category: 'Pantry', status: 'need', meal: 'Smoothie bowls', store_assignment: 'walmart' },
  { id: 9, name: 'Salmon fillets', category: 'Seafood', status: 'need', meal: 'Sheet pan salmon', store_assignment: 'target' },
  { id: 10, name: 'Asparagus', category: 'Produce', status: 'need', meal: 'Sheet pan salmon', store_assignment: 'kroger' },
  { id: 11, name: 'Dill', category: 'Produce', status: 'need', meal: 'Sheet pan salmon', store_assignment: null },
  { id: 12, name: 'Mixed berries', category: 'Produce', status: 'need', meal: 'Yogurt parfait', store_assignment: 'kroger' },
  { id: 13, name: 'Chicken breast', category: 'Meat', status: 'need', meal: 'Stir fry', store_assignment: 'walmart' },
  { id: 14, name: 'Broccoli', category: 'Produce', status: 'need', meal: 'Stir fry', store_assignment: 'kroger' },
  { id: 15, name: 'Pizza dough', category: 'Bakery', status: 'need', meal: 'Pizza night', store_assignment: null },
  { id: 16, name: 'Mozzarella', category: 'Dairy', status: 'need', meal: 'Pizza night', store_assignment: 'walmart' },
  { id: 17, name: 'Pepperoni', category: 'Deli', status: 'need', meal: 'Pizza night', store_assignment: 'walmart' },

  // Low (running low, might need)
  { id: 18, name: 'Eggs', category: 'Dairy', status: 'low', meal: 'Multiple meals', store_assignment: 'walmart' },
  { id: 19, name: 'Butter', category: 'Dairy', status: 'low', meal: 'Multiple meals', store_assignment: null },
  { id: 20, name: 'Sourdough bread', category: 'Bakery', status: 'low', meal: 'Multiple meals', store_assignment: null },

  // Have (already in pantry)
  { id: 21, name: 'Rolled oats', category: 'Pantry', status: 'have', meal: 'Overnight oats', store_assignment: null },
  { id: 22, name: 'Greek yogurt', category: 'Dairy', status: 'have', meal: 'Multiple meals', store_assignment: null },
  { id: 23, name: 'Olive oil', category: 'Pantry', status: 'have', meal: 'Multiple meals', store_assignment: null },
  { id: 24, name: 'Rice', category: 'Pantry', status: 'have', meal: 'Stir fry', store_assignment: null },
  { id: 25, name: 'Soy sauce', category: 'Pantry', status: 'have', meal: 'Stir fry', store_assignment: null },
  { id: 26, name: 'Penne pasta', category: 'Pantry', status: 'have', meal: 'Pasta primavera', store_assignment: null },
  { id: 27, name: 'Taco shells', category: 'Pantry', status: 'have', meal: 'Taco night', store_assignment: null },
  { id: 28, name: 'Ground beef', category: 'Meat', status: 'have', meal: 'Taco night', store_assignment: null },
]

export const mockStores = [
  { id: 'target', name: 'Target', color: '#CC0000', icon: '🎯', deepLinkBase: 'https://www.target.com/cart' },
  { id: 'instacart', name: 'Instacart', color: '#43B02A', icon: '🥕', deepLinkBase: 'https://www.instacart.com' },
  { id: 'walmart', name: 'Walmart', color: '#0071CE', icon: '🏪', deepLinkBase: 'https://www.walmart.com/cart' },
  { id: 'kroger', name: 'Kroger', color: '#003B73', icon: '🛒', deepLinkBase: 'https://www.kroger.com/cart' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900', icon: '📦', deepLinkBase: 'https://www.amazon.com/afx/ingredients/landing' },
]

export const mockWeekSummary = {
  totalMeals: 15,
  plannedMeals: 15,
  totalIngredients: 28,
  haveCount: 8,
  needCount: 17,
  lowCount: 3,
}
