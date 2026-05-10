/**
 * Pantry staples categories and suggested items.
 * Used by the staples section in the Pantry tab.
 */

export const STAPLE_CATEGORIES = [
  'Baking Staples',
  'Spices & Seasonings',
  'Oils & Condiments',
  'Grains & Pasta',
  'Canned & Jarred Goods',
  'Fresh Produce Staples',
  'Dairy & Refrigerator Staples',
  'Other',
];

export const SUGGESTED_STAPLES = {
  'Baking Staples': [
    'Flour',
    'Sugar',
    'Brown sugar',
    'Baking powder',
    'Baking soda',
    'Salt',
    'Vanilla extract',
    'Cocoa powder',
    'Cornstarch',
    'Powdered sugar',
  ],
  'Spices & Seasonings': [
    'Black pepper',
    'Garlic powder',
    'Onion powder',
    'Cumin',
    'Paprika',
    'Chili powder',
    'Oregano',
    'Basil',
    'Thyme',
    'Rosemary',
    'Cinnamon',
    'Cayenne',
    'Italian seasoning',
    'Bay leaves',
    'Red pepper flakes',
  ],
  'Oils & Condiments': [
    'Olive oil',
    'Vegetable oil',
    'Cooking spray',
    'Soy sauce',
    'Worcestershire sauce',
    'Hot sauce',
    'Apple cider vinegar',
    'White vinegar',
    'Honey',
    'Maple syrup',
    'Ketchup',
    'Mustard',
    'Mayonnaise',
  ],
  'Grains & Pasta': [
    'White rice',
    'Brown rice',
    'Pasta',
    'Egg noodles',
    'Quinoa',
    'Oats',
    'Bread crumbs',
    'Panko',
    'Cornmeal',
    'Lentils',
  ],
  'Canned & Jarred Goods': [
    'Chicken broth',
    'Vegetable broth',
    'Diced tomatoes',
    'Tomato paste',
    'Tomato sauce',
    'Coconut milk',
    'Black beans',
    'Chickpeas',
    'Corn',
    'Green beans',
    'Peanut butter',
    'Almond butter',
  ],
  'Fresh Produce Staples': [
    'Garlic cloves',
    'Onions',
    'Potatoes',
    'Sweet potatoes',
    'Carrots',
    'Celery',
    'Lemons',
    'Limes',
    'Apples',
    'Bananas',
  ],
  'Dairy & Refrigerator Staples': [
    'Butter',
    'Eggs',
    'Milk',
    'Heavy cream',
    'Sour cream',
    'Parmesan cheese',
    'Shredded cheddar',
  ],
};

/** Flat list of all suggested staple names (lowercase) for quick lookup */
export const ALL_SUGGESTED_NAMES = new Set(
  Object.values(SUGGESTED_STAPLES)
    .flat()
    .map((n) => n.toLowerCase()),
);
