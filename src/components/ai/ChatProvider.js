'use client';

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from 'react';
import { askAI, getAIHistoryAction, confirmMealEditAction } from '@/lib/actions/ai';

const ChatContext = createContext(null);

const THREAD_CONTEXT = 'general';

function flattenHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => ({
      role: entry.role === 'model' ? 'model' : 'user',
      text: entry.parts?.[0]?.text || '',
    }))
    .filter((m) => m.text);
}

export function ChatProvider({ children, voiceSettings: initialVoiceSettings }) {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(
    initialVoiceSettings?.voice_responses_enabled ?? false,
  );
  const [handsFreeChatEnabled, setHandsFreeChatEnabled] = useState(
    initialVoiceSettings?.hands_free_chat_enabled ?? false,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getAIHistoryAction(THREAD_CONTEXT);
      if (!cancelled && result.success) {
        setMessages(flattenHistory(result.data));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    startTransition(async () => {
      const result = await askAI(trimmed, THREAD_CONTEXT);
      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: result.data.text,
            chips: result.data.chips,
            card: result.data.card || null,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: result.error || 'Koda couldn\u2019t respond. Please try again.',
            isError: true,
          },
        ]);
      }
    });
  }, []);

  const confirmSuggestion = useCallback((card) => {
    startTransition(async () => {
      const result = await confirmMealEditAction(card);
      if (result.success && result.data) {
        const { added, day, groceryAdded } = result.data;
        let msg = `Done! ${added} has been added to ${day}'s meal plan.`;
        if (groceryAdded?.length > 0) {
          msg += ` I also added ${groceryAdded.join(', ')} to your grocery list since you'll need those.`;
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: msg,
            chips: ['Plan meals', 'Add another side', 'Check grocery list'],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: result.error || 'Could not add to meal plan.', isError: true },
        ]);
      }
    });
  }, []);

  const rejectSuggestion = useCallback(
    (card) => {
      const day = card?.day || '';
      const mealType = card?.mealType || 'dinner';
      const itemType = card?.suggestion?.item_type || 'side dish';
      sendMessage(`Suggest something else — a different ${itemType} for ${day}'s ${mealType}`);
    },
    [sendMessage],
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        setIsOpen,
        sendMessage,
        isPending,
        confirmSuggestion,
        rejectSuggestion,
        voiceResponsesEnabled,
        setVoiceResponsesEnabled,
        handsFreeChatEnabled,
        setHandsFreeChatEnabled,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
