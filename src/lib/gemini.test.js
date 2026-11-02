import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const generateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = { generateContent: (...a) => generateContent(...a) }
    }
  },
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY', INTEGER: 'INTEGER', BOOLEAN: 'BOOLEAN' },
}))

const { callGeminiWithTools } = await import('./gemini')

describe('callGeminiWithTools', () => {
  const originalKey = process.env.GOOGLE_AI_API_KEY

  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test-key'
    generateContent.mockReset()
  })

  afterEach(() => {
    process.env.GOOGLE_AI_API_KEY = originalKey
  })

  it('passes thinkingConfig: { thinkingBudget: 0 } in the request config', async () => {
    generateContent.mockResolvedValueOnce({ text: 'hi', functionCalls: [], candidates: [{ content: { parts: [{ text: 'hi' }] } }] })
    await callGeminiWithTools([{ role: 'user', parts: [{ text: 'hi' }] }], 'sys', [])
    expect(generateContent).toHaveBeenCalledTimes(1)
    const arg = generateContent.mock.calls[0][0]
    expect(arg.config.thinkingConfig).toEqual({ thinkingBudget: 0 })
  })

  it('logs finishReason when reply has no text and no function calls (non-prod)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      generateContent.mockResolvedValueOnce({
        text: '',
        functionCalls: [],
        candidates: [{ content: { parts: [] }, finishReason: 'MAX_TOKENS' }],
      })
      const out = await callGeminiWithTools([{ role: 'user', parts: [{ text: 'x' }] }], 'sys', [])
      expect(out.text).toBe('')
      expect(out.functionCalls).toEqual([])
      expect(warn).toHaveBeenCalledWith(
        '[callGeminiWithTools] empty reply',
        expect.objectContaining({ finishReason: 'MAX_TOKENS' }),
      )
    } finally {
      process.env.NODE_ENV = prev
      warn.mockRestore()
    }
  })

  it('does not log when text is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    generateContent.mockResolvedValueOnce({
      text: 'ok',
      functionCalls: [],
      candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
    })
    await callGeminiWithTools([{ role: 'user', parts: [{ text: 'x' }] }], 'sys', [])
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
