/**
 * Faith-based and cultural dietary practices — constants & mappings.
 *
 * Used by: FaithPracticeCards component, validators, buildMealPlanPrompt,
 * faith-conflict-check utility, and auto-apply logic.
 */

// ── Practice definitions (alphabetical) ───────────────────

export const FAITH_PRACTICE_OPTIONS = [
  {
    id: 'buddhist',
    name: 'Buddhist dietary practices',
    emoji: '\u{1FAB7}',
    description: 'Varies by tradition and country.',
    observanceLevels: [
      { value: 'vegetarian', label: 'Vegetarian', subtitle: 'No meat or fish' },
      { value: 'vegan', label: 'Vegan', subtitle: 'No animal products of any kind' },
      { value: 'pungent_free', label: 'Pungent-free', subtitle: 'Vegetarian or vegan and also avoid garlic, onion, leeks, chives, and shallots' },
    ],
    levelField: 'buddhist_level',
    selectType: 'single',
  },
  {
    id: 'catholic_lenten',
    name: 'Catholic Lenten practices',
    emoji: '\u271D\uFE0F',
    description: 'Abstain from meat on Fridays during Lent and on Ash Wednesday and Good Friday.',
    observanceLevels: [],
    levelField: 'catholic_lenten',
    selectType: 'boolean',
  },
  {
    id: 'lds',
    name: 'Church of Jesus Christ of Latter-day Saints',
    emoji: '\u{1F54A}\uFE0F',
    description: 'Word of Wisdom dietary guidelines.',
    introNote: 'The Word of Wisdom is a health code followed by members of the Church. Select the guidelines your household observes.',
    observanceLevels: [
      { value: 'lds_no_coffee', label: 'No coffee', subtitle: 'We avoid coffee including coffee-based beverages and ingredients.' },
      { value: 'lds_no_alcohol', label: 'No alcohol', subtitle: 'We avoid alcohol including alcohol used in cooking such as wine, beer, or spirits.' },
      { value: 'lds_no_black_tea', label: 'No black tea', subtitle: 'We avoid black tea including black tea used in cooking or marinades. Herbal teas and green tea are not restricted.' },
    ],
    levelField: 'is_lds',
    selectType: 'multi_toggle',
    closingNote: 'Koda will honor these guidelines across all meal suggestions. These settings reflect the Word of Wisdom health code as commonly practiced \u2014 observance can vary by individual and family.',
  },
  {
    id: 'orthodox',
    name: 'Eastern Orthodox fasting',
    emoji: '\u2626\uFE0F',
    description: 'Fasting periods throughout the Orthodox calendar including Lent, every Wednesday and Friday, and additional fasting seasons.',
    introNote: 'On fasting days, avoid meat, dairy, fish, wine, and oil on the strictest days.',
    observanceLevels: [
      { value: 'orthodox_fasting_calendar', label: 'Enable automatic fasting calendar', subtitle: 'Koda automatically suggests appropriate meals on fasting days throughout the year.' },
    ],
    levelField: 'orthodox_fasting',
    selectType: 'boolean_with_toggle',
  },
  {
    id: 'halal',
    name: 'Halal',
    emoji: '\u262A\uFE0F',
    description: 'Islamic dietary guidelines.',
    observanceLevels: [
      { value: 'basic', label: 'Basic', subtitle: 'Avoid pork and alcohol' },
      { value: 'certified_meat', label: 'Certified meat', subtitle: 'Require halal-certified meat and avoid pork and alcohol' },
      { value: 'full', label: 'Full', subtitle: 'Follow complete halal standards for all ingredients and preparation methods' },
    ],
    levelField: 'halal_level',
    selectType: 'single',
    closingNote: 'For full halal compliance we recommend verifying all ingredients and preparation methods.',
  },
  {
    id: 'hindu',
    name: 'Hindu dietary practices',
    emoji: '\u{1F549}\uFE0F',
    description: 'Respect for ahimsa and the sacred cow.',
    observanceLevels: [
      { value: 'beef_free', label: 'Beef-free', subtitle: 'No beef but may eat other meats' },
      { value: 'vegetarian', label: 'Vegetarian', subtitle: 'No meat of any kind' },
      { value: 'strict', label: 'Strict', subtitle: 'No meat and also avoid onion and garlic particularly during religious observances' },
    ],
    levelField: 'hindu_level',
    selectType: 'single',
  },
  {
    id: 'ital',
    name: 'Ital \u2014 Rastafari dietary practices',
    emoji: '\u{1F33F}',
    description: 'Natural whole foods, minimal processing, connection to the earth.',
    observanceLevels: [
      { value: 'basic', label: 'Basic', subtitle: 'No pork and minimize processed foods' },
      { value: 'strict', label: 'Strict', subtitle: 'No meat, no salt, and fully natural unprocessed ingredients only' },
    ],
    levelField: 'ital_level',
    selectType: 'single',
  },
  {
    id: 'jain',
    name: 'Jain dietary practices',
    emoji: '\u{1F64F}',
    description: 'Strict non-violence toward all living beings.',
    observanceLevels: [
      { value: 'standard', label: 'Standard', subtitle: 'No meat, fish, or eggs of any kind' },
      { value: 'strict', label: 'Strict', subtitle: 'Also avoid root vegetables including potatoes, onions, garlic, carrots, and beets because harvesting them destroys the entire plant' },
    ],
    levelField: 'jain_level',
    selectType: 'single',
  },
  {
    id: 'kosher',
    name: 'Kosher',
    emoji: '\u2721\uFE0F',
    description: 'Jewish dietary laws.',
    observanceLevels: [
      { value: 'basic', label: 'Basic', subtitle: 'Avoid non-kosher meats and shellfish' },
      { value: 'traditional', label: 'Traditional', subtitle: 'Also keep meat and dairy strictly separate in the same meal' },
      { value: 'certified', label: 'Certified', subtitle: 'Require certified kosher products for all packaged and processed ingredients' },
    ],
    levelField: 'kosher_level',
    selectType: 'single',
    closingNote: 'For certified kosher requirements we recommend verifying all ingredients with your local rabbinical authority.',
  },
  {
    id: 'adventist',
    name: 'Seventh-day Adventist',
    emoji: '\u271D\uFE0F',
    description: 'Biblical dietary principles emphasizing health and wellbeing.',
    observanceLevels: [
      { value: 'vegetarian', label: 'Vegetarian', subtitle: 'No meat preferred with avoidance of caffeine and alcohol' },
      { value: 'kosher_style', label: 'Kosher-style', subtitle: 'No pork or shellfish with avoidance of caffeine and alcohol' },
    ],
    levelField: 'adventist_level',
    selectType: 'single',
  },
  {
    id: 'other',
    name: 'Other',
    emoji: '\u{1F4DD}',
    description: 'A practice not listed above.',
    observanceLevels: [],
    levelField: null,
    selectType: 'freeform',
  },
]

