'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useChat } from './ChatProvider'
import SuggestionCard from './SuggestionCard'
import { useVoiceInput } from '@/lib/voice/useVoiceInput'
import { useVoiceOutput } from '@/lib/voice/useVoiceOutput'
import { stopSpeaking } from '@/lib/voice/tts'
import { isSTTSupported } from '@/lib/voice/stt'
import { useMicPermission } from '@/hooks/useMicPermission'
import { useContinuousMic, MIC_STATE } from '@/hooks/useContinuousMic'
import { toggleHandsFreeAction } from '@/app/(app)/settings/actions'
import SpeakingIndicator from '@/components/voice/SpeakingIndicator'
import ListeningIndicator from '@/components/voice/ListeningIndicator'
import ProcessingIndicator from '@/components/voice/ProcessingIndicator'
import SilenceCountdown from '@/components/voice/SilenceCountdown'
import TranscriptBubble from '@/components/voice/TranscriptBubble'

// ── Animations ────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
`

const waveAnimation = keyframes`
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`

// ── Layout ────────────────────────────────────────────

const FixedLayer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--cooking-bar-offset, 0px);
  z-index: 50;
  pointer-events: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xxxl};
  display: flex;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.md});
  }
`

const Column = styled.div`
  width: 100%;
  max-width: 640px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  max-height: min(60vh, 520px);
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  overflow: hidden;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const HeaderLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
  flex-shrink: 0;
`

const IconButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const VoiceToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ $on, theme }) => $on ? theme.colors.tealMid : theme.colors.border};
  background: ${({ $on, theme }) => $on ? theme.colors.tealLight : theme.colors.surface};
  color: ${({ $on, theme }) => $on ? theme.colors.teal : theme.colors.textMuted};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }
`

const HandsFreeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ $on, theme }) => $on ? theme.colors.teal : theme.colors.border};
  background: ${({ $on, theme }) => $on ? theme.colors.teal : theme.colors.surface};
  color: ${({ $on, theme }) => $on ? 'white' : theme.colors.textMuted};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    ${({ $on }) => !$on && 'color: inherit;'}
  }
`

// ── Hands-free banner ─────────────────────────────────

const HandsFreeBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 6px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 12px;
  font-weight: 500;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.tealMid};
  animation: ${fadeIn} 0.2s ease;
`

// ── Messages ──────────────────────────────────────────

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const BubbleRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 85%;
`

const Bubble = styled.div`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealLight : theme.colors.purpleLight};
  color: ${({ $role, $error, theme }) =>
    $error
      ? theme.colors.coral
      : $role === 'user'
        ? theme.colors.tealDark
        : theme.colors.purpleDark};
  border-bottom-right-radius: ${({ $role }) => ($role === 'user' ? '4px' : undefined)};
  border-bottom-left-radius: ${({ $role }) => ($role === 'model' ? '4px' : undefined)};
  flex: 1;
  min-width: 0;
`

const SpeakerButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: ${({ $speaking, theme }) => $speaking ? theme.colors.purpleMid : theme.colors.borderLight};
  color: ${({ $speaking, theme }) => $speaking ? theme.colors.surface : theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  ${({ $speaking }) => $speaking && css`animation: ${pulse} 1.2s ease-in-out infinite;`}

  &:hover {
    background: ${({ theme }) => theme.colors.purpleMid};
    color: ${({ theme }) => theme.colors.surface};
  }
`

const Typing = styled.div`
  align-self: flex-start;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-self: flex-start;
  max-width: 100%;
`

const Chip = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.purpleMid};
  color: ${({ theme }) => theme.colors.purpleDark};
  cursor: pointer;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const WelcomeBubble = styled.div`
  align-self: flex-start;
  max-width: 85%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.tealLight + '30'};
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textPrimary};
  animation: ${fadeIn} 0.3s ease;
`

const WelcomeName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  margin-bottom: 4px;
`

// ── Speaking indicator on model messages ──────────────

