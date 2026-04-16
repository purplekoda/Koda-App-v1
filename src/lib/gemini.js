import 'server-only'

import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT =
  "You are Koda's AI assistant — a friendly, knowledgeable meal planning and productivity coach. " +
  'Help users plan meals, understand nutrition, manage grocery shopping, and stay on track with their health goals. ' +
  'Keep responses concise and practical.'

/**
 * Call Gemini 2.0 Flash with a chat history and return the response text.
 *
 * @param {Array<{ role: 'user'|'model', parts: [{ text: string }] }>} history
 *   Full conversation history including the new user message as the last entry.
 * @returns {Promise<string>} The model's text response.
 */
export async function callGemini(history) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  // The last message is the current user turn — everything before is history
  const currentMessage = history[history.length - 1]
  const priorHistory = history.slice(0, -1)

  const chat = model.startChat({ history: priorHistory })
  const result = await chat.sendMessage(currentMessage.parts[0].text)

  return result.response.text()
}