// IDs used for validation
export const ALLOWED_PRACTICE_IDS = FAITH_PRACTICE_OPTIONS.map(p => p.id)

// ── Auto-apply dietary restriction mappings ───────────────

export const FAITH_DIET_AUTO_MAPPINGS = {
  kosher_basic: ['no-pork', 'no-shellfish'],
  kosher_traditional: ['no-pork', 'no-shellfish', 'no-dairy-with-meat'],
  kosher_certified: ['no-pork', 'no-shellfish', 'no-dairy-with-meat'],
  halal_basic: ['no-pork', 'no-alcohol'],
  halal_certified_meat: ['no-pork', 'no-alcohol'],
  halal_full: ['no-pork', 'no-alcohol'],
  hindu_beef_free: ['no-beef'],
  hindu_vegetarian: ['vegetarian'],
  hindu_strict: ['vegetarian', 'no-onion', 'no-garlic'],
  jain_standard: ['vegetarian', 'no-eggs'],
  jain_strict: ['vegetarian', 'no-eggs', 'no-potatoes', 'no-onions', 'no-garlic', 'no-carrots', 'no-beets'],
  buddhist_vegetarian: ['vegetarian'],
  buddhist_vegan: ['vegan'],
  buddhist_pungent_free: ['vegan', 'no-garlic', 'no-onion', 'no-leeks', 'no-chives', 'no-shallots'],
  adventist_vegetarian: ['vegetarian', 'no-caffeine', 'no-alcohol'],
  adventist_kosher_style: ['no-pork', 'no-shellfish', 'no-caffeine', 'no-alcohol'],
  ital_basic: ['no-pork'],
  ital_strict: ['vegetarian', 'low-sodium'],
  lds_no_coffee: ['no-coffee', 'no-espresso'],
  lds_no_alcohol: ['no-alcohol', 'no-cooking-wine'],
  lds_no_black_tea: ['no-black-tea'],
  catholic_lenten: [],
  orthodox_fasting: [],
}

