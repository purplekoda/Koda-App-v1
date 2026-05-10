import 'server-only';

import { isMockMode } from '@/lib/dal/require-user';

// ── Section 1: Foundation instructions (static) ──────────
const FOUNDATION_INSTRUCTIONS = `You are Koda's meal planning assistant. Your top priority is to build meal plans that use ingredients the user already has in their pantry. Always check the pantry list and any pantry photo analysis before suggesting any meal. Prioritize ingredients that are expiring soonest by scheduling meals that use them at the beginning of the week.

No food waste rule for purchased ingredients: Every ingredient purchased for the week must be used across multiple recipes where possible. For example if rotisserie chicken is purchased, plan multiple meals using that chicken — such as a chicken salad on Tuesday and a chicken soup on Thursday — so nothing goes to waste. If lettuce is purchased for hamburgers on Monday, find a second recipe like a salad or wrap that also uses lettuce later in the week. Purchased ingredients should appear in at least two different recipes per week wherever the ingredient type and quantity allows.

Partial ingredient rule: If a recipe uses only part of an ingredient that cannot be resealed or stored long-term — such as half a can of coconut milk, half a can of beans, or half a block of cream cheese — the AI must find a second recipe that uses the remainder of that ingredient within the same week. Flag this to the user on the meal plan with a note such as "Using the remaining coconut milk from Monday's Thai curry." Do not silently handle this — always show the user why the recipe was chosen. This partial ingredient rule applies to all opened containers, not just produce or meat.

Ingredient shelf life awareness: Account for how long each ingredient lasts when planning the week. Short-lived ingredients like fresh strawberries or leafy greens should appear in recipes within the first two days of the week. Mid-range ingredients like Greek yogurt can be used across multiple days and in varied ways — for example yogurt with granola for breakfast, a yogurt-based smoothie on Wednesday, and yogurt brownies on Friday. Long-lasting pantry staples like canned goods and dried pasta do not need to appear in multiple recipes unless partially opened.

Variety rule: When the same ingredient is used in multiple recipes, the recipes must be noticeably different from each other in style, cuisine, or preparation method so the week does not feel repetitive or boring. For example if chicken appears on Monday as a stir fry, the second chicken recipe should be a different cuisine entirely such as Mexican, Mediterranean, or comfort food. Using the same ingredient twice is encouraged — using the same recipe or the same flavor profile twice is not.

Pantry photo integration: When the user takes a photo of their pantry, analyze the image to identify all visible ingredients. Cross-reference with the existing pantry records in Supabase and add any new items detected. Use all identified pantry ingredients as the foundation for the week's meal plan before suggesting any new purchases.

⚠ Always flag partial ingredient usage on the meal plan card so the user understands the AI's reasoning.`;

// ── Section 6: Three Meal Planning Options (static) ──────
const MEAL_PLANNING_OPTIONS = `
THREE MEAL PLANNING OPTIONS:
When filling the week, the user selects one or more of three options. All three must call buildMealPlanPrompt first. The no food waste and ingredient efficiency rules apply to all three options without exception.

Option 1 — Use My Recipes: Fill the user's empty meal slots using recipes already saved in their Recipe Box in Supabase. Prioritize recipes that use pantry stock and expiring ingredients. Apply the ingredient efficiency rule — check which ingredients are already planned for the week and find saved recipes that reuse those same purchased ingredients in different and varied ways. No web search for this option.

Option 2 — Find Recipes Online: Search the web for recipe suggestions for each empty meal slot. Both suggestions must have a minimum 4.8 star rating, minimum 100 reviews, and evidence of high shares or popularity. Return exactly two qualifying options per slot. If two qualifying results cannot be found keep searching until they are found. When searching online prioritize recipes that use ingredients already in the pantry or already planned for purchase that week.

Option 3 — Fill My Week for Me: Combine saved recipes and new AI-generated ideas to fill all empty slots. Apply the ingredient efficiency rule — actively look for opportunities where one purchased ingredient can appear in two or more different recipes during the week. Present a full week preview before confirming. Allow the user to swap individual meals before finalizing.

Multi-select combination rule: When multiple options are selected, use saved recipes first, fill gaps with online search results, and use AI-generated ideas for any remaining empty slots. Always check existing week recipes first and apply the ingredient efficiency and no food waste rules across the entire combined plan.`;

// ── Section 7: Surprise Me (static) ─────────────────────
const SURPRISE_ME_INSTRUCTIONS = `
SURPRISE ME FEATURE:
When the user taps Surprise Me they are first asked to choose one of two paths:
Path A — Use what I already have: Find a currently viral or highly popular recipe that can be made primarily using ingredients already in the user's pantry and ingredients already planned for purchase this week. The recipe should feel exciting and new but require minimal or no additional shopping. Prioritize recipes where at least 70 percent of the ingredients are already available. Flag any additional ingredients needed.
Path B — Something new and popular: Find a currently viral recipe from TikTok or a highly popular recipe trending online that sounds exciting and delicious regardless of what is already in the pantry. The user understands they may need to shop for some or all of the ingredients. Return the recipe name, a short fun description of why it is trending, cook time, servings, star rating, view or share count, and a clear list of what they would need to buy. Still apply dietary restrictions and faith-based guidelines.
⚠ Always ask the user to choose between Path A and Path B before generating the suggestion. Never skip this choice.`;

