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

export function getMockAIResponse(context, query) {
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
