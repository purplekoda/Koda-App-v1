'use server';

import { requireUser } from '@/lib/dal/require-user';
import { apiLimiter } from '@/lib/rate-limit';
import { ok, fail } from '@/lib/action-result';
import { sanitizeString } from '@/lib/sanitize';

/**
 * Send a message in the household setup conversation.
 * Relays the full conversation history to Gemini with the goal-based system prompt.
 * Returns Gemini's next response as plain text.
 *
 * @param {{ messages: Array<{ role: 'user'|'model', content: string }> }} input
 */
export async function sendHouseholdChatMessage({ messages }) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    if (!messages?.length) return fail('No messages provided.');

    // Sanitize the latest user message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user') return fail('Last message must be from user.');
    const sanitized = sanitizeString(lastMsg.content, 2000);
    if (!sanitized) return fail('No response provided.');

    const { isMockMode } = await import('@/lib/dal/require-user');
    if (isMockMode()) {
      const { getMockResponse } = await import('@/data/household-chat-flow');
      const response = getMockResponse(messages);
      return ok({ response });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return fail('AI service is not configured.');

    const { GoogleGenAI } = await import('@google/genai');
    const { HOUSEHOLD_SYSTEM_PROMPT } = await import('@/data/household-chat-flow');
    const ai = new GoogleGenAI({ apiKey });

    // Build Gemini contents array from conversation history
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: HOUSEHOLD_SYSTEM_PROMPT,
      },
    });

    return ok({ response: response.text });
  } catch (err) {
    console.error('[sendHouseholdChatMessage] Error:', err?.message);
    return fail('Something went wrong. Please try again.');
  }
}

/**
 * Extract partial household data from the conversation so far.
 * Used to update the background member cards in real time.
 *
 * @param {{ messages: Array<{ role: 'user'|'model', content: string }> }} input
 */
export async function extractPartialHouseholdData({ messages }) {
  try {
    const user = await requireUser();
    // No rate limit on extraction — it piggybacks on the main chat rate limit

    if (!messages?.length) return ok({ members: [] });

    const { isMockMode } = await import('@/lib/dal/require-user');
    if (isMockMode()) {
      // In mock mode, try to extract names from the first user message
      const firstUser = messages.find((m) => m.role === 'user');
      if (!firstUser) return ok({ members: [] });
      const parts = firstUser.content
        .split(/,|and\b/i)
        .map((s) => s.trim())
        .filter(Boolean);
      const members = parts.map((p) => {
        let name = p
          .replace(/who\s+is\s+\d+/i, '')
          .replace(/age\s+\d+/i, '')
          .replace(/\(\s*\d+\s*\)/, '')
          .replace(/\d+\s*(years?\s*old|yo)/i, '')
          .replace(/\d+/, '')
          .replace(/^\s*(my\s+)?/, '')
          .trim();
        if (!name) name = 'Family member';
        name = name.charAt(0).toUpperCase() + name.slice(1);
        const ageMatch = p.match(/(\d+)/);
        return {
          name,
          age: ageMatch ? parseInt(ageMatch[1], 10) : null,
          allergies: [],
          dietary_restrictions: [],
          is_picky_eater: null,
          picky_issues: [],
          picky_favorites: [],
          track_macros: null,
          macro_goal: null,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
        };
      });
      return ok({ members: members.length ? members : [] });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return ok({ members: [] });

    const { GoogleGenAI } = await import('@google/genai');
    const { PARTIAL_EXTRACTION_PROMPT } = await import('@/data/household-chat-flow');
    const ai = new GoogleGenAI({ apiKey });

    // Build a condensed transcript
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Koda'}: ${m.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Here is the conversation so far:\n\n${transcript}\n\n${PARTIAL_EXTRACTION_PROMPT}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text);
    const members = Array.isArray(parsed) ? parsed : parsed.members || [];
    return ok({ members });
  } catch (err) {
    console.error('[extractPartialHouseholdData] Error:', err?.message);
    return ok({ members: [] }); // non-fatal — cards just won't update
  }
}

/**
 * Save household member progress (called when HOUSEHOLD_SETUP_COMPLETE is received).
 * @param {object[]} members
 */
export async function saveHouseholdMemberProgressAction(members) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const { upsertHouseholdMembers } = await import('@/lib/dal/onboarding');
    await upsertHouseholdMembers(user.id, members);
    return ok({ saved: true });
  } catch (err) {
    console.error('[saveHouseholdMemberProgress] Error:', err?.message);
    return fail('Could not save progress. Please try again.');
  }
}

/**
 * Save household-level faith practices.
 * @param {object} practices
 */
export async function saveHouseholdFaithAction(practices) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const { isMockMode } = await import('@/lib/dal/require-user');
    if (isMockMode()) {
      const { saveMockHouseholdFaithPractices } = await import('@/lib/dal/mock-store');
      saveMockHouseholdFaithPractices(practices);
      return ok({ saved: true });
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({ faith_practices: practices })
      .eq('id', user.id);

    if (error) return fail('Could not save faith practices.');
    return ok({ saved: true });
  } catch (err) {
    console.error('[saveHouseholdFaith] Error:', err?.message);
    return fail('Could not save faith practices. Please try again.');
  }
}
