'use client'

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  askAI,
  getAIHistoryAction,
  confirmMealEditAction,
  undoChatAction,
  confirmChatPendingAction,
  cancelChatPendingAction,
} from '@/lib/actions/ai'

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

export function ChatProvider({ children, voiceSettings: initialVoiceSettings }) {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(
    initialVoiceSettings?.voice_responses_enabled ?? false
  )
  const [handsFreeChatEnabled, setHandsFreeChatEnabled] = useState(
    initialVoiceSettings?.hands_free_chat_enabled ?? false
  )

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

  // Clear undo on every earlier model message when a newer one carries undo
  // or a card status change. The server already superseded them server-side;
  // this just mirrors that in the UI.
  function clearPriorUndos(prev, upToIndex) {
    return prev.map((m, idx) => (idx < upToIndex && m.undo ? { ...m, undo: null } : m))
  }

  const sendMessage = useCallback((text) => {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) return
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    startTransition(async () => {
      const result = await askAI(trimmed, THREAD_CONTEXT)
      if (result.success && result.data) {
        setMessages(prev => {
          const next = clearPriorUndos(prev, prev.length)
          return [
            ...next,
            {
              role: 'model',
              text: result.data.text,
              chips: result.data.chips,
              card: result.data.card || null,
              undo: result.data.undo || null,
            },
          ]
        })
        if (result.data.actionExecuted) router.refresh()
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: result.error || 'Koda couldn’t respond. Please try again.',
            isError: true,
          },
        ])
      }
    })
  }, [router])

  const confirmSuggestion = useCallback((card) => {
    if (card?.type !== 'meal_suggestion') return
    startTransition(async () => {
      const result = await confirmMealEditAction(card)
      if (result.success && result.data) {
        const { added, day, groceryAdded } = result.data
        let msg = `Done! ${added} has been added to ${day}'s meal plan.`
        if (groceryAdded?.length > 0) {
          msg += ` I also added ${groceryAdded.join(', ')} to your grocery list since you'll need those.`
        }
        setMessages(prev => [
          ...prev,
          { role: 'model', text: msg, chips: ['Plan meals', 'Add another side', 'Check grocery list'] },
        ])
        router.refresh()
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: result.error || 'Could not add to meal plan.', isError: true },
        ])
      }
    })
  }, [router])

  const rejectSuggestion = useCallback((card) => {
    const day = card?.day || ''
    const mealType = card?.mealType || 'dinner'
    const itemType = card?.suggestion?.item_type || 'side dish'
    sendMessage(`Suggest something else — a different ${itemType} for ${day}'s ${mealType}`)
  }, [sendMessage])

  const undoChange = useCallback((messageIndex) => {
    setMessages(prev => {
      const msg = prev[messageIndex]
      if (!msg?.undo?.id) return prev
      return prev
    })
    const current = messages[messageIndex]
    if (!current?.undo?.id) return
    const undoId = current.undo.id
    startTransition(async () => {
      const result = await undoChatAction(undoId)
      if (result.success && result.data) {
        setMessages(prev => {
          const updated = prev.map((m, idx) =>
            idx === messageIndex ? { ...m, undone: true, undo: null } : m
          )
          return [
            ...updated,
            { role: 'model', text: result.data.text, chips: [], undo: null },
          ]
        })
        router.refresh()
      } else {
        setMessages(prev => {
          const updated = prev.map((m, idx) =>
            idx === messageIndex ? { ...m, undo: null } : m
          )
          return [
            ...updated,
            { role: 'model', text: result.error || 'That undo is no longer available.', isError: true },
          ]
        })
      }
    })
  }, [messages, router])

  const confirmPending = useCallback((messageIndex) => {
    const current = messages[messageIndex]
    const pendingId = current?.card?.pendingId
    if (!pendingId || current?.card?.status) return
    startTransition(async () => {
      const result = await confirmChatPendingAction(pendingId)
      if (result.success && result.data) {
        setMessages(prev => {
          const cleared = clearPriorUndos(prev, prev.length)
          const updated = cleared.map((m, idx) =>
            idx === messageIndex ? { ...m, card: { ...m.card, status: 'saved' } } : m
          )
          return [
            ...updated,
            { role: 'model', text: result.data.text || 'Saved.', chips: [], undo: null },
          ]
        })
        router.refresh()
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: result.error || 'Could not save that change.', isError: true },
        ])
      }
    })
  }, [messages, router])

  const dismissPending = useCallback((messageIndex) => {
    const current = messages[messageIndex]
    const pendingId = current?.card?.pendingId
    if (!pendingId || current?.card?.status) return
    startTransition(async () => {
      const result = await cancelChatPendingAction(pendingId)
      if (result.success && result.data) {
        setMessages(prev => {
          const updated = prev.map((m, idx) =>
            idx === messageIndex ? { ...m, card: { ...m.card, status: 'dismissed' } } : m
          )
          return [
            ...updated,
            { role: 'model', text: result.data.text || 'Left it alone.', chips: [], undo: null },
          ]
        })
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: result.error || 'Could not cancel.', isError: true },
        ])
      }
    })
  }, [messages])

  return (
    <ChatContext.Provider
      value={{
        messages, isOpen, setIsOpen, sendMessage, isPending,
        confirmSuggestion, rejectSuggestion,
        undoChange, confirmPending, dismissPending,
        voiceResponsesEnabled, setVoiceResponsesEnabled,
        handsFreeChatEnabled, setHandsFreeChatEnabled,
      }}
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