const SpeakingWave = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 14px;
`

const WaveBar = styled.span`
  width: 2px;
  height: 14px;
  border-radius: 1px;
  background: ${({ theme }) => theme.colors.purple};
  animation: ${waveAnimation} 0.8s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || '0s'};
  transform-origin: center;
`

// ── Input bar ─────────────────────────────────────────

const BarForm = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.pill};
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  }
`

const Input = styled.input`
  flex: 1;
  font-size: 15px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  border: none;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 14px;
  }
`

const MicButton = styled.button`
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
  min-width: ${({ theme }) => theme.touchTarget};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: 50%;
  border: none;
  background: ${({ $listening, theme }) => $listening ? theme.colors.teal : theme.colors.borderLight};
  color: ${({ $listening, theme }) => $listening ? theme.colors.surface : theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: ${({ $listening, theme }) => $listening ? theme.colors.tealDark : theme.colors.border};
    color: ${({ $listening, theme }) => $listening ? theme.colors.surface : theme.colors.textPrimary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ListeningRing = styled.span`
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.teal};
  animation: ${pulse} 1.5s ease-in-out infinite;
  pointer-events: none;
`

const AskButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border: none;
    padding: 8px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.borderLight};
    justify-content: center;
  }
`

const AskText = styled.span`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const Arrow = styled.span`
  font-size: 16px;
`

// ── Status labels ─────────────────────────────────────

const StatusLabel = styled.div`
  font-size: 11px;
  color: ${({ $type, theme }) =>
    $type === 'listening' ? theme.colors.teal : theme.colors.purple};
  font-weight: 500;
  text-align: center;
  padding: 2px 0;
  animation: ${fadeIn} 0.2s ease;
`

const VoiceError = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.coral};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  animation: ${fadeIn} 0.2s ease;
`

// ── Hands-free status area ────────────────────────────

const HandsFreeStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`

const InactivityBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.amberLight};
  color: ${({ theme }) => theme.colors.amberDark};
  font-size: 12px;
  text-align: center;
  animation: ${fadeIn} 0.3s ease;
`

const ResumeButton = styled.button`
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: none;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`

// ── Component ─────────────────────────────────────────