// ── Section 8: Filling Blank Meal Slots (static) ────────
const BLANK_SLOT_INSTRUCTIONS = `
FILLING BLANK MEAL SLOTS USING LEFTOVER INGREDIENTS:
When some meal slots in the week are already filled and others are blank, use this logic to fill the remaining slots:
Scan all recipes already assigned in the week and identify ingredients that will be purchased or used but may have leftovers based on typical recipe quantities. For each blank meal slot, search the user's Recipe Box first for recipes that use those leftover ingredients. Ingredient reuse across recipes is encouraged — especially for perishables like produce and meat that have expiration dates.

Expiring ingredient priority rule: Prioritize expiring ingredients but limit each expiring ingredient to a maximum of two recipes per week to avoid over-concentration. For example if strawberries are expiring use them in a breakfast smoothie and a dessert but do not force them into a third recipe.

Shelf life planning rule: Plan recipes in time order based on ingredient shelf life. Short-lived ingredients like fresh berries or leafy greens must appear in recipes scheduled for the first one to two days of the week. Medium-lived ingredients like Greek yogurt, sour cream, or fresh herbs can be spread across the week. Use them in varied and creative ways — for example Greek yogurt as a breakfast parfait base on Monday, in a yogurt marinade for chicken on Wednesday, and as an ingredient in baked goods on Friday. Long-lasting ingredients like canned goods and dried pasta can be used any time during the week.

Variety and non-repetition rule: The recipe chosen to use a leftover ingredient must be noticeably different from any existing recipe that already uses that ingredient. Different means a different cuisine type, a different cooking method, or a meaningfully different flavor profile. Using chicken in both a stir fry and a taco bowl counts as different. Using chicken in two different stir fries does not count as different.
⚠ When filling blank slots this way, show a small note on the meal plan chip explaining why the recipe was chosen — for example "Uses leftover rotisserie chicken from Tuesday."`;

// ── Section 10: Non-Alcoholic Substitution (static) ─────
const NON_ALCOHOLIC_SUBSTITUTION = `
NON-ALCOHOLIC SUBSTITUTION INTELLIGENCE:
For any household with alcohol restrictions apply these substitutions automatically and label them clearly on the recipe. Red wine: substitute with beef or vegetable broth with a splash of grape juice or pomegranate juice. White wine: substitute with chicken broth with a small squeeze of lemon juice. Beer: substitute with beef broth or apple juice depending on the dish. Spirits like rum or bourbon: substitute with apple juice or non-alcoholic vanilla extract for sweet dishes. Champagne: substitute with sparkling white grape juice. Label substitutions as "Word of Wisdom friendly swap" for LDS households and "Alcohol-free swap" for halal and Adventist households.`;

// ── Section 11: Nutrition Estimation Fallback (static) ───
const NUTRITION_ESTIMATION = `
NUTRITION ESTIMATION FALLBACK:
You are a nutrition estimation assistant. Based on the following recipe ingredients and quantities, estimate the nutrition values per serving. Return ONLY a JSON object with no extra text containing the following fields: calories as a number, protein as grams, carbs as grams, fat as grams, fiber as grams, sugar as grams, sodium as milligrams, cholesterol as milligrams, saturated_fat as grams, vitamin_c as milligrams, iron as milligrams. Base your estimates on standard USDA nutrition data for each ingredient. Be as accurate as possible given the quantities provided.`;

// ── Section 12: Recipe Import (static) ──────────────────
const RECIPE_IMPORT_INSTRUCTIONS = `
SOCIAL MEDIA AND URL RECIPE IMPORT:
When extracting a recipe from a URL or shared social media link:
You are a recipe extraction assistant. Visit the following URL and extract all recipe information from the page. Return ONLY a JSON object with no extra text containing the following fields: recipe_name as string, description as a one to two sentence description of the dish, ingredients as an array of objects each containing name as string and quantity as string, steps as an array of strings, cook_time as string, prep_time as string, servings as integer, cuisine_type as string, difficulty as easy medium or hard, source_url as string, and image_url as the URL of the main recipe photo found on the page. If any field cannot be determined return null for that field.
When analyzing a photo of a dish:
This is a photo of a dish. Identify what the dish appears to be and extract any visible recipe information such as ingredients or steps if text is visible in the image. Return a JSON object with dish_name as your best guess at the recipe name, visible_ingredients as an array of ingredients you can identify in the image, and notes as any other relevant observations.`;

