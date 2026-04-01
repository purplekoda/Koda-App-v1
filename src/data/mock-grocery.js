export const mockGroceryItems = [
  // Need (don't have)
  { id: 1, name: 'Blueberries', category: 'Produce', status: 'need', meal: 'Overnight oats' },
  { id: 2, name: 'Turkey slices', category: 'Deli', status: 'need', meal: 'Turkey wrap' },
  { id: 3, name: 'Zucchini', category: 'Produce', status: 'need', meal: 'Pasta primavera' },
  { id: 4, name: 'Cherry tomatoes', category: 'Produce', status: 'need', meal: 'Pasta primavera' },
  { id: 5, name: 'Lemon', category: 'Produce', status: 'need', meal: 'Avocado toast' },
  { id: 6, name: 'Cucumber', category: 'Produce', status: 'need', meal: 'Chicken salad' },
  { id: 7, name: 'Salsa', category: 'Pantry', status: 'need', meal: 'Taco night' },
  { id: 8, name: 'Granola', category: 'Pantry', status: 'need', meal: 'Smoothie bowls' },
  { id: 9, name: 'Salmon fillets', category: 'Seafood', status: 'need', meal: 'Sheet pan salmon' },
  { id: 10, name: 'Asparagus', category: 'Produce', status: 'need', meal: 'Sheet pan salmon' },
  { id: 11, name: 'Dill', category: 'Produce', status: 'need', meal: 'Sheet pan salmon' },
  { id: 12, name: 'Mixed berries', category: 'Produce', status: 'need', meal: 'Yogurt parfait' },
  { id: 13, name: 'Chicken breast', category: 'Meat', status: 'need', meal: 'Stir fry' },
  { id: 14, name: 'Broccoli', category: 'Produce', status: 'need', meal: 'Stir fry' },
  { id: 15, name: 'Pizza dough', category: 'Bakery', status: 'need', meal: 'Pizza night' },
  { id: 16, name: 'Mozzarella', category: 'Dairy', status: 'need', meal: 'Pizza night' },
  { id: 17, name: 'Pepperoni', category: 'Deli', status: 'need', meal: 'Pizza night' },

  // Low (running low, might need)
  { id: 18, name: 'Eggs', category: 'Dairy', status: 'low', meal: 'Multiple meals' },
  { id: 19, name: 'Butter', category: 'Dairy', status: 'low', meal: 'Multiple meals' },
  { id: 20, name: 'Sourdough bread', category: 'Bakery', status: 'low', meal: 'Multiple meals' },

  // Have (already in pantry)
  { id: 21, name: 'Rolled oats', category: 'Pantry', status: 'have', meal: 'Overnight oats' },
  { id: 22, name: 'Greek yogurt', category: 'Dairy', status: 'have', meal: 'Multiple meals' },
  { id: 23, name: 'Olive oil', category: 'Pantry', status: 'have', meal: 'Multiple meals' },
  { id: 24, name: 'Rice', category: 'Pantry', status: 'have', meal: 'Stir fry' },
  { id: 25, name: 'Soy sauce', category: 'Pantry', status: 'have', meal: 'Stir fry' },
  { id: 26, name: 'Penne pasta', category: 'Pantry', status: 'have', meal: 'Pasta primavera' },
  { id: 27, name: 'Taco shells', category: 'Pantry', status: 'have', meal: 'Taco night' },
  { id: 28, name: 'Ground beef', category: 'Meat', status: 'have', meal: 'Taco night' },
]

export const mockStores = [
  { id: 'target', name: 'Target', color: '#CC0000', icon: '\uD83C\uDFAF', deepLinkBase: 'https://www.target.com/cart' },
  { id: 'instacart', name: 'Instacart', color: '#43B02A', icon: '\uD83E\uDD55', deepLinkBase: 'https://www.instacart.com' },
  { id: 'walmart', name: 'Walmart', color: '#0071CE', icon: '\uD83C\uDFEA', deepLinkBase: 'https://www.walmart.com/cart' },
  { id: 'kroger', name: 'Kroger', color: '#003B73', icon: '\uD83D\uDED2', deepLinkBase: 'https://www.kroger.com/cart' },
]

export const mockWeekSummary = {
  totalMeals: 15,
  plannedMeals: 15,
  totalIngredients: 28,
  haveCount: 8,
  needCount: 17,
  lowCount: 3,
}