// ── Conflict ingredient keywords ──────────────────────────

export const FAITH_CONFLICT_KEYWORDS = {
  'no-pork': ['pork', 'bacon', 'ham', 'prosciutto', 'pancetta', 'lard', 'chorizo', 'salami', 'pepperoni', 'sausage'],
  'no-shellfish': ['shrimp', 'lobster', 'crab', 'clam', 'mussel', 'oyster', 'scallop', 'crawfish', 'crayfish'],
  'no-beef': ['beef', 'steak', 'ground beef', 'brisket', 'veal'],
  'no-alcohol': ['wine', 'beer', 'rum', 'bourbon', 'vodka', 'whiskey', 'brandy', 'champagne', 'sake', 'cooking wine', 'marsala', 'sherry', 'mirin'],
  'no-coffee': ['coffee', 'espresso', 'coffee extract', 'kahlua'],
  'no-black-tea': ['black tea', 'earl grey', 'english breakfast tea', 'chai'],
  'no-onion': ['onion', 'shallot', 'scallion', 'spring onion'],
  'no-garlic': ['garlic'],
  'no-leeks': ['leek', 'leeks'],
  'no-chives': ['chive', 'chives'],
  'no-shallots': ['shallot', 'shallots'],
  'no-eggs': ['egg', 'eggs'],
  'no-potatoes': ['potato', 'potatoes'],
  'no-onions': ['onion', 'onions', 'shallot', 'scallion'],
  'no-carrots': ['carrot', 'carrots'],
  'no-beets': ['beet', 'beets', 'beetroot'],
  'no-dairy-with-meat': [], // Requires recipe-level analysis (meat + dairy in same dish)
  'vegetarian': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'venison', 'fish', 'salmon', 'tuna', 'shrimp', 'lobster', 'crab', 'bacon', 'ham', 'sausage', 'pepperoni', 'anchovy'],
  'vegan': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'shrimp', 'milk', 'cream', 'butter', 'cheese', 'yogurt', 'egg', 'eggs', 'honey', 'gelatin'],
  'no-caffeine': ['coffee', 'espresso', 'black tea', 'green tea', 'matcha', 'cola', 'energy drink'],
  'no-cooking-wine': ['cooking wine', 'wine', 'marsala', 'sherry', 'mirin', 'beer', 'rum', 'bourbon'],
  'no-espresso': ['espresso'],
  'low-sodium': [], // Soft preference, not ingredient-based
}

// ── Alcohol substitution guide ────────────────────────────

export const ALCOHOL_SUBSTITUTIONS = {
  'red wine': 'Beef or vegetable broth with a splash of grape juice or pomegranate juice',
  'white wine': 'Chicken broth with a small squeeze of lemon juice',
  'wine': 'Broth with a splash of grape juice or lemon juice',
  'cooking wine': 'Broth with a splash of grape juice or lemon juice',
  'marsala': 'Chicken broth with a splash of grape juice',
  'sherry': 'Apple cider vinegar mixed with broth',
  'beer': 'Beef broth or apple juice depending on the dish',
  'rum': 'Apple juice or non-alcoholic vanilla extract for sweet dishes',
  'bourbon': 'Apple juice or non-alcoholic vanilla extract for sweet dishes',
  'vodka': 'Water with a squeeze of lemon',
  'whiskey': 'Apple juice or broth depending on the dish',
  'brandy': 'Apple juice or grape juice',
  'champagne': 'Sparkling white grape juice',
  'sake': 'Rice vinegar diluted with water',
  'mirin': 'Rice vinegar with a pinch of sugar',
}

// ── AI prompt instructions per practice+level ─────────────