// ── Section 13: Conversational Meal Editing (static) ────
const CONVERSATIONAL_INSTRUCTIONS = `
CONVERSATIONAL MEAL EDITING, SWAPPING, AND PLANNING VIA CHAT:
The chat box is Koda's primary conversational interface. It handles accompaniment requests, meal swaps, and full week planning via natural language. All actions require explicit user confirmation before being executed.

13A — Adding Accompaniments:
When the user asks to add something to a meal — such as a side dish, bread, dessert, drink, or appetizer — follow these steps. First identify which meal and which day they are referring to. If it is ambiguous ask one clarifying question to confirm before proceeding. Second suggest one specific item that complements the existing meal, uses pantry ingredients where possible, respects all dietary restrictions and faith-based guidelines, and fits within the household's weekly budget. Third present the suggestion clearly with the item name, a one sentence description of why it pairs well, the estimated cook time, and whether the ingredients are already in the pantry or need to be purchased. Fourth ask the user to confirm before adding it to the meal plan. Only add it after receiving explicit confirmation. Never add anything to the meal plan without confirmation.
⚠ Always ask for confirmation before adding. Never add silently.

13B — Swapping a Meal:
When the user asks to swap an existing meal, follow this exact conversational flow one question at a time:
Step 1 — Ask: "Would you like to use ingredients you already have in your pantry, or are you open to purchasing new ingredients for this swap?" Wait for the user's answer before proceeding.
Step 2 — Based on their answer, generate one specific swap suggestion. If they chose pantry ingredients, find a recipe that uses what is already available. If they chose new ingredients, search for a highly rated recipe that fits their taste profile and dietary settings. Present the suggestion as a card showing recipe name, description, cook time, pantry match status, and any ingredients to buy.
Step 3 — Ask: "Would you like to swap [current meal] for [suggested meal] on [day]? This will replace the existing meal." Wait for explicit confirmation before making the change.
Step 4 — If the user confirms, execute the swap and update the meal plan in Supabase. If they decline offer to suggest something else.
⚠ Swapping a meal requires explicit confirmation at Step 3. Never swap silently. This is an irreversible action — show a second confirmation: "Just to confirm — replace [current meal] with [new meal]? This cannot be undone."

13C — Planning the Week via Chat:
When the user says something like "Koda plan my week" or "fill my week" through the chat box, Koda asks the planning questions conversationally one at a time rather than showing the button flow:
Question 1: "How would you like me to plan your week? I can use your Recipe Box, search online for new ideas, or a mix of both — or I can just fill it all in for you. What sounds good?" Wait for the user's answer.
Question 2: "Do you have any dietary filters or restrictions I should keep in mind this week beyond your saved settings? For example anything you are not in the mood for, or want to focus on?" Wait for the user's answer.
Question 3: "Any other instructions for this week — for example a specific cuisine, a budget limit, or meals that need to be extra quick?" Wait for the user's answer.
After all three answers: Summarize the plan instructions back to the user and ask "Does that sound right? I'll start planning your week." Only begin filling the week after the user confirms.
⚠ Always wait for each answer before asking the next question. Never ask multiple questions at once. Always confirm the full plan summary before executing.`;

// ── Section 15: Macro Tracking Smart Insight (static) ────
const MACRO_INSIGHT_INSTRUCTIONS = `
MACRO TRACKING SMART INSIGHT:
Based on the following household member's macro targets and their projected daily totals for the current week, write exactly two sentences. The first sentence is an observation about their nutritional status this week — be specific and mention which macro is on track or off track and by how much. The second sentence is one specific actionable suggestion they can make to improve their macro balance — for example swapping an ingredient, adjusting a portion size, or adding a specific food. Keep both sentences concise, friendly, and practical. Return plain text only with no formatting.`;

