'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useWakeLock from '@/hooks/useWakeLock'
import { useMicPermission } from '@/hooks/useMicPermission'
import { useContinuousMic, MIC_STATE } from '@/hooks/useContinuousMic'
import { askCookingAssistantAction } from '@/app/(app)/recipes/[id]/actions'

// ── Helpers ──────────────────────────────────────────

const WAKE_WORDS = ['hey koda', 'koda help', 'come in koda', 'koda wake up']

const OPENING_PROMPTS = [
  "I'm here — would you like me to read the next step or is there something else I can help with?",
  "Hey! Want me to walk you through the next step or do you have a question?",
  "I'm listening — next step, an ingredient question, or something else?",
  "Got it! Shall I read the next step or can I help with something specific?",
]

function detectWakeWord(transcript) {
  const lower = transcript.toLowerCase().trim()
  return WAKE_WORDS.some(w => lower.includes(w))
}

/**
 * Strip the wake word from the transcript so the remaining text
 * can be treated as the command (e.g. "okay koda what's the next step"
 * becomes "what's the next step").
 */
function stripWakeWord(transcript) {
  let lower = transcript.toLowerCase()
  for (const w of WAKE_WORDS) {
    const idx = lower.indexOf(w)
    if (idx !== -1) {
      return transcript.slice(idx + w.length).trim()
    }
  }
  return transcript.trim()
}

/**
 * Parse a single instructions string into an array of step strings.
 * Handles numbered steps ("1. Do this"), "Step N:" patterns, bullet points,
 * and newline-separated steps. Strips leading number/bullet prefixes from each step.
 */
export function parseSteps(instructions) {
  if (!instructions) return []
  if (Array.isArray(instructions)) return instructions

  // Split on "1. " or "1) " numbered patterns (with optional newline before)
  if (/\d+[.)]\s+/.test(instructions)) {
    const steps = instructions
      .split(/\n?\s*\d+[.)]\s+/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
    if (steps.length > 1) return steps
  }

  // Split on "Step 1:" or "Step 1." patterns
  if (/step\s+\d+[:.]\s*/i.test(instructions)) {
    const steps = instructions
      .split(/\n?\s*step\s+\d+[:.]\s*/i)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
    if (steps.length > 1) return steps
  }

  // Fall back to splitting on newlines, stripping any leading numbering
  const lines = instructions
    .split('\n')
    .map(s => s.replace(/^\s*\d+[\.\)\-]\s*/, '').trim())
    .filter(Boolean)
  return lines
}

/**
 * Detect step-navigation commands in the user's transcript.
 * Returns { action, value } or null.
 */
function detectStepCommand(text) {
  const lower = text.toLowerCase().trim()

  if (/\b(next|next step|what'?s next|i'?m ready|i'?m done|ready|continue|move on)\b/.test(lower)) {
    return { action: 'next' }
  }
  if (/\b(go back|previous|previous step|back|last step)\b/.test(lower)) {
    return { action: 'prev' }
  }
  if (/\b(repeat|say that again|say it again|one more time|repeat that)\b/.test(lower)) {
    return { action: 'repeat' }
  }
  if (/\b(start over|beginning|first step|restart)\b/.test(lower)) {
    return { action: 'first' }
  }
  if (/\b(stop|pause|goodbye koda|bye koda|exit|quit|end cooking)\b/.test(lower)) {
    return { action: 'stop' }
  }
  return null
}

// ── Chime sound via Web Audio API ────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime

    // Two-note ascending chime
    const notes = [523.25, 659.25] // C5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.35)
    })

    // Clean up context after sounds finish
    setTimeout(() => ctx.close().catch(() => {}), 600)
  } catch {
    // Audio not available — continue silently
  }
}

// ── Hook ─────────────────────────────────────────────

/**
 * Hands-free cooking assistant hook.
 *
 * Manages wake word detection, active listening, Gemini calls,
 * step tracking, TTS responses, and screen wake lock.
 *
 * @param {object} recipe - Full recipe object with name, ingredients, instructions, etc.
 * @returns {object} Hook API
 */
