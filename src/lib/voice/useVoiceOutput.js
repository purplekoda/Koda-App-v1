'use client'

import { useCallback, useRef, useState } from 'react'
import { speakResponse, stopSpeaking, isTTSSupported } from './tts'

/**
 * React hook for text-to-speech voice output.
 *
 * Manages speaking state and provides controls for the chat UI.
 *
 * @returns {{
 *   isSpeaking: boolean,
 *   speakingMessageIndex: number | null,
 *   supported: boolean,
 *   speak: (text: string, messageIndex?: number) => void,
 *   stop: () => void,
 * }}
 */
export function useVoiceOutput() {
  const [isSpeakingState, setIsSpeaking] = useState(false)
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null)
  const supported = typeof window !== 'undefined' ? isTTSSupported() : true

  const speak = useCallback((text, messageIndex = null) => {
    speakResponse(text, {
      onStart: () => {
        setIsSpeaking(true)
        setSpeakingMessageIndex(messageIndex)
      },
      onEnd: () => {
        setIsSpeaking(false)
        setSpeakingMessageIndex(null)
      },
    })
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
    setSpeakingMessageIndex(null)
  }, [])

  return {
    isSpeaking: isSpeakingState,
    speakingMessageIndex,
    supported,
    speak,
    stop,
  }
}