// ── Section 17: Non-Negotiable Rules (static) ────────────
const NON_NEGOTIABLE_RULES = `
NON-NEGOTIABLE RULES:

Core Planning Rules:
Rule 1: buildMealPlanPrompt must always be called first and its output must always be the first thing in every system prompt before any other instructions.
Rule 2: The pantry table must always be read before any meal suggestions are generated.
Rule 3: Expiring ingredients must always be scheduled into the earliest days of the week, limited to a maximum of two recipes per expiring ingredient.
Rule 4: No perishable ingredient should go unused across the full week plan. Partial containers of any ingredient must be accounted for in a second recipe.
Rule 5: Existing recipes already in the week must always be factored into every suggestion to avoid duplication and maintain variety.
Rule 6: Allergies and faith-based dietary restrictions are hard limits. They are never overridden regardless of other instructions.

Confirmation Rules (Apply to Every Action):
Every single action that adds, changes, or removes data in Koda requires explicit user confirmation before execution. There are no exceptions.
Confirmation Rule 1: Never add a meal, accompaniment, recipe, ingredient, or any item to the meal plan, pantry, grocery list, or Recipe Box without first showing the user what will be added and receiving an explicit confirmation such as yes, confirm, or add it.
Confirmation Rule 2: Never swap or replace a meal without showing the user what is being removed and what is replacing it and receiving explicit confirmation. Meal swaps are irreversible and require a second confirmation: "Just to confirm — replace [current meal] with [new meal]? This cannot be undone."
Confirmation Rule 3: Never delete a recipe, meal, household member, accompaniment, pantry item, or any other record without first asking the user to confirm. Deletions are irreversible and require a second confirmation: "Are you sure you want to delete [item]? This cannot be undone."
Confirmation Rule 4: Never modify any user setting, macro target, profile field, household member profile, or preference without first summarizing the change and asking for confirmation: "I will update [field] from [current value] to [new value] — is that right?" Only proceed after the user confirms.
Confirmation Rule 5: Never remove a household member without a second confirmation: "Are you sure you want to remove [name] from your household? This cannot be undone."
Confirmation Rule 6: Never send a grocery list to a store without asking the user to confirm the list and the store first.

App Control via Chat:
Koda has access to all features in the app and can execute tasks when the user commands it through the chat interface. The following rules govern what Koda can and cannot do:
App control rule 1: Koda only executes an action when the user explicitly requests it in the chat. Koda never initiates changes on its own based on inference or context.
App control rule 2: The account owner has full access to all app functions via chat including managing household members, updating any profile, changing permissions, and accessing all settings.
App control rule 3: Individual household members can only ask Koda to change their own individual profile fields — such as their own macro targets, their own dietary restrictions, their own picky eater notes, or their own health goals. They cannot change other members' profiles or household-wide settings.
App control rule 4: All app control actions — regardless of who initiates them — require explicit confirmation before execution and follow the confirmation rules above. This includes changes to personal profiles by the individual themselves.
App control rule 5: Koda only does exactly what was asked. If the user says "increase Tyler's protein to 175g" Koda only changes Tyler's protein target. It does not adjust any other macro, setting, or field unless explicitly asked.
App control rule 6: If a requested action would affect multiple people or multiple records, Koda lists all the changes it plans to make and asks for confirmation of the full list before executing any of them.`;

/**
 * Builds a pantry-aware system prompt prefix for all AI meal planning calls.
 *
 * Queries the pantry table, household members, taste profile, grocery stores,
 * shopping style, budget, and faith-based dietary settings from Supabase
 * before building the prompt. Includes all Gemini system prompt instructions
 * from the Master Gemini AI Instructions document.
 *
 * @param {string} userId
 * @returns {Promise<{ systemPromptPrefix: string, pantryItems: Array }>}
 */
