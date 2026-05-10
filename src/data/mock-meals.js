export const mockWeeklyMeals = [
  {
    day: 'Mon',
    dayOfWeek: 1,
    isToday: false,
    meals: [
      {
        type: 'breakfast',
        name: 'Overnight oats',
        time: '7:30am',
        ingredients: [
          { name: 'Rolled oats', have: true },
          { name: 'Greek yogurt', have: true },
          { name: 'Blueberries', have: false },
          { name: 'Honey', have: true },
          { name: 'Chia seeds', have: true },
        ],
      },
      {
        type: 'lunch',
        name: 'Turkey wrap',
        time: '12pm',
        ingredients: [
          { name: 'Tortilla', have: true },
          { name: 'Turkey slices', have: false },
          { name: 'Lettuce', have: true },
          { name: 'Tomato', have: true },
          { name: 'Mustard', have: true },
        ],
      },
      {
        type: 'dinner',
        name: 'Pasta primavera',
        time: '6:30pm',
        ingredients: [
          { name: 'Penne pasta', have: true },
          { name: 'Zucchini', have: false },
          { name: 'Bell pepper', have: true },
          { name: 'Cherry tomatoes', have: false },
          { name: 'Parmesan', have: true },
          { name: 'Olive oil', have: true },
        ],
      },
      {
        type: 'sides',
        name: 'Garlic bread',
        time: '6:30pm',
        ingredients: [
          { name: 'Baguette', have: true },
          { name: 'Butter', have: true },
          { name: 'Garlic', have: true },
        ],
      },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Tue',
    dayOfWeek: 2,
    isToday: true,
    meals: [
      {
        type: 'breakfast',
        name: 'Avocado toast',
        time: '7:30am',
        ingredients: [
          { name: 'Sourdough bread', have: true },
          { name: 'Avocado', have: true },
          { name: 'Eggs', have: true },
          { name: 'Everything bagel seasoning', have: true },
          { name: 'Lemon', have: false },
        ],
      },
      {
        type: 'lunch',
        name: 'Chicken salad',
        time: '12pm',
        ingredients: [
          { name: 'Chicken breast', have: true },
          { name: 'Mixed greens', have: true },
          { name: 'Cucumber', have: false },
          { name: 'Feta cheese', have: true },
          { name: 'Olive oil dressing', have: true },
        ],
      },
      {
        type: 'dinner',
        name: 'Taco night',
        time: '6:30pm',
        ingredients: [
          { name: 'Ground beef', have: true },
          { name: 'Taco shells', have: true },
          { name: 'Shredded cheese', have: true },
          { name: 'Salsa', have: false },
          { name: 'Sour cream', have: true },
          { name: 'Lettuce', have: true },
        ],
      },
      { type: 'sides', name: null, time: null, ingredients: [] },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Wed',
    dayOfWeek: 3,
    isToday: false,
    meals: [
      {
        type: 'breakfast',
        name: 'Smoothie bowls',
        time: '7:30am',
        ingredients: [
          { name: 'Frozen berries', have: true },
          { name: 'Banana', have: true },
          { name: 'Almond milk', have: true },
          { name: 'Granola', have: false },
          { name: 'Peanut butter', have: true },
        ],
      },
      {
        type: 'lunch',
        name: 'Soup & bread',
        time: '12pm',
        ingredients: [
          { name: 'Tomato soup', have: true },
          { name: 'Sourdough bread', have: true },
          { name: 'Butter', have: true },
        ],
      },
      {
        type: 'dinner',
        name: 'Sheet pan salmon',
        time: '6:30pm',
        ingredients: [
          { name: 'Salmon fillets', have: false },
          { name: 'Asparagus', have: false },
          { name: 'Lemon', have: false },
          { name: 'Garlic', have: true },
          { name: 'Olive oil', have: true },
          { name: 'Dill', have: false },
        ],
      },
      {
        type: 'sides',
        name: 'Roasted potatoes',
        time: '6:30pm',
        ingredients: [
          { name: 'Potatoes', have: true },
          { name: 'Olive oil', have: true },
          { name: 'Rosemary', have: false },
        ],
      },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Thu',
    dayOfWeek: 4,
    isToday: false,
    meals: [
      {
        type: 'breakfast',
        name: 'Yogurt parfait',
        time: '7:30am',
        ingredients: [
          { name: 'Greek yogurt', have: true },
          { name: 'Granola', have: false },
          { name: 'Mixed berries', have: false },
          { name: 'Honey', have: true },
        ],
      },
      { type: 'lunch', name: 'Leftovers', time: '12pm', ingredients: [] },
      {
        type: 'dinner',
        name: 'Stir fry',
        time: '6:30pm',
        ingredients: [
          { name: 'Chicken breast', have: false },
          { name: 'Broccoli', have: false },
          { name: 'Soy sauce', have: true },
          { name: 'Sesame oil', have: true },
          { name: 'Rice', have: true },
          { name: 'Ginger', have: true },
        ],
      },
      { type: 'sides', name: null, time: null, ingredients: [] },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Fri',
    dayOfWeek: 5,
    isToday: false,
    meals: [
      {
        type: 'breakfast',
        name: 'Pancakes',
        time: '7:30am',
        ingredients: [
          { name: 'Pancake mix', have: true },
          { name: 'Eggs', have: true },
          { name: 'Milk', have: true },
          { name: 'Maple syrup', have: true },
          { name: 'Butter', have: true },
        ],
      },
      {
        type: 'lunch',
        name: 'Grilled cheese',
        time: '12pm',
        ingredients: [
          { name: 'Sourdough bread', have: true },
          { name: 'Cheddar cheese', have: true },
          { name: 'Butter', have: true },
          { name: 'Tomato soup', have: true },
        ],
      },
      {
        type: 'dinner',
        name: 'Pizza night',
        time: '6:30pm',
        ingredients: [
          { name: 'Pizza dough', have: false },
          { name: 'Mozzarella', have: false },
          { name: 'Marinara sauce', have: true },
          { name: 'Pepperoni', have: false },
          { name: 'Bell pepper', have: true },
        ],
      },
      {
        type: 'sides',
        name: 'Side salad',
        time: '6:30pm',
        ingredients: [
          { name: 'Mixed greens', have: true },
          { name: 'Cherry tomatoes', have: false },
          { name: 'Dressing', have: true },
        ],
      },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Sat',
    dayOfWeek: 6,
    isToday: false,
    meals: [
      { type: 'breakfast', name: null, time: null, ingredients: [] },
      { type: 'lunch', name: null, time: null, ingredients: [] },
      { type: 'dinner', name: null, time: null, ingredients: [] },
      { type: 'sides', name: null, time: null, ingredients: [] },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
  {
    day: 'Sun',
    dayOfWeek: 7,
    isToday: false,
    meals: [
      { type: 'breakfast', name: null, time: null, ingredients: [] },
      { type: 'lunch', name: null, time: null, ingredients: [] },
      { type: 'dinner', name: null, time: null, ingredients: [] },
      { type: 'sides', name: null, time: null, ingredients: [] },
      { type: 'dinner_dessert', name: null, time: null, ingredients: [] },
    ],
  },
];

export const mockTodayMeals = [
  { type: 'breakfast', name: 'Avocado toast', time: '7:30am' },
  { type: 'lunch', name: 'Chicken salad', time: '12pm' },
  { type: 'dinner', name: 'Taco night', time: '6:30pm' },
];

export const mockSwapSuggestions = [
  {
    name: 'Chicken stir fry',
    reason: 'Uses chicken you already have',
    cookTime: '25 min',
    tags: ['quick', 'pantry-ready'],
  },
  {
    name: 'Black bean tacos',
    reason: 'Family favorite, vegetarian option',
    cookTime: '15 min',
    tags: ['quick', 'vegetarian'],
  },
  {
    name: 'Salmon & rice bowl',
    reason: 'High protein, uses pantry rice',
    cookTime: '30 min',
    tags: ['healthy'],
  },
  {
    name: 'Pasta carbonara',
    reason: 'Kid-friendly, uses eggs & pasta on hand',
    cookTime: '20 min',
    tags: ['quick', 'kid-friendly'],
  },
];
