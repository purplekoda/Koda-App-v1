'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { startListening, stopListening, isSTTSupported } from '@/lib/voice/stt';
import { speakResponse, stopSpeaking, isSpeaking } from '@/lib/voice/tts';

/**
 * Continuous microphone states.
 */
export const MIC_STATE = {
  LISTENING: 'LISTENING',
  SPEAKING: 'SPEAKING',
  PROCESSING: 'PROCESSING',
  PAUSED: 'PAUSED',
};

const SILENCE_TIMEOUT_MS = 1500;
const INACTIVITY_PROMPT_MS = 30_000;
const INACTIVITY_PAUSE_MS = 60_000;

/**
 * Shared continuous-microphone hook.
 *
 * Manages a listen → process → speak → listen loop used by both
 * voice onboarding and the chat hands-free mode.
 *
 * @param {object} opts
 * @param {(transcript: string) => Promise<string>} opts.onTranscript
 *   Called with the final transcript. Must return the response text
 *   that Koda should speak aloud (or empty string to skip TTS).
 * @param {() => void} [opts.onInterruption] - Called when the user interrupts Koda speaking.
 * @returns hook API
 */
export function useContinuousMic({ onTranscript, onInterruption } = {}) {
  const [currentState, setCurrentState] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [silenceProgress, setSilenceProgress] = useState(0); // 0–1
  const [inactivityPrompt, setInactivityPrompt] = useState(false);

  // Refs for timers and callbacks
  const silenceTimerRef = useRef(null);
  const silenceStartRef = useRef(null);
  const silenceRafRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inactivityPauseTimerRef = useRef(null);
  const activeRef = useRef(false); // whether the loop is active
  const stateRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onInterruptionRef = useRef(onInterruption);
  const speechStartedRef = useRef(false); // whether user has started speaking in this listen session

  // Keep callback refs current
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    onInterruptionRef.current = onInterruption;
  }, [onInterruption]);

  // Sync state ref
  useEffect(() => {
    stateRef.current = currentState;
  }, [currentState]);

  // ── Cleanup on unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopListening();
      stopSpeaking();
      activeRef.current = false;
    };
  }, []);

  function clearAllTimers() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (silenceRafRef.current) cancelAnimationFrame(silenceRafRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (inactivityPauseTimerRef.current) clearTimeout(inactivityPauseTimerRef.current);
    silenceTimerRef.current = null;
    silenceRafRef.current = null;
    silenceStartRef.current = null;
    inactivityTimerRef.current = null;
    inactivityPauseTimerRef.current = null;
  }

  // ── Silence countdown animation ──────────────────────
  function startSilenceCountdown(onComplete) {
    silenceStartRef.current = Date.now();
    setSilenceProgress(0);

    // Animate the progress bar
    function tick() {
      if (!silenceStartRef.current) return;
      const elapsed = Date.now() - silenceStartRef.current;
      const progress = Math.min(elapsed / SILENCE_TIMEOUT_MS, 1);
      setSilenceProgress(progress);
      if (progress < 1) {
        silenceRafRef.current = requestAnimationFrame(tick);
      }
    }
    silenceRafRef.current = requestAnimationFrame(tick);

    // Fire completion after timeout
    silenceTimerRef.current = setTimeout(() => {
      silenceStartRef.current = null;
      setSilenceProgress(1);
      onComplete();
    }, SILENCE_TIMEOUT_MS);
  }

  function cancelSilenceCountdown() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (silenceRafRef.current) cancelAnimationFrame(silenceRafRef.current);
    silenceTimerRef.current = null;
    silenceRafRef.current = null;
    silenceStartRef.current = null;
    setSilenceProgress(0);
  }

  // ── Inactivity handling ──────────────────────────────
  function startInactivityTimers() {
    clearInactivityTimers();
    setInactivityPrompt(false);

    inactivityTimerRef.current = setTimeout(() => {
      if (stateRef.current === MIC_STATE.LISTENING && activeRef.current) {
        setInactivityPrompt(true);
      }
    }, INACTIVITY_PROMPT_MS);

    inactivityPauseTimerRef.current = setTimeout(() => {
      if (stateRef.current === MIC_STATE.LISTENING && activeRef.current) {
        pauseLoop();
      }
    }, INACTIVITY_PAUSE_MS);
  }

  function clearInactivityTimers() {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (inactivityPauseTimerRef.current) clearTimeout(inactivityPauseTimerRef.current);
    inactivityTimerRef.current = null;
    inactivityPauseTimerRef.current = null;
    setInactivityPrompt(false);
  }

  // ── State transitions ────────────────────────────────

  const enterListening = useCallback(() => {
    if (!activeRef.current) return;
    setCurrentState(MIC_STATE.LISTENING);
    setTranscript('');
    setSilenceProgress(0);
    speechStartedRef.current = false;

    startInactivityTimers();

    let finalFired = false;

    startListening({
      onStart: () => {},
      onInterim: (text) => {
        setTranscript(text);
        speechStartedRef.current = true;
        clearInactivityTimers();

        // Reset silence countdown on new speech
        cancelSilenceCountdown();
        startSilenceCountdown(() => {
          // Silence reached — submit what we have
          if (!finalFired) {
            finalFired = true;
            stopListening();
            handleTranscriptComplete(text);
          }
        });
      },
      onFinal: (text) => {
        if (!finalFired && text.trim()) {
          finalFired = true;
          cancelSilenceCountdown();
          handleTranscriptComplete(text.trim());
        }
      },
      onError: (msg) => {
        // no-speech is expected during silence — just restart listening
        if (msg.includes('Nothing detected')) {
          if (activeRef.current) enterListening();
          return;
        }
        console.warn('[ContinuousMic] STT error:', msg);
      },
      onEnd: () => {
        // SpeechRecognition ended naturally (continuous=false).
        // If no final was captured and speech was detected, use interim.
        if (!finalFired && speechStartedRef.current && transcript) {
          finalFired = true;
          cancelSilenceCountdown();
          handleTranscriptComplete(transcript);
        } else if (!finalFired && activeRef.current && stateRef.current === MIC_STATE.LISTENING) {
          // No speech at all — restart listening
          enterListening();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterSpeaking = useCallback((responseText) => {
    if (!activeRef.current) return;
    if (!responseText || !responseText.trim()) {
      // No response to speak — go straight to listening
      enterListening();
      return;
    }

    setCurrentState(MIC_STATE.SPEAKING);
    clearInactivityTimers();

    speakResponse(responseText, {
      onEnd: () => {
        if (activeRef.current) {
          enterListening();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterProcessing = useCallback(async (finalText) => {
    if (!activeRef.current) return;
    setCurrentState(MIC_STATE.PROCESSING);
    setTranscript('');
    clearInactivityTimers();

    try {
      const response = await onTranscriptRef.current?.(finalText);
      if (activeRef.current) {
        enterSpeaking(response || '');
      }
    } catch (err) {
      console.warn('[ContinuousMic] Processing error:', err);
      if (activeRef.current) {
        enterSpeaking('Sorry, something went wrong. Could you try that again?');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTranscriptComplete(text) {
    cancelSilenceCountdown();
    clearInactivityTimers();
    if (text.trim()) {
      enterProcessing(text.trim());
    } else if (activeRef.current) {
      enterListening();
    }
  }

  const pauseLoop = useCallback(() => {
    stopListening();
    cancelSilenceCountdown();
    clearInactivityTimers();
    setCurrentState(MIC_STATE.PAUSED);
    setTranscript('');
    setSilenceProgress(0);
    setInactivityPrompt(false);
  }, []);

  // ── Public API ───────────────────────────────────────

  const start = useCallback(() => {
    activeRef.current = true;
    setIsMicActive(true);
    enterListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsMicActive(false);
    stopListening();
    stopSpeaking();
    clearAllTimers();
    setCurrentState(null);
    setTranscript('');
    setSilenceProgress(0);
    setInactivityPrompt(false);
  }, []);

  const pause = useCallback(() => {
    if (!activeRef.current) return;
    stopSpeaking();
    pauseLoop();
  }, [pauseLoop]);

  const resume = useCallback(() => {
    if (!activeRef.current) {
      activeRef.current = true;
      setIsMicActive(true);
    }
    enterListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Immediately submit the current transcript without waiting for silence.
   * Called when the user taps Send or presses Enter.
   */
  const submitNow = useCallback(
    (overrideText) => {
      const text = overrideText || transcript;
      if (!text?.trim()) return;
      stopListening();
      cancelSilenceCountdown();
      handleTranscriptComplete(text.trim());
    },
    [transcript],
  );

  /**
   * Speak a response from outside the loop (e.g., initial greeting).
   * After speaking, transitions to LISTENING if the loop is active.
   */
  const speakAndListen = useCallback((text) => {
    if (!activeRef.current) {
      activeRef.current = true;
      setIsMicActive(true);
    }
    enterSpeaking(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle interruption — user starts speaking while Koda is talking.
   * Call this from a component that detects voice activity during SPEAKING state.
   */
  const interrupt = useCallback(() => {
    if (stateRef.current === MIC_STATE.SPEAKING) {
      stopSpeaking();
      onInterruptionRef.current?.();
      enterListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    currentState,
    transcript,
    isMicActive,
    silenceProgress,
    inactivityPrompt,

    // Controls
    start,
    stop,
    pause,
    resume,
    submitNow,
    speakAndListen,
    interrupt,
  };
}