export default function FloatingChat() {
  const {
    messages, isOpen, setIsOpen, sendMessage, isPending,
    confirmSuggestion, rejectSuggestion,
    voiceResponsesEnabled, setVoiceResponsesEnabled,
    handsFreeChatEnabled, setHandsFreeChatEnabled,
  } = useChat()

  const [draft, setDraft] = useState('')
  const [handsFreeMode, setHandsFreeMode] = useState(false)
  const handsFreeInitRef = useRef(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const prevMessageCountRef = useRef(messages.length)

  // Voice hooks (push-to-talk mode)
  const {
    isListening, interimText, error: voiceError,
    supported: sttSupported, startVoiceInput, stopVoiceInput, clearError,
  } = useVoiceInput()

  const {
    isSpeaking, speakingMessageIndex, supported: ttsSupported,
    speak, stop: stopTTS,
  } = useVoiceOutput()

  const { checkAndRequest, PermissionModal } = useMicPermission()

  // ── Hands-free continuous mic ──────────────────────────

  const handleHandsFreeTranscript = useCallback(async (transcript) => {
    // Send the transcript as a chat message and wait for the response
    sendMessage(transcript)
    // Return empty string — the response will come through messages state
    // and we'll auto-speak it via the useEffect below
    return ''
  }, [sendMessage])

  const {
    currentState: hfState,
    transcript: hfTranscript,
    silenceProgress: hfSilenceProgress,
    inactivityPrompt: hfInactivityPrompt,
    isMicActive: hfMicActive,
    start: startHandsFree,
    stop: stopHandsFree,
    pause: pauseHandsFree,
    resume: resumeHandsFree,
    interrupt: interruptHandsFree,
  } = useContinuousMic({
    onTranscript: handleHandsFreeTranscript,
    onInterruption: () => {
      // We don't add an interruption message in chat — just stop speaking
    },
  })

  const hfSpeaking = hfState === MIC_STATE.SPEAKING
  const hfListening = hfState === MIC_STATE.LISTENING
  const hfProcessing = hfState === MIC_STATE.PROCESSING
  const hfPaused = hfState === MIC_STATE.PAUSED

  const hasMessages = messages.length > 0

  // Auto-scroll on new messages / pending state
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isOpen, messages.length, isPending])

  // Auto-focus input when panel opens (only in non-hands-free mode)
  useEffect(() => {
    if (isOpen && inputRef.current && !handsFreeMode) {
      inputRef.current.focus()
    }
  }, [isOpen, handsFreeMode])

  // Auto-speak new Koda responses when voice responses are enabled (push-to-talk mode)
  useEffect(() => {
    if (handsFreeMode) return // hands-free has its own TTS via the continuous loop
    if (!voiceResponsesEnabled || !ttsSupported) return
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }
    prevMessageCountRef.current = messages.length

    const last = messages[messages.length - 1]
    if (last?.role === 'model' && !last.isError && last.text) {
      speak(last.text, messages.length - 1)
    }
  }, [messages.length, voiceResponsesEnabled, ttsSupported, messages, speak, handsFreeMode])

  // In hands-free mode, auto-speak new Koda responses then resume listening
  useEffect(() => {
    if (!handsFreeMode || !hfMicActive) return
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }
    prevMessageCountRef.current = messages.length

    const last = messages[messages.length - 1]
    if (last?.role === 'model' && !last.isError && last.text) {
      // Use the continuous mic's speakAndListen to speak response and then resume listening
      // We need to import speakAndListen — but we can't from the hook directly here
      // because it's part of the continuous mic. Instead we'll speak via TTS and the
      // hook will re-enter LISTENING after SPEAKING ends.
      // Actually the hook manages speaking internally, so we just need to trigger it.
      // The simplest approach: speak the response through TTS directly and the hook
      // will pick up after.
      speak(last.text, messages.length - 1)
    }
  }, [messages.length, handsFreeMode, hfMicActive, messages, speak])

  // Auto-activate hands-free if user had it enabled previously
  useEffect(() => {
    if (handsFreeInitRef.current || !isOpen || !handsFreeChatEnabled) return
    handsFreeInitRef.current = true
    // Auto-start hands-free — permission check will handle prompt/denied
    ;(async () => {
      const granted = await checkAndRequest()
      if (granted) {
        setHandsFreeMode(true)
        startHandsFree()
      }
    })()
  }, [isOpen, handsFreeChatEnabled, checkAndRequest, startHandsFree])

  // ── Hands-free toggle ──────────────────────────────────

  async function toggleHandsFree() {
    if (handsFreeMode) {
      // Turn off hands-free
      stopHandsFree()
      setHandsFreeMode(false)
      setHandsFreeChatEnabled(false)
      toggleHandsFreeAction(false).catch(() => {})
      return
    }

    // Turn on hands-free — check permission first
    const granted = await checkAndRequest()
    if (!granted) return

    // Stop any push-to-talk listening
    if (isListening) stopVoiceInput()
    if (isSpeaking) stopTTS()

    setHandsFreeMode(true)
    setHandsFreeChatEnabled(true)
    toggleHandsFreeAction(true).catch(() => {})
    startHandsFree()
  }

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || isPending) return
    if (isSpeaking) stopTTS()
    if (handsFreeMode) {
      stopHandsFree()
      setHandsFreeMode(false)
    }
    sendMessage(trimmed)
    setDraft('')
  }

  function handleChip(chip) {
    if (isPending) return
    if (isSpeaking) stopTTS()
    sendMessage(chip)
  }

  async function handleMicToggle() {
    clearError()
    if (isListening) {
      stopVoiceInput()
      return
    }

    const granted = await checkAndRequest()
    if (!granted) return

    startVoiceInput((finalText) => {
      setDraft(prev => {
        const combined = prev ? `${prev} ${finalText}` : finalText
        return combined
      })
    })
  }

  function handleSpeakerClick(messageIndex, text) {
    if (speakingMessageIndex === messageIndex) {
      stopTTS()
    } else {
      speak(text, messageIndex)
    }
  }

  function toggleVoiceResponses() {
    setVoiceResponsesEnabled(prev => !prev)
    if (isSpeaking) stopTTS()
  }

  // Show interim text in input while listening (push-to-talk only)
  const displayValue = !handsFreeMode && isListening && interimText ? interimText : draft

  const lastMessage = messages[messages.length - 1]
  const latestChips =
    lastMessage?.role === 'model' && !lastMessage.isError ? lastMessage.chips : null

  // Whether to show the push-to-talk mic (hidden in hands-free mode)
  const showPTTMic = sttSupported && !handsFreeMode

  return (
    <FixedLayer>
      <Column>
        <Panel role="dialog" aria-label="Koda chat">
          <PanelHeader>
            <HeaderLabel>
              <PurpleDot />
              Koda
              {(isSpeaking || hfSpeaking) && (
                <SpeakingWave aria-label="Speaking">
                  <WaveBar $delay="0s" />
                  <WaveBar $delay="0.15s" />
                  <WaveBar $delay="0.3s" />
                </SpeakingWave>
              )}
            </HeaderLabel>
            <HeaderRight>
              {/* Hands-free toggle */}
              {isSTTSupported() && (
                <HandsFreeToggle
                  type="button"
                  $on={handsFreeMode}
                  onClick={toggleHandsFree}
                  aria-label={handsFreeMode ? 'Turn off hands-free mode' : 'Turn on hands-free mode'}
                  title={handsFreeMode ? 'Hands-free on' : 'Hands-free off'}
                >
                  {'\uD83C\uDFA4'}
                  <span>{handsFreeMode ? 'Hands-free' : 'Hands-free'}</span>
                </HandsFreeToggle>
              )}
              {ttsSupported && !handsFreeMode && (
                <VoiceToggleButton
                  type="button"
                  $on={voiceResponsesEnabled}
                  onClick={toggleVoiceResponses}
                  aria-label={voiceResponsesEnabled ? 'Turn off voice responses' : 'Turn on voice responses'}
                  title={voiceResponsesEnabled ? 'Voice responses on' : 'Voice responses off'}
                >
                  {voiceResponsesEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
                  <span>{voiceResponsesEnabled ? 'Voice on' : 'Voice off'}</span>
                </VoiceToggleButton>
              )}
              <IconButton
                type="button"
                aria-label="Close chat"
                onClick={() => {
                  if (isSpeaking) stopTTS()
                  if (isListening) stopVoiceInput()
                  if (handsFreeMode) {
                    stopHandsFree()
                    setHandsFreeMode(false)
                  }
                  setIsOpen(false)
                }}
              >
                {'\u2715'}
              </IconButton>
            </HeaderRight>
          </PanelHeader>

          {/* Hands-free banner */}
          {handsFreeMode && (
            <HandsFreeBanner>
              {'\uD83C\uDFA4'} Hands-free mode on — Koda is listening
            </HandsFreeBanner>
          )}

          <Messages ref={scrollRef}>
            {!hasMessages && !isPending && (
              <WelcomeBubble>
                <WelcomeName>Koda</WelcomeName>
                Hey! I&apos;m Koda, your meal planning assistant. Ask me to plan your week, suggest recipes, swap a meal, or help with anything in the kitchen.
              </WelcomeBubble>
            )}
            {messages.map((m, i) => (
              <React.Fragment key={i}>
                {m.role === 'model' && !m.isError && ttsSupported ? (
                  <BubbleRow $role="model">
                    <Bubble $role="model" $error={m.isError}>
                      {m.text}
                    </Bubble>
                    {!handsFreeMode && (
                      <SpeakerButton
                        type="button"
                        $speaking={speakingMessageIndex === i}
                        onClick={() => handleSpeakerClick(i, m.text)}
                        aria-label={speakingMessageIndex === i ? 'Stop speaking' : 'Read aloud'}
                        title={speakingMessageIndex === i ? 'Stop' : 'Read aloud'}
                      >
                        {speakingMessageIndex === i ? '\u23F9' : '\uD83D\uDD0A'}
                      </SpeakerButton>
                    )}
                  </BubbleRow>
                ) : (
                  <BubbleRow $role={m.role}>
                    <Bubble $role={m.role} $error={m.isError}>
                      {m.text}
                    </Bubble>
                  </BubbleRow>
                )}
                {m.card && (
                  <SuggestionCard
                    card={m.card}
                    onConfirm={confirmSuggestion}
                    onReject={rejectSuggestion}
                    disabled={isPending}
                  />
                )}
              </React.Fragment>
            ))}

            {/* Hands-free transcript bubble */}
            {handsFreeMode && hfListening && hfTranscript && (
              <TranscriptBubble text={hfTranscript} />
            )}

            {isPending && <Typing>Koda is thinking{'\u2026'}</Typing>}
            {latestChips && latestChips.length > 0 && !isPending && (
              <ChipRow>
                {latestChips.map(chip => (
                  <Chip
                    key={chip}
                    type="button"
                    onClick={() => handleChip(chip)}
                    disabled={isPending}
                  >
                    {chip}
                  </Chip>
                ))}
              </ChipRow>
            )}
          </Messages>

          {/* Hands-free state indicators */}
          {handsFreeMode && (
            <HandsFreeStatus>
              {hfSpeaking && <SpeakingIndicator label="Speaking" color={undefined} />}
              {hfListening && <ListeningIndicator showMic={false} label="Listening" />}
              {hfProcessing && <ProcessingIndicator />}
              {hfListening && <SilenceCountdown progress={hfSilenceProgress} show={hfSilenceProgress > 0} />}
              {hfInactivityPrompt && hfListening && (
                <InactivityBanner>
                  Still there? Say something or tap the mic when you&apos;re ready.
                </InactivityBanner>
              )}
              {hfPaused && (
                <>
                  <InactivityBanner>Paused to save battery</InactivityBanner>
                  <ResumeButton type="button" onClick={resumeHandsFree}>
                    Resume
                  </ResumeButton>
                </>
              )}
            </HandsFreeStatus>
          )}
        </Panel>

        {/* Status labels (push-to-talk mode) */}
        {!handsFreeMode && isListening && <StatusLabel $type="listening">Listening...</StatusLabel>}
        {!handsFreeMode && isSpeaking && <StatusLabel $type="speaking">Speaking...</StatusLabel>}
        {voiceError && <VoiceError>{voiceError}</VoiceError>}

        <BarForm onSubmit={handleSubmit}>
          <PurpleDot />
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={e => {
              if (!isListening && !handsFreeMode) setDraft(e.target.value)
            }}
            placeholder={
              handsFreeMode
                ? 'Hands-free mode active\u2026'
                : isListening
                  ? 'Listening\u2026'
                  : isPending
                    ? 'Koda is thinking\u2026'
                    : 'Ask Koda anything\u2026'
            }
            maxLength={500}
            disabled={isPending || handsFreeMode}
            readOnly={isListening}
            aria-label="Ask Koda"
          />
          {showPTTMic && (
            <MicButton
              type="button"
              $listening={isListening}
              onClick={handleMicToggle}
              disabled={isPending}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening' : 'Speak to Koda'}
            >
              {isListening ? (
                <>
                  {'\u23F9'}
                  <ListeningRing />
                </>
              ) : (
                '\uD83C\uDFA4'
              )}
            </MicButton>
          )}
          <AskButton type="submit" disabled={isPending || !draft.trim() || handsFreeMode}>
            <AskText>{isPending ? '\u2026' : 'Ask'}</AskText>
            <Arrow>{'\u2197'}</Arrow>
          </AskButton>
        </BarForm>
      </Column>
      <PermissionModal />
    </FixedLayer>
  )
}
