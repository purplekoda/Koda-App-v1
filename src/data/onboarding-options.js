/**
 * Static option data for onboarding wizard steps.
 */

export const HOUSEHOLD_TYPE_OPTIONS = [
  { value: 'includes_kids', label: '👨‍👩‍👧‍👦 Includes kids' },
  { value: 'adults_only', label: '🧑‍🤝‍🧑 Adults only' },
  { value: 'varies', label: '🔄 Varies week to week' },
]

export const COOK_TIME_OPTIONS = [
  { value: 'under_20', label: '⚡ Under 20 minutes', subtitle: 'Quick wins only please' },
  { value: '20_to_40', label: '⏲️ 20 to 40 minutes', subtitle: 'A good middle ground' },
  { value: 'up_to_60', label: '👨‍🍳 Up to an hour', subtitle: 'I enjoy cooking when I can' },
  { value: 'depends', label: '📅 Depends on the day', subtitle: 'Let my calendar decide' },
]

export const DAY_OPTIONS = [
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
  { value: 7, label: 'Sun', short: 'S' },
]

export const DAY_PRESETS = [
  { label: 'All 7 days', days: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Weekdays only', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends only', days: [6, 7] },
  { label: 'Clear all', days: [] },
]

export const DIETARY_RESTRICTION_OPTIONS = [
  { value: 'nut-allergy', label: '🥜 Nut allergy' },
  { value: 'gluten-free', label: '🌾 Gluten free' },
  { value: 'dairy-free', label: '🥛 Dairy free' },
  { value: 'vegetarian', label: '🥬 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'pescatarian', label: '🐟 Pescatarian' },
  { value: 'egg-allergy', label: '🥚 Egg allergy' },
  { value: 'shellfish-allergy', label: '🦐 Shellfish allergy' },
  { value: 'keto', label: '🥩 Keto' },
  { value: 'low-sodium', label: '🧂 Low sodium' },
  { value: 'diabetic-friendly', label: '💉 Diabetic friendly' },
]

export const CUISINE_OPTIONS = [
  { value: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { value: 'Mexican', label: 'Mexican', flag: '🇲🇽' },
  { value: 'American', label: 'American', flag: '🇺🇸' },
  { value: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
  { value: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
  { value: 'Thai', label: 'Thai', flag: '🇹🇭' },
  { value: 'Indian', label: 'Indian', flag: '🇮🇳' },
  { value: 'Mediterranean', label: 'Mediterranean', flag: '🇬🇷' },
  { value: 'Korean', label: 'Korean', flag: '🇰🇷' },
  { value: 'Vietnamese', label: 'Vietnamese', flag: '🇻🇳' },
  { value: 'Middle Eastern', label: 'Middle Eastern', flag: '🇱🇧' },
  { value: 'Comfort food', label: 'Comfort food', flag: '🏠' },
]

export const ADVENTUROUSNESS_OPTIONS = [
  { value: 'familiar', label: '🏡 Keep it familiar', subtitle: 'Stick to recipes my family loves' },
  { value: 'mix_it_up', label: '🎲 Mix it up', subtitle: 'Some favorites, some new ideas' },
  { value: 'surprise_me', label: '🎉 Surprise me', subtitle: 'I love trying new things every week' },
]

export const MEAL_PREP_STYLE_OPTIONS = [
  { value: 'meal_prep', label: '📦 I meal prep', subtitle: 'I cook in batches on set days' },
  { value: 'cook_fresh', label: '🍳 I cook fresh daily', subtitle: 'I prefer to cook each meal as I go' },
  { value: 'mix', label: '🔀 A mix of both', subtitle: 'Some prep, some fresh' },
]

export const FRUSTRATION_OPTIONS = [
  { value: 'food_waste', label: '🗑️ Food waste', subtitle: 'Ingredients go bad before I use them' },
  { value: 'deciding', label: '🤔 Deciding what to cook', subtitle: 'I never know what to make each night' },
  { value: 'not_enough_time', label: '⏰ Not enough time', subtitle: 'My schedule makes cooking hard' },
  { value: 'grocery_budget', label: '💸 Grocery budget', subtitle: 'I spend too much at the store' },
  { value: 'boring_meals', label: '😴 Boring meals', subtitle: 'We eat the same things every week' },
  { value: 'too_many_trips', label: '🛒 Too many grocery trips', subtitle: "I'm always running back to the store" },
  { value: 'eating_healthy', label: '🥗 Eating healthy consistently', subtitle: 'Good intentions but hard to stick to' },
]

export const BUDGET_PRESETS = [75, 100, 150, 200, 300]

export const SHOPPING_STYLE_OPTIONS = [
  { value: 'deal_hunter', label: 'I shop around for the best deals', subtitle: "I'll visit multiple stores if it saves money", icon: '\uD83C\uDFF7\uFE0F' },
  { value: 'convenience', label: 'I shop at the same stores for convenience', subtitle: 'Good deals are nice but not worth the extra trips', icon: '\uD83D\uDED2' },
  { value: 'pickup_only', label: 'I only use stores that offer pickup', subtitle: 'I order online and grab it curbside', icon: '\uD83D\uDE97' },
  { value: 'delivery_preferred', label: 'I prefer delivery to my door', subtitle: 'Instacart, DoorDash, or store delivery works for me', icon: '\uD83D\uDCE6' },
  { value: 'flexible', label: 'It depends on the week', subtitle: "Sometimes I shop, sometimes I deliver \u2014 whatever works", icon: '\uD83D\uDD04' },
]

export const DELIVERY_SERVICE_OPTIONS = [
  { value: 'instacart', label: '🥕 Instacart' },
  { value: 'doordash', label: '🚪 DoorDash Grocery' },
  { value: 'walmart_plus', label: '🏬 Walmart+' },
  { value: 'amazon_fresh', label: '📦 Amazon Fresh' },
  { value: 'other', label: '➕ Other' },
]

export const BUDGET_PRIORITY_OPTIONS = [
  { value: 'fewer_trips', label: '🚗 Fewer grocery trips' },
  { value: 'buy_bulk', label: '📦 Buy in bulk where possible' },
  { value: 'store_brands', label: '🏷️ Prefer store brands' },
  { value: 'fresh_over_frozen', label: '🥦 Fresh over frozen' },
  { value: 'frozen_fine', label: '🧊 Frozen is fine' },
  { value: 'organic', label: '🌿 Organic when possible' },
]

export const HEALTH_GOAL_OPTIONS = [
  { value: 'weight_loss', label: '⚖️ Weight loss', subtitle: 'Lower calorie meals that still feel satisfying' },
  { value: 'muscle_gain', label: '💪 Muscle gain', subtitle: 'High protein meals to support strength goals' },
  { value: 'maintenance', label: '⚡ Maintenance', subtitle: 'Balanced meals to stay where I am' },
  { value: 'more_energy', label: '🔋 More energy', subtitle: 'Meals that fuel me through busy days' },
  { value: 'heart_health', label: '❤️ Heart health', subtitle: 'Lower sodium, healthy fats, less processed food' },
  { value: 'track_macros', label: '📊 Track my macros', subtitle: 'Monitor protein, carbs, and fats to hit my targets' },
  { value: 'gut_health', label: '🦠 Gut health', subtitle: 'More fiber, fermented foods, less inflammation' },
  { value: 'blood_sugar', label: '🩸 Blood sugar management', subtitle: 'Lower carb meals to help keep blood sugar steady' },
  { value: 'just_eating_well', label: '😊 Just eating well', subtitle: 'No specific goal — just want good wholesome food' },
]

export const PICKY_EATER_ISSUES = [
  '🥦 No vegetables', '🌶️ No spicy food', '🍄 No mushrooms', '🧅 No onions',
  '🍅 No tomatoes', '🍲 No mixed foods', '🍝 Plain pasta only', '🥩 Meat only',
  '🫗 No sauces', '🥬 No leafy greens',
]

export const MEMBER_ALLERGY_OPTIONS = [
  '🥜 Nuts', '🌾 Gluten', '🥛 Dairy', '🥚 Eggs', '🦐 Shellfish',
]

export const MEMBER_DIET_OPTIONS = [
  '🥬 Vegetarian', '🌱 Vegan', '🐟 Pescatarian', '🥩 Keto', '🧂 Low sodium', '💉 Diabetic friendly',
]

export const PERMISSION_GROUPS = [
  {
    label: 'Meal Planning',
    permissions: [
      { key: 'can_view_meal_plan', label: 'View meal plan', description: 'See the weekly meal plan', defaultValue: true },
      { key: 'can_edit_meal_plan', label: 'Edit meal plan', description: 'Add, remove, or swap meals', defaultValue: true },
    ],
  },
  {
    label: 'Recipes',
    permissions: [
      { key: 'can_add_recipes', label: 'Add recipes', description: 'Save new recipes to the Recipe Box', defaultValue: true },
      { key: 'can_edit_recipes', label: 'Edit recipes', description: 'Modify existing recipes', defaultValue: false },
      { key: 'can_delete_recipes', label: 'Delete recipes', description: 'Remove recipes from the household', defaultValue: false },
    ],
  },
  {
    label: 'Grocery',
    permissions: [
      { key: 'can_add_to_grocery_list', label: 'Add to grocery list', description: 'Add items to the shared list', defaultValue: true },
      { key: 'can_send_grocery_list', label: 'Send grocery list', description: 'Send the list to a store for delivery', defaultValue: false },
    ],
  },
  {
    label: 'Pantry',
    permissions: [
      { key: 'can_view_pantry', label: 'View pantry', description: 'See pantry contents', defaultValue: true },
      { key: 'can_edit_pantry', label: 'Edit pantry', description: 'Add or remove pantry items', defaultValue: false },
    ],
  },
]
