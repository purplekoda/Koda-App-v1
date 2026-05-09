const responses = {
  dashboard: [
    {
      text: "Good choice to plan ahead! Based on your family\u2019s preferences, I\u2019d suggest keeping Tuesday\u2019s taco night and adding a quick stir fry for Thursday.",
      chips: ['Plan this week', 'Show meal suggestions', 'Check pantry'],
    },
    {
      text: "Emma\u2019s birthday is in 12 days! Want me to help plan the menu? I can suggest kid-friendly options that work with dietary restrictions.",
      chips: ['Plan birthday menu', 'See party checklist', 'Set reminder'],
    },
    {
      text: "You have 3 items expiring in the next 2 days. I can suggest dinner ideas that use them up tonight.",
      chips: ['Show expiring items', 'Suggest dinner', 'Add to grocery list'],
    },
  ],
  meals: [
    {
      text: "For tonight\u2019s dinner, I\u2019d recommend the chicken stir fry \u2014 you already have most ingredients, and it\u2019s ready in 25 minutes.",
      chips: ['Add to tonight', 'See other options', 'Check ingredients'],
    },
    {
      text: "I noticed Thursday doesn\u2019t have a lunch planned. Based on leftovers from Wednesday\u2019s salmon, how about a salmon rice bowl?",
      chips: ['Fill Thursday lunch', 'Fill all empty slots', 'Show suggestions'],
    },
    {
      text: "This week\u2019s meals are well-balanced! You have good protein variety across the week. Want me to optimize for prep time?",
      chips: ['Optimize prep time', 'Show nutrition', 'Swap a meal'],
    },
  ],
  grocery: [
    {
      text: "I found 17 items you need this week. 8 items you already have at home. Want me to check if Target has everything in stock?",
      chips: ['Check Target stock', 'Find substitutions', 'Compare store prices'],
    },
    {
      text: "Tip: Salmon fillets are on sale at Target this week. Good timing since you need them for Wednesday\u2019s dinner!",
      chips: ['Add to cart', 'Show all deals', 'Set price alert'],
    },
  ],
  kitchen: [
    {
      text: "Based on what\u2019s in your fridge, I\u2019d prioritize using the chicken breast and avocados \u2014 they expire tomorrow. Chicken avocado salad is a quick 15-minute option!",
      chips: ['Make this tonight', 'See more ideas', 'What else is expiring?'],
    },
    {
      text: "Your pantry is well-stocked with staples. You could make 4 complete meals without buying anything new!",
      chips: ['Show pantry meals', 'Scan again', 'Update pantry'],
    },
  ],
  default: [
    {
      text: "I can help with meal planning, grocery lists, pantry management, and family scheduling. What would you like to do?",
      chips: ['Plan meals', 'Make grocery list', 'Scan pantry', 'See schedule'],
    },
  ],
}

// Mock meal edit suggestions keyed by item type
const mockSuggestions = {
  bread: {
    item_name: 'Garlic Bread',
    description: 'Crispy garlic bread pairs perfectly with pasta dishes and uses butter and garlic you already have.',
    cook_time: '12 minutes',
    pantry_match: true,
    ingredients_needed: [],
    item_type: 'bread',
  },
  side_dish: {
    item_name: 'Roasted Broccoli with Lemon',
    description: 'A simple, nutritious side that complements protein-heavy mains with a bright citrus finish.',
    cook_time: '20 minutes',
    pantry_match: false,
    ingredients_needed: ['broccoli', 'lemon'],
    item_type: 'side_dish',
  },
  dessert: {
    item_name: 'Cinnamon Apple Slices',
    description: 'A light, naturally sweet dessert that uses pantry staples and takes almost no effort.',
    cook_time: '10 minutes',
    pantry_match: false,
    ingredients_needed: ['apple'],
    item_type: 'dessert',
  },
  drink: {
    item_name: 'Fresh Lemonade',
    description: 'A refreshing homemade lemonade that balances rich or spicy meals perfectly.',
    cook_time: '5 minutes',
    pantry_match: false,
    ingredients_needed: ['lemons', 'sugar'],
    item_type: 'drink',
  },
  appetizer: {
    item_name: 'Bruschetta',
    description: 'Fresh tomato bruschetta adds a light, flavorful start that complements Italian-inspired meals.',
    cook_time: '10 minutes',
    pantry_match: false,
    ingredients_needed: ['tomatoes', 'baguette', 'basil'],
    item_type: 'appetizer',
  },
}

function getMockMealEditResponse(intent) {
  const suggestion = mockSuggestions[intent.itemType] || mockSuggestions.side_dish
  const day = intent.day || 'Wed'
  const mealType = intent.mealType || 'dinner'

  return {
    text: `How about ${suggestion.item_name}? ${suggestion.description}`,
    chips: [],
    card: {
      type: 'meal_suggestion',
      day,
      mealType,
      targetSlotType: intent.itemType === 'dessert' ? 'dinner_dessert' : 'sides',
      suggestion,
    },
  }
}

function getMockSwapResponse(intent) {
  const day = intent.day || 'Tue'
  const mealType = intent.mealType || 'lunch'
  return {
    text: `I'd be happy to swap ${day}'s ${mealType}! Would you like to use ingredients you already have in your pantry, or are you open to purchasing new ingredients for this swap?`,
    chips: ['Use pantry ingredients', 'Open to new ingredients', 'Never mind'],
  }
}

function getMockSurpriseMeResponse() {
  return {
    text: "I love your sense of adventure! Before I find something exciting, which path would you like?\n\n**Path A** — Use what I already have: I'll find a trending recipe using mostly ingredients you've already got.\n\n**Path B** — Something new and popular: I'll find a viral recipe that's blowing up right now, even if you need to shop for it.\n\nWhich sounds good?",
    chips: ['Use what I already have', 'Something new and popular'],
  }
}

function getMockPlanWeekResponse() {
  return {
    text: "Let's plan your week! How would you like me to do it? I can use your Recipe Box, search online for new ideas, or a mix of both — or I can just fill it all in for you. What sounds good?",
    chips: ['Use my Recipe Box', 'Search online', 'Mix of both', 'Fill it all for me'],
  }
}

export function getMockAIResponse(context, query, intent) {
  // If a meal-edit intent was detected, return a suggestion card
  if (intent && intent.intent === 'add_accompaniment') {
    return getMockMealEditResponse(intent)
  }

  if (intent && intent.intent === 'swap_item') {
    return getMockSwapResponse(intent)
  }

  if (intent && intent.intent === 'surprise_me') {
    return getMockSurpriseMeResponse()
  }

  if (intent && intent.intent === 'plan_week') {
    return getMockPlanWeekResponse()
  }

  const contextResponses = responses[context] || responses.default

  // Simple keyword matching for more relevant responses
  if (query) {
    const lower = query.toLowerCase()
    if (lower.includes('dinner') || lower.includes('tonight')) {
      return responses.kitchen?.[0] || contextResponses[0]
    }
    if (lower.includes('grocery') || lower.includes('buy') || lower.includes('shop')) {
      return responses.grocery?.[0] || contextResponses[0]
    }
    if (lower.includes('pantry') || lower.includes('fridge') || lower.includes('expir')) {
      return responses.kitchen?.[0] || contextResponses[0]
    }
    if (lower.includes('meal') || lower.includes('plan') || lower.includes('week')) {
      return responses.meals?.[0] || contextResponses[0]
    }
  }

  // Random response from context
  const idx = Math.floor(Math.random() * contextResponses.length)
  return contextResponses[idx]
}
