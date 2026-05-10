/**
 * Conversational household member setup — Gemini goal-based flow.
 *
 * Instead of scripted questions, Gemini drives the entire conversation
 * using a system prompt with a required-info checklist. The code only
 * relays messages and watches for the HOUSEHOLD_SETUP_COMPLETE signal.
 */

import { FAITH_PRACTICE_OPTIONS } from './faith-practices';

// ── Gemini system prompt ─────────────────────────────────

const faithList = FAITH_PRACTICE_OPTIONS.map((p) => p.name).join(', ');

export const HOUSEHOLD_SYSTEM_PROMPT =
  "You are Koda's friendly household setup assistant. Your job is to have a natural warm conversation with the user to collect all the required information about every person in their household. " +
  'You must not end this conversation or say you are complete until you have collected the following for every household member — ' +
  'name, age, food allergies or confirmation of none, dietary restrictions or confirmation of none, picky eater issues or confirmation of none, and whether they have nutrition or macro goals. ' +
  'At the very end ask whether any members follow faith-based dietary practices. ' +
  'When you have collected everything for everyone respond with HOUSEHOLD_SETUP_COMPLETE followed by the collected data as JSON. ' +
  'Do not follow any other question script. Do not ask questions in a fixed order. Have a natural conversation and keep asking until you have everything.\n\n' +
  'ADDITIONAL CONTEXT:\n' +
  '- Known faith-based practices include: ' +
  faithList +
  '\n' +
  '- If someone tracks macros, collect specific daily targets for calories, protein (g), carbs (g), and fat (g)\n' +
  '- For picky eaters, collect both foods they avoid and any favorites they love\n' +
  '- Keep responses concise — 1-3 sentences per message. Use a warm, friendly tone.\n\n' +
  'COMPLETION SIGNAL:\n' +
  'When you are completely done with ALL members and the faith question, respond with the exact marker HOUSEHOLD_SETUP_COMPLETE on its own line, ' +
  'followed by a JSON object on the next line containing all collected data. The JSON must have this exact structure:\n' +
  '{\n' +
  '  "members": [\n' +
  '    {\n' +
  '      "name": "string",\n' +
  '      "age": number_or_null,\n' +
  '      "allergies": ["string"] or [],\n' +
  '      "dietary_restrictions": ["string"] or [],\n' +
  '      "is_picky_eater": boolean,\n' +
  '      "picky_issues": ["string"] or [],\n' +
  '      "picky_favorites": ["string"] or [],\n' +
  '      "track_macros": boolean,\n' +
  '      "macro_goal": "string" or null,\n' +
  '      "macro_calories": number_or_null,\n' +
  '      "macro_protein_g": number_or_null,\n' +
  '      "macro_carbs_g": number_or_null,\n' +
  '      "macro_fat_g": number_or_null\n' +
  '    }\n' +
  '  ],\n' +
  '  "faith_practices": {\n' +
  '    "has_faith_practices": boolean,\n' +
  '    "scope": "household" or "individual" or null,\n' +
  '    "practices": [\n' +
  '      {\n' +
  '        "practice_id": "string",\n' +
  '        "practice_name": "string",\n' +
  '        "level": "string" or null,\n' +
  '        "applies_to": ["member_name"] or "all"\n' +
  '      }\n' +
  '    ]\n' +
  '  }\n' +
  '}\n\n' +
  'IMPORTANT: Do NOT include the HOUSEHOLD_SETUP_COMPLETE marker until you have confirmed every piece of required information for every member. ' +
  'The marker signals the code to save all data and end the conversation.';

// ── Partial data extraction prompt ───────────────────────

export const PARTIAL_EXTRACTION_PROMPT =
  'Based on the conversation so far, return a JSON array of household members with whatever information has been confirmed so far. ' +
  'Use null for fields not yet collected. Use empty arrays [] for list fields not yet collected. ' +
  'Return ONLY valid JSON, no other text.\n' +
  'Structure: [{ "name": "string", "age": number|null, "allergies": []|["string"], ' +
  '"dietary_restrictions": []|["string"], "is_picky_eater": boolean|null, ' +
  '"picky_issues": []|["string"], "picky_favorites": []|["string"], ' +
  '"track_macros": boolean|null, "macro_goal": "string"|null, ' +
  '"macro_calories": number|null, "macro_protein_g": number|null, ' +
  '"macro_carbs_g": number|null, "macro_fat_g": number|null }]';

// ── Completion signal ────────────────────────────────────

export const COMPLETION_MARKER = 'HOUSEHOLD_SETUP_COMPLETE';

// ── Mock-mode conversation handler ───────────────────────

/**
 * For local dev without Gemini API keys.
 * Returns a simple conversational response based on the latest user message.
 * No scripted questions — mirrors how Gemini drives the conversation.
 */
export function getMockResponse(messages) {
  const userMessages = messages.filter((m) => m.role === 'user');
  const count = userMessages.length;
  const latest = userMessages[count - 1]?.content?.toLowerCase() || '';

  // First message — Gemini-style opening
  if (count === 1 && /start|setup|household|hi|hello/i.test(latest)) {
    return "Hey there! I'm Koda, and I'm here to help you set up your household. Tell me about your family — who are you cooking for? Names, ages, whatever comes to mind!";
  }

  // After several exchanges, simulate completion with mock data
  if (count >= 7) {
    const mockData = {
      members: [
        {
          name: 'You',
          age: 35,
          allergies: [],
          dietary_restrictions: [],
          is_picky_eater: false,
          picky_issues: [],
          picky_favorites: [],
          track_macros: false,
          macro_goal: null,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
        },
      ],
      faith_practices: {
        has_faith_practices: false,
        scope: null,
        practices: [],
      },
    };

    return `I have everything I need for your household! Here's what I've saved:\n\nHOUSEHOLD_SETUP_COMPLETE\n${JSON.stringify(mockData)}`;
  }

  // Default — echo back naturally without following a fixed script
  return `Thanks for sharing that! Tell me more — I want to make sure I have everyone's details. What about allergies, dietary needs, or anything else I should know?`;
}
