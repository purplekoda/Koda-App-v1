/**
 * Full onboarding conversation — Gemini goal-based flow.
 *
 * A single system prompt drives the entire onboarding conversation.
 * Gemini asks questions naturally and collects all required information.
 * The code only relays messages and watches for the ONBOARDING_COMPLETE signal.
 */

import { FAITH_PRACTICE_OPTIONS } from './faith-practices';

// ── Completion signal ─────────────────────────────────────

export const ONBOARDING_COMPLETION_MARKER = 'ONBOARDING_COMPLETE';

// ── Required items count for progress tracking ────────────

export const REQUIRED_ITEM_COUNT = 18;

// ── Gemini master system prompt ───────────────────────────

const faithList = FAITH_PRACTICE_OPTIONS.map((p) => p.name).join(', ');

export const ONBOARDING_SYSTEM_PROMPT =
  "You are Koda's friendly onboarding assistant. Your job is to have a warm natural conversation with the user to collect all the information Koda needs to set up their account. " +
  'You are the only one asking questions — there are no hardcoded scripts. You decide what to ask and when based on what has and has not been answered yet.\n\n' +
  'You must collect the following information before the onboarding is complete. Do not end the conversation or say you are done until every item marked as required is collected.\n\n' +
  'HOUSEHOLD SECTION — required for all users:\n' +
  '- How many people they are cooking for and whether kids are included.\n' +
  '- The name and age of every household member.\n' +
  '- Verification that the complete family list is correct before moving on.\n' +
  '- For each household member individually — any food allergies, any dietary restrictions or preferences, whether they are a picky eater and if so what specific foods they will not eat, and whether they have any nutrition or macro goals.\n' +
  '- If someone tracks macros, collect specific daily targets for calories, protein (g), carbs (g), and fat (g).\n\n' +
  'SCHEDULE SECTION — required:\n' +
  '- How much time they have to cook on weeknights — under 20 minutes, 20 to 40 minutes, up to an hour, or depends on the day.\n' +
  '- Which days of the week they usually plan meals for (Mon=1 through Sun=7).\n' +
  '- Which days they meal prep on if any.\n\n' +
  'FOOD PREFERENCES SECTION — required:\n' +
  '- What cuisines they love — collect at least two or three.\n' +
  '- How adventurous they are with new recipes — keep it familiar, mix it up, or surprise me.\n' +
  '- Whether they meal prep in batches, cook fresh daily, or a mix of both.\n' +
  '- Their biggest cooking frustrations — collect at least one.\n\n' +
  'BUDGET SECTION — required:\n' +
  '- Their weekly grocery budget as a dollar amount.\n' +
  '- How they prefer to shop — multiple stores for deals, one store for convenience, pickup only, delivery preferred, or flexible.\n' +
  '- Which grocery stores they usually shop at — collect at least one.\n\n' +
  'HEALTH SECTION — required:\n' +
  '- Their primary health goals — weight loss, muscle gain, maintenance, more energy, heart health, blood sugar management, gut health, or just eating well. Collect at least one.\n' +
  '- Whether they track macros — if yes collect daily targets for calories, protein, carbs, and fat.\n' +
  '- If they select blood sugar management ask for their daily carb limit.\n\n' +
  'FAITH SECTION — ask at the end after everything else:\n' +
  '- Whether any household members follow faith-based or cultural dietary practices.\n' +
  '- If yes — whether it applies to the whole household or specific individuals.\n' +
  '- If specific individuals — which ones and what practice they follow.\n' +
  '- For each practice collect the observance level.\n' +
  '- Known faith-based practices include: ' +
  faithList +
  '\n\n' +
  'YOUR RULES:\n' +
  '- Ask questions naturally and conversationally — not like a form. Let the user answer however they want and extract the information from their response.\n' +
  '- Never ask multiple questions at once. Ask one thing at a time and wait for the answer.\n' +
  '- After each answer read back what you understood and ask if it is correct before moving on.\n' +
  '- If an answer is vague or incomplete ask a follow-up question to get the missing detail.\n' +
  '- If the user skips something or gives an incomplete answer come back to it later rather than forcing it immediately.\n' +
  '- Keep track of everything collected so far and always know what is still missing.\n' +
  '- Use a warm friendly tone — like a helpful friend not a corporate form.\n' +
  '- Keep responses concise — 1 to 3 sentences per message.\n' +
  '- When you have collected every required item respond with exactly the phrase ' +
  ONBOARDING_COMPLETION_MARKER +
  ' on its own line followed by a JSON object on the next line containing all collected data.\n' +
  '- Never say ' +
  ONBOARDING_COMPLETION_MARKER +
  ' until every required item is filled.\n\n' +
  'COMPLETION JSON STRUCTURE:\n' +
  'When complete, output the marker on its own line then a JSON object with this exact structure:\n' +
  '{\n' +
  '  "household": {\n' +
  '    "household_size": <int>,\n' +
  '    "household_type": "includes_kids" | "adults_only"\n' +
  '  },\n' +
  '  "members": [\n' +
  '    {\n' +
  '      "name": "string",\n' +
  '      "age": <int|null>,\n' +
  '      "age_group": "adult" | "child",\n' +
  '      "allergies": ["string"] | [],\n' +
  '      "dietary_restrictions": ["string"] | [],\n' +
  '      "is_picky_eater": <bool>,\n' +
  '      "picky_issues": ["string"] | [],\n' +
  '      "track_macros": <bool>,\n' +
  '      "macro_calories": <int|null>,\n' +
  '      "macro_protein_g": <int|null>,\n' +
  '      "macro_carbs_g": <int|null>,\n' +
  '      "macro_fat_g": <int|null>\n' +
  '    }\n' +
  '  ],\n' +
  '  "schedule": {\n' +
  '    "cook_time_preference": "under_20" | "20_to_40" | "up_to_60" | "depends",\n' +
  '    "meal_plan_days": [<int 1-7>],\n' +
  '    "meal_prep_days": [<int 1-7>]\n' +
  '  },\n' +
  '  "food_preferences": {\n' +
  '    "cuisines": ["string"],\n' +
  '    "adventurousness": "familiar" | "mix_it_up" | "surprise_me",\n' +
  '    "meal_prep_style": "meal_prep" | "cook_fresh" | "mix",\n' +
  '    "cooking_frustrations": ["string"]\n' +
  '  },\n' +
  '  "budget": {\n' +
  '    "weekly_budget": <int>,\n' +
  '    "shopping_style": "deal_hunter" | "convenience" | "pickup_only" | "delivery_preferred" | "flexible",\n' +
  '    "preferred_delivery_service": "instacart" | "doordash" | "walmart_plus" | "amazon_fresh" | "other" | null,\n' +
  '    "preferred_stores": ["string"]\n' +
  '  },\n' +
  '  "health": {\n' +
  '    "health_goals": ["string"],\n' +
  '    "daily_carb_limit": <int|null>\n' +
  '  },\n' +
  '  "faith_practices": {\n' +
  '    "has_faith_practices": <bool>,\n' +
  '    "scope": "household" | "individual" | null,\n' +
  '    "practices": [\n' +
  '      {\n' +
  '        "practice_id": "string",\n' +
  '        "practice_name": "string",\n' +
  '        "level": "string" | null,\n' +
  '        "applies_to": ["member_name"] | "all"\n' +
  '      }\n' +
  '    ]\n' +
  '  }\n' +
  '}\n\n' +
  'IMPORTANT: Do NOT include the ' +
  ONBOARDING_COMPLETION_MARKER +
  ' marker until you have confirmed every piece of required information. ' +
  'The marker signals the code to save all data and end the conversation.';