export const FAITH_PROMPT_INSTRUCTIONS = {
  kosher_basic: 'Never suggest recipes containing pork, pork products, shellfish, or non-fin fish. Only suggest recipes using permitted meats.',
  kosher_traditional: 'Never suggest recipes containing pork, pork products, shellfish, or non-fin fish. Only suggest recipes using permitted meats. Never suggest recipes that combine meat and dairy ingredients in the same dish. Flag any recipe where meat and dairy appear together.',
  kosher_certified: 'Never suggest recipes containing pork, pork products, shellfish, or non-fin fish. Only suggest recipes using permitted meats. Never suggest recipes that combine meat and dairy ingredients in the same dish. Flag any recipe where meat and dairy appear together. When suggesting packaged or processed ingredients note that they should carry kosher certification. Flag any recipe that uses processed ingredients that may not be available in certified kosher versions.',
  halal_basic: 'Never suggest recipes containing pork, pork products, or alcohol as a cooking ingredient.',
  halal_certified_meat: 'Never suggest recipes containing pork, pork products, or alcohol as a cooking ingredient. When suggesting recipes with meat note that halal-certified meat should be used.',
  halal_full: 'Never suggest recipes containing pork, pork products, or alcohol as a cooking ingredient. When suggesting recipes with meat note that halal-certified meat should be used. All ingredients and preparation methods must comply with full halal standards. Flag any recipe where ingredient sourcing matters.',
  hindu_beef_free: 'Never suggest recipes containing beef or beef products. The cow is sacred in this household.',
  hindu_vegetarian: 'This household is vegetarian. Never suggest recipes containing meat, poultry, or seafood of any kind.',
  hindu_strict: 'This household is vegetarian. Never suggest recipes containing meat, poultry, or seafood of any kind. Also avoid onion and garlic in meal suggestions particularly during religious observances.',
  jain_standard: 'This household is Jain. Never suggest recipes containing meat, fish, eggs, or any animal flesh.',
  jain_strict: 'This household is Jain. Never suggest recipes containing meat, fish, eggs, or any animal flesh. Also avoid root vegetables including potatoes, onions, garlic, carrots, and beets.',
  buddhist_vegetarian: 'This household follows Buddhist vegetarian practice. Never suggest recipes containing meat or fish.',
  buddhist_vegan: 'This household follows Buddhist vegan practice. Never suggest recipes containing any animal products.',
  buddhist_pungent_free: 'This household follows Buddhist vegan practice. Never suggest recipes containing any animal products. Also avoid garlic, onion, leeks, chives, and shallots.',
  adventist_vegetarian: 'This household follows Seventh-day Adventist dietary principles. Prefer vegetarian recipes and avoid caffeine and alcohol.',
  adventist_kosher_style: 'This household follows Seventh-day Adventist dietary principles. Never suggest pork, shellfish, caffeine, or alcohol.',
  orthodox_fasting: 'This household observes Eastern Orthodox fasting periods. On fasting days avoid meat, dairy, fish, wine, and oil. On strict fasting days suggest only plant-based meals with no oil.',
  catholic_lenten: 'This household observes Catholic Lenten practices. On Fridays during Lent and on Ash Wednesday and Good Friday, never suggest meat. Always suggest fish or vegetarian alternatives on these days.',
  ital_basic: 'This household follows Rastafari Ital dietary principles. Avoid pork and minimize processed or artificial ingredients.',
  ital_strict: 'This household follows strict Ital dietary principles. Avoid all meat, avoid salt, and use only natural unprocessed ingredients.',
  lds_no_coffee: 'This household follows the Word of Wisdom health code of the Church of Jesus Christ of Latter-day Saints and avoids coffee. Never suggest recipes that include coffee, espresso, coffee extract, or coffee-flavored ingredients in any form.',
  lds_no_alcohol: 'This household avoids alcohol in all forms including alcohol used in cooking. Never suggest recipes that use wine, beer, spirits, cooking wine, or any alcoholic ingredient. Always suggest non-alcoholic substitutions such as grape juice for wine or broth for beer.',
  lds_no_black_tea: 'This household avoids black tea including black tea used in cooking or marinades. Green tea, herbal teas, and rooibos are acceptable and are not restricted.',
}

// General instruction prepended when any faith practice is active
export const FAITH_GENERAL_INSTRUCTION = 'This household observes faith-based dietary practices. Treat all faith-based dietary requirements with the same seriousness as medical allergies. Never suggest meals that violate these practices and never suggest substitutions that would compromise their observance.'