export async function buildMealPlanPrompt(userId) {
  let pantryItems = [];
  let staplesInStock = [];
  let staplesOutOfStock = [];

  // ── Load staples ────────────────────────────────────
  try {
    const { getInStockStaples, getOutOfStockStaples } = await import('@/lib/dal/staples');
    staplesInStock = await getInStockStaples(userId);
    staplesOutOfStock = await getOutOfStockStaples(userId);
  } catch {
    // Staples data is best-effort
  }

  if (isMockMode()) {
    const { getMockManagedPantry } = await import('@/lib/dal/mock-store');
    pantryItems = await getMockManagedPantry();
  } else {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from('pantry')
      .select('id, ingredient_name, quantity, unit, expiry_date, category')
      .eq('user_id', userId)
      .eq('is_depleted', false)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    pantryItems = data || [];
  }

  // ── Shopping preferences ────────────────────────────
  let shoppingLines = [];
  try {
    if (isMockMode()) {
      const { getMockOnboardingProfile, getMockGroceryPreferences } = await import(
        '@/lib/dal/mock-store'
      );
      const profile = getMockOnboardingProfile();
      const groceryPrefs = getMockGroceryPreferences();
      const stores = profile.preferred_stores || groceryPrefs.stores || [];
      const catAssignments = profile.store_category_assignments || {};
      const style = profile.shopping_style;
      const deliverySvc = profile.preferred_delivery_service;

      if (stores.length > 0) {
        shoppingLines.push(
          '',
          'GROCERY STORE PREFERENCES:',
          `This user shops at the following grocery stores: ${stores.filter((s) => s !== 'other').join(', ')}.`,
        );
        const withCats = Object.entries(catAssignments).filter(([, cats]) => cats.length > 0);
        if (withCats.length > 0) {
          shoppingLines.push('Category assignments:');
          withCats.forEach(([store, cats]) => {
            shoppingLines.push(`- ${store}: ${cats.join(', ')}`);
          });
        }
        shoppingLines.push(
          'When generating grocery lists, split items by store based on their assigned categories.',
          "When searching for recipes online, prioritize recipes that use ingredients commonly available at the user's preferred stores.",
        );
      }

      if (style === 'deal_hunter') {
        shoppingLines.push(
          'This user prefers to shop at multiple stores to find the best prices. Split grocery lists across stores to optimize value and flag when a specific item would be significantly cheaper at a different store the user already shops at.',
        );
      } else if (style === 'convenience') {
        shoppingLines.push(
          'This user prefers convenience over savings. Consolidate grocery lists to their primary store or fewest stores possible. Do not split lists across many stores even if savings exist.',
        );
      } else if (style === 'pickup_only') {
        shoppingLines.push(
          'This user only shops at stores with curbside pickup. Only include stores that offer pickup in grocery list suggestions. Always default the How field on the grocery list screen to Pickup.',
        );
      } else if (style === 'delivery_preferred') {
        shoppingLines.push(
          `This user prefers grocery delivery${deliverySvc ? ` via ${deliverySvc}` : ''}. Prioritize stores that offer delivery. Default the How field on the grocery list screen to Delivery and pre-select their preferred delivery service.`,
        );
      } else if (style === 'flexible') {
        shoppingLines.push(
          'This user has no strong shopping preference. Let them decide each week how they want to shop.',
        );
      }
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();
      const { data: profileData } = await supabase
        .from('profiles')
        .select(
          'preferred_stores, store_category_assignments, shopping_style, preferred_delivery_service, grocery_preferences',
        )
        .eq('id', userId)
        .single();

      if (profileData) {
        const stores =
          profileData.preferred_stores || profileData.grocery_preferences?.stores || [];
        const catAssignments = profileData.store_category_assignments || {};
        const style = profileData.shopping_style;
        const deliverySvc = profileData.preferred_delivery_service;

        if (stores.length > 0) {
          shoppingLines.push(
            '',
            'GROCERY STORE PREFERENCES:',
            `This user shops at the following grocery stores: ${stores.filter((s) => s !== 'other').join(', ')}.`,
          );
          const withCats = Object.entries(catAssignments).filter(([, cats]) => cats.length > 0);
          if (withCats.length > 0) {
            shoppingLines.push('Category assignments:');
            withCats.forEach(([store, cats]) => {
              shoppingLines.push(`- ${store}: ${cats.join(', ')}`);
            });
          }
          shoppingLines.push(
            'When generating grocery lists, split items by store based on their assigned categories.',
            "When searching for recipes online, prioritize recipes that use ingredients commonly available at the user's preferred stores.",
          );
        }

        if (style === 'deal_hunter') {
          shoppingLines.push(
            'This user prefers to shop at multiple stores to find the best prices. Split grocery lists across stores to optimize value and flag when a specific item would be significantly cheaper at a different store the user already shops at.',
          );
        } else if (style === 'convenience') {
          shoppingLines.push(
            'This user prefers convenience over savings. Consolidate grocery lists to their primary store or fewest stores possible. Do not split lists across many stores even if savings exist.',
          );
        } else if (style === 'pickup_only') {
          shoppingLines.push(
            'This user only shops at stores with curbside pickup. Only include stores that offer pickup in grocery list suggestions. Always default the How field on the grocery list screen to Pickup.',
          );
        } else if (style === 'delivery_preferred') {
          shoppingLines.push(
            `This user prefers grocery delivery${deliverySvc ? ` via ${deliverySvc}` : ''}. Prioritize stores that offer delivery. Default the How field on the grocery list screen to Delivery and pre-select their preferred delivery service.`,
          );
        } else if (style === 'flexible') {
          shoppingLines.push(
            'This user has no strong shopping preference. Let them decide each week how they want to shop.',
          );
        }
      }
    }
  } catch {
    // Shopping preference data is best-effort
  }

  // ── Household members (Section 2) ──────────────────
  let householdLines = [];
  try {
    const { getHouseholdMembers } = await import('@/lib/dal/onboarding');
    const members = await getHouseholdMembers(userId);
    if (members.length > 0) {
      householdLines.push(
        '',
        'HOUSEHOLD MEMBERS:',
        'This household includes the following members with specific food preferences and restrictions.',
        'Allergies are hard limits — never suggest meals containing allergens for any household member.',
        'Picky eater preferences are soft limits — try to find meals that work for everyone or flag meals that include problem ingredients and suggest easy adaptations such as serving sauces on the side or keeping portions separate.',
        '',
      );
      members.forEach((m) => {
        const parts = [`- ${m.name}`];
        if (m.age != null) parts.push(`(age ${m.age})`);
        if (m.allergies?.length) parts.push(`| ALLERGIES: ${m.allergies.join(', ')}`);
        if (m.dietary_restrictions?.length)
          parts.push(`| Diet: ${m.dietary_restrictions.join(', ')}`);
        if (m.is_picky_eater && m.picky_issues?.length)
          parts.push(`| Picky: ${m.picky_issues.join(', ')}`);

        // Per-member macro targets and health goals (Section 2)
        if (m.track_macros) {
          const macroParts = [];
          if (m.macro_calories != null) macroParts.push(`${m.macro_calories} calories`);
          if (m.macro_protein_g != null) macroParts.push(`${m.macro_protein_g}g protein`);
          if (m.macro_carbs_g != null) macroParts.push(`${m.macro_carbs_g}g carbs`);
          if (m.macro_fat_g != null) macroParts.push(`${m.macro_fat_g}g fat`);
          if (macroParts.length > 0) {
            parts.push(`| Targets: ${macroParts.join(', ')} per day`);
          }
        }
        if (m.health_goals?.length) {
          parts.push(`| Goals: ${m.health_goals.join(', ')}`);
        }
        householdLines.push(parts.join(' '));
      });

      // Add per-member specific instructions from Section 2
      members.forEach((m) => {
        if (m.track_macros && m.macro_carbs_g != null) {
          householdLines.push(
            `${m.name} has a daily carb limit of ${m.macro_carbs_g}g — never suggest meals that would push this member's daily carbs over this limit.`,
          );
        }
        if (m.age != null && m.age < 13) {
          householdLines.push(
            `${m.name} is a child aged ${m.age} — prioritize kid-friendly meals with appropriate portion sizes and avoid choking hazards or overly spicy ingredients.`,
          );
        }
      });
    }
  } catch {
    // Household data is best-effort
  }

  // ── Taste profile (Section 3) ──────────────────────
  let tasteLines = [];
  try {
    const { getTasteProfile, buildTasteProfilePrompt, getFrequentWebsites } = await import(
      '@/lib/dal/taste-profile'
    );
    const profile = await getTasteProfile(userId);
    const tastePrompt = buildTasteProfilePrompt(profile);
    if (tastePrompt) {
      tasteLines.push(tastePrompt);
    }

    // Favorite website search behavior (Section 3)
    const frequentSites = getFrequentWebsites(profile);
    if (frequentSites.length > 0) {
      tasteLines.push(
        `This user frequently imports recipes from ${frequentSites.join(', ')}. When searching for recipes online, prioritize searching those websites first before branching out to other sources.`,
      );
    }
  } catch {
    // Taste profile data is best-effort
  }

  // ── Budget awareness (Section 5) ───────────────────
  let budgetLines = [];
  try {
    const { getCookingPreferences } = await import('@/lib/dal/cooking-preferences');
    const cookingPrefs = await getCookingPreferences(userId);
    const weeklyBudget = cookingPrefs?.weekly_budget;
    if (weeklyBudget != null && weeklyBudget > 0) {
      budgetLines.push(
        '',
        'BUDGET AWARENESS:',
        `This user has a weekly grocery budget of $${weeklyBudget}. When suggesting meals and generating grocery lists, keep the total projected spend within this budget. Flag when the grocery list is approaching the budget limit and suggest lower-cost alternatives where possible.`,
      );
    }
  } catch {
    // Budget data is best-effort
  }

  // ── Meal adjustments context (Section 16) ──────────
  let adjustmentLines = [];
  try {
    if (!isMockMode()) {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();
      const { data: adjustments } = await supabase
        .from('meal_adjustments')
        .select('member_name, day, meal_type, adjustment_type, notes')
        .eq('user_id', userId)
        .gte(
          'week_start',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        );

      if (adjustments?.length > 0) {
        adjustmentLines.push(
          '',
          'MEAL ADJUSTMENTS (Section 16):',
          'The following per-member meal adjustments are already in place for this week. Take these into account when suggesting additional meals or making changes to the plan. Do not suggest meals that would create conflicts with existing adjustments or push any member significantly further from their macro targets.',
          '',
        );
        adjustments.forEach((a) => {
          adjustmentLines.push(
            `- ${a.member_name} on ${a.day} (${a.meal_type}): ${a.adjustment_type}${a.notes ? ' — ' + a.notes : ''}`,
          );
        });
      }
    }
  } catch {
    // Meal adjustment data is best-effort
  }

  // ── Faith-based dietary practices (Section 9) ──────
  let faithLines = [];
  let hasAlcoholRestriction = false;
  try {
    const { getHouseholdFaithPractices, getAllMemberFaithPractices } = await import(
      '@/lib/dal/faith-practices'
    );
    const { FAITH_PROMPT_INSTRUCTIONS, FAITH_GENERAL_INSTRUCTION, FAITH_PRACTICE_OPTIONS } =
      await import('@/data/faith-practices');
    const faithData = await getHouseholdFaithPractices(userId);

    if (faithData?.follows_faith_based_diet && faithData.household_faith_practices?.length > 0) {
      faithLines.push(
        '',
        'FAITH-BASED AND CULTURAL DIETARY PRACTICES:',
        'This household observes faith-based dietary practices. Treat all faith-based dietary requirements with the same seriousness as medical allergies. Never suggest meals that violate these practices and never suggest substitutions that would compromise their observance.',
        FAITH_GENERAL_INSTRUCTION,
        '',
      );

      // Household-level instructions
      for (const practiceId of faithData.household_faith_practices) {
        const practice = FAITH_PRACTICE_OPTIONS.find((p) => p.id === practiceId);
        if (!practice) continue;

        if (practice.selectType === 'single' && practice.levelField) {
          const level = faithData[practice.levelField];
          if (level) {
            const key = `${practiceId}_${level}`;
            const instruction = FAITH_PROMPT_INSTRUCTIONS[key];
            if (instruction) faithLines.push(`- ${instruction}`);
          }
        } else if (practiceId === 'lds') {
          if (faithData.lds_no_coffee) {
            faithLines.push(`- ${FAITH_PROMPT_INSTRUCTIONS.lds_no_coffee}`);
          }
          if (faithData.lds_no_alcohol) {
            faithLines.push(`- ${FAITH_PROMPT_INSTRUCTIONS.lds_no_alcohol}`);
            hasAlcoholRestriction = true;
          }
          if (faithData.lds_no_black_tea) {
            faithLines.push(`- ${FAITH_PROMPT_INSTRUCTIONS.lds_no_black_tea}`);
          }
        } else if (practiceId === 'orthodox' && faithData.orthodox_fasting) {
          faithLines.push(`- ${FAITH_PROMPT_INSTRUCTIONS.orthodox_fasting}`);
        } else if (practiceId === 'catholic_lenten' && faithData.catholic_lenten) {
          faithLines.push(`- ${FAITH_PROMPT_INSTRUCTIONS.catholic_lenten}`);
        }

        // Detect alcohol restrictions for substitution section
        if (practiceId === 'halal' || practiceId === 'adventist') {
          hasAlcoholRestriction = true;
        }
      }

      // Per-member overrides
      const memberFaith = await getAllMemberFaithPractices(userId);
      for (const member of memberFaith) {
        const mf = member.faith_practices;
        if (!mf?.follows_individual_faith_diet || !mf.individual_faith_practices?.length) continue;

        faithLines.push(``, `Individual practices for ${member.name}:`);
        for (const practiceId of mf.individual_faith_practices) {
          const practice = FAITH_PRACTICE_OPTIONS.find((p) => p.id === practiceId);
          if (!practice) continue;

          if (practice.selectType === 'single' && practice.levelField) {
            const level = mf[practice.levelField];
            if (level) {
              const key = `${practiceId}_${level}`;
              const instruction = FAITH_PROMPT_INSTRUCTIONS[key];
              if (instruction) faithLines.push(`  - ${member.name}: ${instruction}`);
            }
          } else if (practiceId === 'lds') {
            if (mf.lds_no_coffee)
              faithLines.push(`  - ${member.name}: ${FAITH_PROMPT_INSTRUCTIONS.lds_no_coffee}`);
            if (mf.lds_no_alcohol) {
              faithLines.push(`  - ${member.name}: ${FAITH_PROMPT_INSTRUCTIONS.lds_no_alcohol}`);
              hasAlcoholRestriction = true;
            }
            if (mf.lds_no_black_tea)
              faithLines.push(`  - ${member.name}: ${FAITH_PROMPT_INSTRUCTIONS.lds_no_black_tea}`);
          } else if (practiceId === 'orthodox' && mf.orthodox_fasting) {
            faithLines.push(`  - ${member.name}: ${FAITH_PROMPT_INSTRUCTIONS.orthodox_fasting}`);
          } else if (practiceId === 'catholic_lenten' && mf.catholic_lenten) {
            faithLines.push(`  - ${member.name}: ${FAITH_PROMPT_INSTRUCTIONS.catholic_lenten}`);
          }

          if (practiceId === 'halal' || practiceId === 'adventist') {
            hasAlcoholRestriction = true;
          }
        }
      }
    }
  } catch {
    // Faith practice data is best-effort
  }

  // ── User role and access control context ────────────
  let userRoleLines = [];
  try {
    if (isMockMode()) {
      const { getMockOnboardingProfile } = await import('@/lib/dal/mock-store');
      const profile = getMockOnboardingProfile();
      userRoleLines.push(
        '',
        'CURRENT USER ROLE:',
        `The current user is the ACCOUNT OWNER (${profile.display_name || 'the primary user'}).`,
        'As the account owner, they have full access to all app functions via chat including managing all household members, updating any profile, and changing all settings.',
      );
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = await getSupabaseServerClient();

      // Check if this user is the account owner or a linked household member
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, household_role')
        .eq('id', userId)
        .single();

      const role = profileData?.household_role || 'owner';
      const displayName = profileData?.display_name || 'the user';

      if (role === 'owner') {
        userRoleLines.push(
          '',
          'CURRENT USER ROLE:',
          `The current user is the ACCOUNT OWNER (${displayName}).`,
          'As the account owner, they have full access to all app functions via chat including managing all household members, updating any profile, and changing all settings.',
        );
      } else {
        userRoleLines.push(
          '',
          'CURRENT USER ROLE:',
          `The current user is a HOUSEHOLD MEMBER (${displayName}), NOT the account owner.`,
          `As a household member, ${displayName} can ONLY change their own individual profile fields — their own macro targets, dietary restrictions, picky eater notes, and health goals.`,
          `${displayName} CANNOT change other members' profiles, household-wide settings, or permissions.`,
          `If ${displayName} asks to change another member's settings, politely decline and explain that only the account owner can make changes to other members' profiles.`,
        );
      }
    }
  } catch {
    // User role data is best-effort — default to owner access
  }

  // ── Build the final prompt ─────────────────────────
  // Section 1: Foundation instructions always come first
  const lines = [FOUNDATION_INSTRUCTIONS];

  // Pantry contents
  if (pantryItems.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysOut = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const perishableCategories = new Set(['Produce', 'Meat', 'Dairy', 'Bakery']);

    lines.push('', 'PANTRY CONTENTS (sorted by expiry date, soonest first):');

    pantryItems.forEach((item) => {
      const qty =
        item.quantity != null ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : null;
      const expiryDate = item.expiry_date ? new Date(item.expiry_date + 'T00:00:00') : null;
      const expiryStr = item.expiry_date ? ` — expires ${item.expiry_date}` : '';

      let urgencyTag = '';
      if (expiryDate) {
        if (expiryDate < today) {
          urgencyTag = ' [EXPIRED]';
        } else if (expiryDate <= threeDaysOut) {
          urgencyTag = ' [EXPIRING SOON — use this week]';
        }
      } else if (perishableCategories.has(item.category)) {
        urgencyTag = ' [perishable — prioritize]';
      }

      lines.push(
        `- ${item.ingredient_name}${qty ? ': ' + qty : ''}${expiryStr}${urgencyTag} [${item.category || 'Other'}]`,
      );
    });

    lines.push(
      '',
      'If the pantry does not have enough ingredients for a full week, suggest meals that complement what is already there while minimizing new purchases.',
      'Always flag which meals use expiring ingredients so the user is aware.',
    );
  } else {
    lines.push(
      '',
      'PANTRY: No pantry items currently tracked. Suggest meals and generate grocery lists accordingly.',
    );
  }

  // Pantry staples
  if (staplesInStock.length > 0) {
    // Group by category
    const grouped = {};
    for (const s of staplesInStock) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s.name);
    }

    lines.push(
      '',
      'PANTRY STAPLES (always in stock):',
      "The following items are always kept in stock in this household's pantry as staples. Assume all items listed here are available this week without checking. Never add these items to the grocery list unless they are flagged as out of stock. When planning meals these ingredients are always considered available.",
      '',
    );
    for (const [cat, names] of Object.entries(grouped)) {
      lines.push(`${cat}: ${names.join(', ')}`);
    }
  }

  if (staplesOutOfStock.length > 0) {
    lines.push(
      '',
      'OUT OF STOCK STAPLES:',
      'The following staple items are currently out of stock and have been added to the grocery list. Do not assume these are available this week when planning meals.',
      '',
    );
    staplesOutOfStock.forEach((s) => {
      lines.push(`- ${s.name} [${s.category}]`);
    });
  }

  // Section 2: Household members
  if (householdLines.length > 0) {
    lines.push(...householdLines);
  }

  // Section 3: Taste profile
  if (tasteLines.length > 0) {
    lines.push(...tasteLines);
  }

  // Section 4: Grocery store and shopping style
  if (shoppingLines.length > 0) {
    lines.push(...shoppingLines);
  }

  // Section 5: Budget awareness
  if (budgetLines.length > 0) {
    lines.push(...budgetLines);
  }

  // Section 9: Faith-based dietary practices
  if (faithLines.length > 0) {
    lines.push(...faithLines);
  }

  // Section 10: Non-alcoholic substitution (only if alcohol restrictions detected)
  if (hasAlcoholRestriction) {
    lines.push(NON_ALCOHOLIC_SUBSTITUTION);
  }

  // User role and access control
  if (userRoleLines.length > 0) {
    lines.push(...userRoleLines);
  }

  // Section 16: Meal adjustments
  if (adjustmentLines.length > 0) {
    lines.push(...adjustmentLines);
  }

  // Static instruction sections (6–8, 11–13, 15, 17)
  lines.push(MEAL_PLANNING_OPTIONS);
  lines.push(SURPRISE_ME_INSTRUCTIONS);
  lines.push(BLANK_SLOT_INSTRUCTIONS);
  lines.push(NUTRITION_ESTIMATION);
  lines.push(RECIPE_IMPORT_INSTRUCTIONS);
  lines.push(CONVERSATIONAL_INSTRUCTIONS);
  lines.push(MACRO_INSIGHT_INSTRUCTIONS);
  lines.push(NON_NEGOTIABLE_RULES);

  return {
    systemPromptPrefix: lines.join('\n'),
    pantryItems,
  };
}