// ── Partial data extraction prompt ────────────────────────

export const PARTIAL_EXTRACTION_PROMPT =
  'Based only on confirmed answers in the conversation so far, return a JSON object with all collected onboarding data. ' +
  'Use null for anything not yet confirmed. Use empty arrays [] for list fields not yet collected. ' +
  'Return ONLY valid JSON with no other text.\n\n' +
  'Structure:\n' +
  '{\n' +
  '  "household_size": <int|null>,\n' +
  '  "household_type": "includes_kids"|"adults_only"|null,\n' +
  '  "members": [{"name":"string","age":<int|null>,"age_group":"adult"|"child"|null,"allergies":[],"dietary_restrictions":[],"is_picky_eater":<bool|null>,"picky_issues":[],"track_macros":<bool|null>}],\n' +
  '  "cook_time_preference": "under_20"|"20_to_40"|"up_to_60"|"depends"|null,\n' +
  '  "meal_plan_days": [<int>]|null,\n' +
  '  "meal_prep_days": [<int>]|null,\n' +
  '  "cuisines": ["string"]|null,\n' +
  '  "adventurousness": "familiar"|"mix_it_up"|"surprise_me"|null,\n' +
  '  "meal_prep_style": "meal_prep"|"cook_fresh"|"mix"|null,\n' +
  '  "cooking_frustrations": ["string"]|null,\n' +
  '  "weekly_budget": <int|null>,\n' +
  '  "shopping_style": "deal_hunter"|"convenience"|"pickup_only"|"delivery_preferred"|"flexible"|null,\n' +
  '  "preferred_stores": ["string"]|null,\n' +
  '  "health_goals": ["string"]|null,\n' +
  '  "daily_carb_limit": <int|null>,\n' +
  '  "faith_practices": {"has_faith_practices":<bool|null>}\n' +
  '}\n\n' +
  'Count how many of these 18 items have been confirmed (non-null, non-empty):\n' +
  'household_size, household_type, at least 1 member name, cook_time_preference, meal_plan_days, ' +
  'cuisines (2+), adventurousness, meal_prep_style, cooking_frustrations (1+), ' +
  'weekly_budget, shopping_style, preferred_stores (1+), health_goals (1+), ' +
  'faith_practices asked, all member allergies confirmed, all member dietary confirmed, ' +
  'all member picky confirmed, meal_prep_days asked.\n' +
  'Add a field "items_confirmed": <int out of 18> to the root of the JSON.';

// ── Mock-mode conversation handler ────────────────────────