export default function useCookingAssistant(recipe) {
  // ── Cooking mode state ───────────────────────────────
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [lastResponse, setLastResponse] = useState('')
  const [wakeWordStatus, setWakeWordStatus] = useState('standby') // 'standby' | 'listening' | 'processing'
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [messages, setMessages] = useState([]) // [{ role: 'koda'|'user', text: string }]

  // Parse instructions into steps
  const steps = parseSteps(recipe?.instructions)
  const totalSteps = steps.length

  // Conversation history for Gemini context
  const historyRef = useRef([])
  const isActiveListeningRef = useRef(false)
  const stepsRef = useRef(steps)
  const currentStepRef = useRef(currentStep)
  const recipeRef = useRef(recipe)

  // Keep refs in sync
  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])
  useEffect(() => { recipeRef.current = recipe }, [recipe])

  // ── Sub-hooks ────────────────────────────────────────
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, toggle: toggleWakeLock } = useWakeLock()
  const { checkAndRequest, PermissionModal } = useMicPermission()

  const handleTranscript = useCallback(async (transcript) => {
    const currentSteps = stepsRef.current
    const step = currentStepRef.current
    const rec = recipeRef.current

    // ── Standby mode: check for wake word ──────────────
    if (!isActiveListeningRef.current) {
      if (detectWakeWord(transcript)) {
        playChime()
        setWakeWordStatus('listening')
        isActiveListeningRef.current = true

        // Check if there's a command after the wake word
        const remainder = stripWakeWord(transcript)
        if (remainder.length > 3) {
          // User said "hey koda what's next" — process immediately
          return await processCommand(remainder, rec, currentSteps, step)
        }
        // Just the wake word — speak a friendly opening prompt and wait for command
        const opening = OPENING_PROMPTS[Math.floor(Math.random() * OPENING_PROMPTS.length)]
        setLastResponse(opening)
        setMessages(prev => [...prev, { role: 'koda', text: opening }])
        return opening
      }
      // Not a wake word — ignore
      return ''
    }

    // ── Active listening mode: process command ─────────
    return await processCommand(transcript, rec, currentSteps, step)
  }, [])

  async function processCommand(text, rec, currentSteps, step) {
    setWakeWordStatus('processing')

    // Check for step navigation commands
    const cmd = detectStepCommand(text)
    if (cmd) {
      let responseText = ''

      switch (cmd.action) {
        case 'next': {
          if (step < currentSteps.length) {
            const nextStep = step + 1
            setCompletedSteps(prev => new Set([...prev, step]))
            setCurrentStep(nextStep)
            responseText = `Step ${nextStep}: ${currentSteps[nextStep - 1]}. Ready for the next step?`
          } else {
            responseText = "That was the last step — you're all done! Great job with this recipe."
          }
          break
        }
        case 'prev': {
          if (step > 1) {
            const prevStep = step - 1
            setCurrentStep(prevStep)
            responseText = `Going back. Step ${prevStep}: ${currentSteps[prevStep - 1]}. Let me know when you're ready to move on.`
          } else {
            responseText = `You're already on the first step. Step 1: ${currentSteps[0]}. Ready to continue?`
          }
          break
        }
        case 'repeat': {
          responseText = `Step ${step}: ${currentSteps[step - 1]}. Let me know when you're ready for the next step.`
          break
        }
        case 'first': {
          setCurrentStep(1)
          setCompletedSteps(new Set())
          responseText = `Starting from the beginning. Step 1: ${currentSteps[0]}. Let me know when you're ready to move on.`
          break
        }
        case 'stop': {
          isActiveListeningRef.current = false
          setWakeWordStatus('standby')
          setLastResponse('Say "Hey Koda" when you need me.')
          return 'Taking a break. Just say "Hey Koda" whenever you need me again.'
        }
      }

      if (responseText) {
        isActiveListeningRef.current = false
        setWakeWordStatus('standby')
        setLastResponse(responseText)
        setMessages(prev => [...prev, { role: 'user', text }, { role: 'koda', text: responseText }])

        // Add to history
        historyRef.current = [
          ...historyRef.current.slice(-8),
          { role: 'user', parts: [{ text }] },
          { role: 'model', parts: [{ text: responseText }] },
        ]

        return responseText
      }
    }

    // ── General question — send to Gemini ──────────────
    try {
      const recipeForAction = {
        name: rec.name,
        ingredients: rec.ingredients,
        instructions: rec.instructions,
        steps: currentSteps,
        prep_time_minutes: rec.prep_time_minutes,
        cook_time_minutes: rec.cook_time_minutes,
        servings: rec.servings,
      }

      const result = await askCookingAssistantAction(
        text,
        recipeForAction,
        step,
        historyRef.current.slice(-8),
      )

      const responseText = result.success
        ? result.data.text
        : 'Sorry, I had trouble with that. Could you try asking again?'

      // Check if Gemini's response indicates a step change
      const lower = text.toLowerCase()
      if (/\b(next|what'?s next)\b/.test(lower) && step < currentSteps.length) {
        setCompletedSteps(prev => new Set([...prev, step]))
        setCurrentStep(step + 1)
      }

      isActiveListeningRef.current = false
      setWakeWordStatus('standby')
      setLastResponse(responseText)
      setMessages(prev => [...prev, { role: 'user', text }, { role: 'koda', text: responseText }])

      historyRef.current = [
        ...historyRef.current.slice(-8),
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]

      return responseText
    } catch {
      isActiveListeningRef.current = false
      setWakeWordStatus('standby')
      return 'Sorry, something went wrong. Say "Hey Koda" to try again.'
    }
  }

  const mic = useContinuousMic({ onTranscript: handleTranscript })

  // ── Auto-resume when mic auto-pauses (inactivity) ──
  useEffect(() => {
    if (isActive && mic.currentState === MIC_STATE.PAUSED) {
      // In cooking mode, always keep listening for wake word
      const timer = setTimeout(() => mic.resume(), 500)
      return () => clearTimeout(timer)
    }
  }, [isActive, mic.currentState, mic])

  // ── Public API ─────────────────────────────────────

  const startCooking = useCallback(async () => {
    // Request mic permission
    const granted = await checkAndRequest()
    if (!granted) return

    // Activate wake lock
    if (wakeLockSupported && !wakeLockActive) {
      await toggleWakeLock()
    }

    setIsActive(true)
    setCurrentStep(1)
    setCompletedSteps(new Set())
    setWakeWordStatus('standby')
    setLastResponse('')
    historyRef.current = []
    isActiveListeningRef.current = false

    // Start listening for wake word
    mic.start()

    // Greet the user
    const greeting = `Cooking mode is on! I'll walk you through ${recipe?.name || 'this recipe'} step by step. Say "Hey Koda" whenever you need help.`
    setLastResponse(greeting)
    setMessages([{ role: 'koda', text: greeting }])
    mic.speakAndListen(greeting)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAndRequest, wakeLockSupported, wakeLockActive, toggleWakeLock, recipe?.name])

  const stopCooking = useCallback(async () => {
    mic.stop()
    isActiveListeningRef.current = false

    // Release wake lock
    if (wakeLockActive) {
      await toggleWakeLock()
    }

    setIsActive(false)
    setWakeWordStatus('standby')
    setLastResponse('')
    setMessages([])
    historyRef.current = []
  }, [mic, wakeLockActive, toggleWakeLock])

  const goToStep = useCallback((stepNumber) => {
    const clamped = Math.max(1, Math.min(stepNumber, totalSteps))
    // Mark all steps before the target as completed
    const completed = new Set()
    for (let i = 1; i < clamped; i++) completed.add(i)
    setCompletedSteps(completed)
    setCurrentStep(clamped)
  }, [totalSteps])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  return {
    // State
    isActive,
    currentStep,
    totalSteps,
    steps,
    lastResponse,
    wakeWordStatus,
    completedSteps,
    messages,
    isListening: mic.isMicActive,
    micState: mic.currentState,
    transcript: mic.transcript,
    silenceProgress: mic.silenceProgress,

    // Controls
    startCooking,
    stopCooking,
    goToStep,
    nextStep,
    prevStep,

    // Mic permission modal
    PermissionModal,
  }
}
