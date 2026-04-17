'use client'

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from 'react'
import { askAI, getAIHistoryAction } from '@/lib/actions/ai'

const ChatContext = createContext(null)

const THREAD_CONTEXT = 'general'

function flattenHistory(entries) {
  if (!Array.isArray(entries)) return []
  return entries
    .map(entry => ({
      role: entry.role === 'model' ? 'model' : 'user',
      text: entry.parts?.[0]?.text || '',
    }))
    .filter(m => m.text)
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await getAIHistoryAction(THREAD_CONTEXT)
      if (!cancelled && result.success) {
        setMessages(flattenHistory(result.data))
      }
    })()
    return () => { cancelled = true }
  }, [])

  const sendMessage = useCallback((text) => {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) return
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    startTransition(async () => {
      const result = await askAI(trimmed, THREAD_CONTEXT)
      if (result.success && result.data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: result.data.text,
            chips: result.data.chips,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: result.error || 'Koda couldn\u2019t respond. Please try again.',
            isError: true,
          },
        ])
      }
    })
  }, [])

  return (
    <ChatContext.Provider
      value={{ messages, isOpen, setIsOpen, sendMessage, isPending }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within a ChatProvider')
  return ctx
}