const MOCK_RESPONSES = [
  "Hey there! I'm Koda, and I'm so excited to help you get set up. Let's start with the basics — how many people are you cooking for? And does that include any kids?",
  "Got it! Can you tell me everyone's name and roughly how old they are? I want to make sure I've got the whole crew.",
  'Thanks! So I have your household down. Now let me ask about each person — does anyone have food allergies or dietary restrictions I should know about?',
  'Perfect. And are any of them picky eaters? If so, what specific foods do they tend to avoid?',
  "Great, I've got all the household details. Now let's talk schedule — how much time do you usually have to cook on weeknights?",
  'And which days of the week do you usually plan meals for? Do you meal prep on any specific days?',
  'Awesome! Now for the fun part — what cuisines does your household love? Give me a few favorites.',
  'Love those choices! When it comes to trying new recipes, would you say you like to keep things familiar, mix it up sometimes, or are you up for anything?',
  'And do you tend to meal prep in batches, cook fresh every day, or a mix of both?',
  "What's your biggest frustration when it comes to cooking and meal planning?",
  "I hear you. Let's talk grocery budget — roughly how much do you spend per week? And do you prefer shopping around for deals, sticking to one store, doing pickup, or delivery?",
  'Which grocery stores do you usually shop at?',
  'Almost done! Do you have any health goals — like weight loss, muscle gain, more energy, or just eating well?',
  'Last thing — do any household members follow faith-based or cultural dietary practices?',
];

/**
 * Mock conversation for local dev without Gemini API keys.
 */
export function getMockConversationResponse(messages) {
  const userMessages = messages.filter((m) => m.role === 'user');
  const count = userMessages.length;

  if (count === 0) {
    return MOCK_RESPONSES[0];
  }

  // After enough exchanges, complete with mock data
  if (count >= 14) {
    const mockData = {
      household: { household_size: 3, household_type: 'includes_kids' },
      members: [
        {
          name: 'You',
          age: 35,
          age_group: 'adult',
          allergies: [],
          dietary_restrictions: [],
          is_picky_eater: false,
          picky_issues: [],
          track_macros: false,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
        },
        {
          name: 'Partner',
          age: 33,
          age_group: 'adult',
          allergies: [],
          dietary_restrictions: [],
          is_picky_eater: false,
          picky_issues: [],
          track_macros: false,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
        },
        {
          name: 'Kiddo',
          age: 7,
          age_group: 'child',
          allergies: ['Nuts'],
          dietary_restrictions: [],
          is_picky_eater: true,
          picky_issues: ['No vegetables'],
          track_macros: false,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
        },
      ],
      schedule: {
        cook_time_preference: '20_to_40',
        meal_plan_days: [1, 2, 3, 4, 5],
        meal_prep_days: [7],
      },
      food_preferences: {
        cuisines: ['Italian', 'Mexican', 'Thai'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'mix',
        cooking_frustrations: ['deciding', 'food_waste'],
      },
      budget: {
        weekly_budget: 150,
        shopping_style: 'convenience',
        preferred_delivery_service: null,
        preferred_stores: ['Kroger', 'Costco'],
      },
      health: { health_goals: ['just_eating_well', 'more_energy'], daily_carb_limit: null },
      faith_practices: { has_faith_practices: false, scope: null, practices: [] },
    };
    return `You're all set! I have everything I need to build your perfect meal plan.\n\nONBOARDING_COMPLETE\n${JSON.stringify(mockData)}`;
  }

  const idx = Math.min(count, MOCK_RESPONSES.length - 1);
  return MOCK_RESPONSES[idx];
}

/**
 * Mock partial extraction for local dev.
 */
export function getMockPartialExtraction(messages) {
  const userCount = messages.filter((m) => m.role === 'user').length;
  return {
    household_size: userCount >= 1 ? 3 : null,
    household_type: userCount >= 1 ? 'includes_kids' : null,
    members:
      userCount >= 2
        ? [
            {
              name: 'You',
              age: 35,
              age_group: 'adult',
              allergies: [],
              dietary_restrictions: [],
              is_picky_eater: null,
              picky_issues: [],
              track_macros: null,
            },
          ]
        : [],
    cook_time_preference: userCount >= 5 ? '20_to_40' : null,
    meal_plan_days: userCount >= 6 ? [1, 2, 3, 4, 5] : null,
    meal_prep_days: userCount >= 6 ? [7] : null,
    cuisines: userCount >= 7 ? ['Italian', 'Mexican'] : null,
    adventurousness: userCount >= 8 ? 'mix_it_up' : null,
    meal_prep_style: userCount >= 9 ? 'mix' : null,
    cooking_frustrations: userCount >= 10 ? ['deciding'] : null,
    weekly_budget: userCount >= 11 ? 150 : null,
    shopping_style: userCount >= 11 ? 'convenience' : null,
    preferred_stores: userCount >= 12 ? ['Kroger'] : null,
    health_goals: userCount >= 13 ? ['just_eating_well'] : null,
    daily_carb_limit: null,
    faith_practices: userCount >= 14 ? { has_faith_practices: false } : null,
    items_confirmed: Math.min(userCount, 18),
  };
}
