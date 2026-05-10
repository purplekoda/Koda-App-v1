'use client';

import { useCallback, useRef, useState } from 'react';
import { startListening, stopListening, isSTTSupported } from './stt';

/**
 * React hook for speech-to-text voice input.
 *
 * Returns state and controls for the microphone button in the chat bar.
 *
 * @returns {{
 *   isListening: boolean,
 *   interimText: string,
 *   error: string | null,
 *   supported: boolean,
 *   startVoiceInput: (onFinal: (text: string) => void) => void,
 *   stopVoiceInput: () => void,
 *   clearError: () => void,
 * }}
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const onFinalRef = useRef(null);

  const supported = typeof window !== 'undefined' ? isSTTSupported() : true; // optimistic SSR

  const startVoiceInput = useCallback((onFinal) => {
    setError(null);
    setInterimText('');
    onFinalRef.current = onFinal;

    startListening({
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setInterimText('');
        onFinalRef.current?.(text);
      },
      onError: (msg) => setError(msg),
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        setInterimText('');
      },
    });
  }, []);

  const stopVoiceInput = useCallback(() => {
    stopListening();
    setIsListening(false);
    setInterimText('');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isListening,
    interimText,
    error,
    supported,
    startVoiceInput,
    stopVoiceInput,
    clearError,
  };
}
