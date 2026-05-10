'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import styled, { keyframes, css } from 'styled-components';

import SpeakingIndicator from '@/components/voice/SpeakingIndicator';
import ListeningIndicator from '@/components/voice/ListeningIndicator';
import ProcessingIndicator from '@/components/voice/ProcessingIndicator';
import TranscriptBubble from '@/components/voice/TranscriptBubble';

import { ONBOARDING_COMPLETION_MARKER, REQUIRED_ITEM_COUNT } from '@/data/onboarding-conversation';
import { stopSpeaking } from '@/lib/voice/tts';
import { isSTTSupported } from '@/lib/voice/stt';
import { useMicPermission } from '@/hooks/useMicPermission';
import { useContinuousMic, MIC_STATE } from '@/hooks/useContinuousMic';

import {
  sendOnboardingChatMessage,
  extractPartialOnboardingData,
  saveConversationHistoryAction,
  saveOnboardingCompletionData,
} from '@/app/(onboarding)/onboarding/conversation-actions';
import { completeOnboardingAction } from '@/app/(onboarding)/onboarding/actions';

// ── Keyframes ─────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(29, 158, 117, 0); }
`;

// ── Layout ────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl} 0;
  flex-shrink: 0;
`;

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 12px;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const ProgressRow = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  flex-shrink: 0;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.teal};
  transition: width 0.5s ease;
  width: ${({ $pct }) => $pct}%;
`;

const ProgressLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
  text-align: right;
`;

const PanelContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

// ── Left Panel: Background Form Fill ──────────────────────

const LeftPanel = styled.div`
  width: 60%;
  flex-shrink: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  border-right: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    height: 55%;
    flex-shrink: 0;
    border-right: none;
    border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

const SectionCard = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  animation: ${fadeIn} 0.3s ease;
  ${({ $updated }) => $updated && css`animation: ${glowPulse} 0.6s ease;`}
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SectionContent = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.6;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  background: ${({ $active, theme }) => ($active ? theme.colors.tealLight : theme.colors.borderLight)};
  color: ${({ $active, theme }) => ($active ? theme.colors.teal : theme.colors.textTertiary)};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.tealMid : 'transparent')};
  transition: all 0.3s ease;
`;

const MemberCard = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: 6px;
  ${({ $updated }) => $updated && css`animation: ${glowPulse} 0.6s ease;`}
`;

const MemberName = styled.div`
  font-weight: 600;
  font-size: 13px;
`;

const MemberDetail = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const EmptyPlaceholder = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`;

const DayGrid = styled.div`
  display: flex;
  gap: 4px;
`;

const DayCell = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $active, theme }) => ($active ? theme.colors.teal : theme.colors.borderLight)};
  color: ${({ $active }) => ($active ? 'white' : 'inherit')};
  transition: all 0.3s ease;
`;

// ── Right Panel: Chat ─────────────────────────────────────

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 45%;
    flex: none;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  min-height: 0;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  animation: ${fadeIn} 0.2s ease;
  ${({ $isUser }) => $isUser && 'flex-direction: row-reverse;'}
`;

const Avatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $isUser, theme }) => ($isUser ? theme.colors.tealLight : theme.colors.teal)};
  color: ${({ $isUser, theme }) => ($isUser ? theme.colors.teal : 'white')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $isUser, theme }) => ($isUser ? theme.colors.tealLight : theme.colors.surface)};
  border: 1px solid ${({ $isUser, theme }) =>
    $isUser ? theme.colors.tealMid : theme.colors.borderLight};
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: pre-wrap;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 12px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.textMuted};
    animation: ${keyframes`
      0%, 60%, 100% { opacity: 0.3; }
      30% { opacity: 1; }
    `} 1.4s infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

// ── Input area ────────────────────────────────────────────

const InputArea = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  padding-bottom: calc(${({ theme }) => theme.spacing.md} + env(safe-area-inset-bottom, 0px));
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
  }
  &:disabled {
    opacity: 0.5;
  }
`;

const SendButton = styled.button`
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: none;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// ── Voice status area ─────────────────────────────────────

const VoiceStatusArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`;

const StopButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.coral};
  background: ${({ theme }) => theme.colors.coralLight};
  color: ${({ theme }) => theme.colors.coral};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.coral}; color: white; }
`;

const ResumeButton = styled.button`
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: none;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const InactivityBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.amberLight};
  color: ${({ theme }) => theme.colors.amberDark};
  font-size: 13px;
  text-align: center;
  animation: ${fadeIn} 0.3s ease;
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FEE2E2;
  color: #991B1B;
  font-size: 12px;
  margin: 0 ${({ theme }) => theme.spacing.md};
`;

// ── Helpers ───────────────────────────────────────────────

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseCompletionData(responseText) {
  const markerIdx = responseText.indexOf(ONBOARDING_COMPLETION_MARKER);
  if (markerIdx === -1) return null;

  const afterMarker = responseText.slice(markerIdx + ONBOARDING_COMPLETION_MARKER.length).trim();
  // Find first { and last }
  const jsonStart = afterMarker.indexOf('{');
  const jsonEnd = afterMarker.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) return null;

  try {
    return JSON.parse(afterMarker.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────

export default function OnboardingConversation({
  mode = 'manual',
  savedMessages = [],
  onComplete,
  onSwitchToManual,
  manualContextMessage = null,
}) {
  const [messages, setMessages] = useState(savedMessages.length > 0 ? savedMessages : []);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [partialData, setPartialData] = useState({});
  const [itemsConfirmed, setItemsConfirmed] = useState(0);
  const [completionData, setCompletionData] = useState(null);
  const [updatedSections, setUpdatedSections] = useState(new Set());
  const [voiceStopped, setVoiceStopped] = useState(false);
  const [isPending, startTransition] = useTransition();

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);
  const saveTimerRef = useRef(null);
  const messagesRef = useRef(messages);

  const isVoice = mode === 'voice';

  const { checkAndRequest, PermissionModal } = useMicPermission();

  // Keep messagesRef always in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Lock body scroll while onboarding split screen is active
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    };
  }, []);

  // ── Auto-scroll chat ──────────────────────────────────

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // ── Debounced conversation history save ───────────────

  const debouncedSave = useCallback((msgs) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConversationHistoryAction({ messages: msgs });
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ── Extract partial data after each Gemini response ───

  const extractPartial = useCallback(async (msgs) => {
    const result = await extractPartialOnboardingData({ messages: msgs });
    if (result.success && result.data) {
      const data = result.data.data || result.data;
      setPartialData(data);
      setItemsConfirmed(result.data.itemsConfirmed || data.items_confirmed || 0);

      // Flag newly updated sections for glow animation
      setUpdatedSections(
        new Set(Object.keys(data).filter((k) => k !== 'items_confirmed' && data[k] != null)),
      );
      setTimeout(() => setUpdatedSections(new Set()), 700);
    }
  }, []);

  // ── Send a message (used by both text and voice) ──────
  // Uses messagesRef to always read the latest messages,
  // avoiding stale closures in the voice mic callback chain.

  const sendMessage = useCallback(
    async (userText) => {
      setError(null);
      const currentMessages = messagesRef.current;
      const userMsg = { role: 'user', content: userText };
      const newMessages = [...currentMessages, userMsg];
      setMessages(newMessages);
      messagesRef.current = newMessages;
      setSending(true);

      try {
        const result = await sendOnboardingChatMessage({ messages: newMessages });
        if (!result.success) {
          setError(result.error);
          setSending(false);
          return null;
        }

        const responseText = result.data.response;
        const modelMsg = { role: 'model', content: responseText };
        const updatedMessages = [...newMessages, modelMsg];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
        setSending(false);

        // Save conversation history
        debouncedSave(updatedMessages);

        // Check for completion
        if (responseText.includes(ONBOARDING_COMPLETION_MARKER)) {
          const parsed = parseCompletionData(responseText);
          if (parsed) {
            setCompletionData(parsed);
            // Strip the marker + JSON from the displayed message
            const displayText = responseText
              .slice(0, responseText.indexOf(ONBOARDING_COMPLETION_MARKER))
              .trim();
            if (displayText) {
              const cleanMessages = [...updatedMessages];
              cleanMessages[cleanMessages.length - 1] = { role: 'model', content: displayText };
              setMessages(cleanMessages);
              messagesRef.current = cleanMessages;
            }
          }
        }

        // Extract partial data in background
        extractPartial(updatedMessages);

        return responseText;
      } catch {
        setError('Something went wrong. Please try again.');
        setSending(false);
        return null;
      }
    },
    [debouncedSave, extractPartial],
  );

  // ── Initialize conversation ───────────────────────────

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      // If we have saved messages, extract partial data from them
      if (savedMessages.length > 0) {
        extractPartial(savedMessages);
        // If resuming, send a resume trigger
        if (savedMessages.length >= 2) {
          // If returning from manual mode, inject context about what was filled in
          const resumeContent = manualContextMessage
            ? manualContextMessage
            : "I'm back to finish my onboarding setup.";
          const resumeMsg = { role: 'user', content: resumeContent };
          const resumeMessages = [...savedMessages, resumeMsg];
          setMessages(resumeMessages);
          messagesRef.current = resumeMessages;
          setSending(true);

          const result = await sendOnboardingChatMessage({ messages: resumeMessages });
          if (result.success) {
            const modelMsg = { role: 'model', content: result.data.response };
            const updated = [...resumeMessages, modelMsg];
            setMessages(updated);
            messagesRef.current = updated;
            debouncedSave(updated);
            extractPartial(updated);

            if (isVoice) {
              // In voice mode, speak the response and start listening
              const granted = await checkAndRequest({
                onSkip: () => onSwitchToManual?.(messagesRef.current, partialData),
              });
              if (granted) {
                speakAndListen(result.data.response);
              }
            }
          }
          setSending(false);
          return;
        }
      }

      // First time — check if we have manual context to inject
      if (manualContextMessage) {
        const contextMsg = { role: 'user', content: manualContextMessage };
        setMessages([contextMsg]);
        messagesRef.current = [contextMsg];
        setSending(true);

        const result = await sendOnboardingChatMessage({ messages: [contextMsg] });
        if (result.success) {
          const modelMsg = { role: 'model', content: result.data.response };
          const updated = [contextMsg, modelMsg];
          setMessages(updated);
          messagesRef.current = updated;
          debouncedSave(updated);
          extractPartial(updated);

          if (isVoice) {
            const granted = await checkAndRequest({
              onSkip: () => onSwitchToManual?.(messagesRef.current, partialData),
            });
            if (granted) {
              speakAndListen(result.data.response);
            }
          }
        } else {
          setError(result.error);
        }
        setSending(false);
        return;
      }

      // First time, no context — trigger the opening message
      const triggerMsg = { role: 'user', content: 'Begin the Koda onboarding conversation.' };
      setMessages([triggerMsg]);
      messagesRef.current = [triggerMsg];
      setSending(true);

      const result = await sendOnboardingChatMessage({ messages: [triggerMsg] });
      if (result.success) {
        const modelMsg = { role: 'model', content: result.data.response };
        const updated = [triggerMsg, modelMsg];
        setMessages(updated);
        messagesRef.current = updated;
        debouncedSave(updated);

        if (isVoice) {
          const granted = await checkAndRequest({
            onSkip: () => onSwitchToManual?.(messagesRef.current, partialData),
          });
          if (granted) {
            speakAndListen(result.data.response);
          }
        }
      } else {
        setError(result.error);
      }
      setSending(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Voice mode: process transcript ────────────────────

  const processVoiceTranscript = useCallback(
    async (transcript) => {
      const responseText = await sendMessage(transcript);
      if (!responseText) return 'Sorry, something went wrong. Could you try that again?';
      return responseText;
    },
    [sendMessage],
  );

  // ── Continuous mic hook (voice mode) ──────────────────

  const {
    currentState,
    transcript: interimTranscript,
    silenceProgress,
    inactivityPrompt,
    start: startMic,
    stop: stopMic,
    pause: pauseMic,
    resume: resumeMic,
    speakAndListen,
  } = useContinuousMic({
    onTranscript: processVoiceTranscript,
    onInterruption: () => {},
  });

  const isSpeaking = currentState === MIC_STATE.SPEAKING;
  const isListening = currentState === MIC_STATE.LISTENING;
  const isProcessing = currentState === MIC_STATE.PROCESSING;
  const isPaused = currentState === MIC_STATE.PAUSED;

  // Stop mic on completion
  useEffect(() => {
    if (completionData && isVoice) {
      stopMic();
    }
  }, [completionData, isVoice, stopMic]);

  // ── Handle completion (save all data) ─────────────────

  const handleComplete = useCallback(() => {
    if (!completionData) return;
    stopSpeaking();

    startTransition(async () => {
      // Save all completion data
      const saveResult = await saveOnboardingCompletionData(completionData);
      if (saveResult?.success === false) {
        setError(saveResult.error);
        return;
      }

      // Mark onboarding as complete
      const completeResult = await completeOnboardingAction();
      if (completeResult?.success === false) {
        setError(completeResult.error);
        return;
      }

      onComplete?.(completionData);
    });
  }, [completionData, onComplete]);

  // ── Text form submit ──────────────────────────────────

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const text = inputValue.trim();
      if (!text || sending || completionData) return;
      setInputValue('');
      sendMessage(text);
    },
    [inputValue, sending, completionData, sendMessage],
  );

  // ── Voice controls ────────────────────────────────────

  const handleStopVoice = useCallback(() => {
    stopMic();
    setVoiceStopped(true);
  }, [stopMic]);

  const handleResumeVoice = useCallback(() => {
    setVoiceStopped(false);
    resumeMic();
  }, [resumeMic]);

  // ── Progress percentage ───────────────────────────────

  const progressPct = Math.round((itemsConfirmed / REQUIRED_ITEM_COUNT) * 100);

  // ── Render background form fill panel ─────────────────

  function renderFormFill() {
    const d = partialData;
    const hasAny = Object.keys(d).some((k) => k !== 'items_confirmed' && d[k] != null);

    if (!hasAny) {
      return (
        <EmptyPlaceholder>
          Your preferences will appear here as you chat with Koda...
        </EmptyPlaceholder>
      );
    }

    return (
      <>
        {/* Household members */}
        {d.members?.length > 0 && (
          <SectionCard $updated={updatedSections.has('members')}>
            <SectionTitle>Household</SectionTitle>
            <SectionContent>
              {d.household_size && `${d.household_size} people`}
              {d.household_type === 'includes_kids' && ' (includes kids)'}
            </SectionContent>
            {d.members.map((m, i) => (
              <MemberCard key={i} $updated={updatedSections.has('members')}>
                <MemberName>
                  {m.name || 'Member'}
                  {m.age ? `, ${m.age}` : ''}
                </MemberName>
                {m.allergies?.length > 0 && (
                  <MemberDetail>Allergies: {m.allergies.join(', ')}</MemberDetail>
                )}
                {m.dietary_restrictions?.length > 0 && (
                  <MemberDetail>Diet: {m.dietary_restrictions.join(', ')}</MemberDetail>
                )}
                {m.is_picky_eater && (
                  <MemberDetail>
                    Picky eater{m.picky_issues?.length ? `: ${m.picky_issues.join(', ')}` : ''}
                  </MemberDetail>
                )}
                {m.track_macros && <MemberDetail>Tracks macros</MemberDetail>}
              </MemberCard>
            ))}
          </SectionCard>
        )}

        {/* Schedule */}
        {(d.cook_time_preference || d.meal_plan_days) && (
          <SectionCard
            $updated={
              updatedSections.has('cook_time_preference') || updatedSections.has('meal_plan_days')
            }
          >
            <SectionTitle>Schedule</SectionTitle>
            <SectionContent>
              {d.cook_time_preference && (
                <div>
                  Cook time:{' '}
                  {{
                    under_20: 'Under 20 min',
                    '20_to_40': '20-40 min',
                    up_to_60: 'Up to an hour',
                    depends: 'Depends',
                  }[d.cook_time_preference] || d.cook_time_preference}
                </div>
              )}
              {d.meal_plan_days && (
                <DayGrid>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <DayCell key={day} $active={d.meal_plan_days?.includes(day)}>
                      {DAY_NAMES[day]}
                    </DayCell>
                  ))}
                </DayGrid>
              )}
              {d.meal_prep_days?.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Prep: {d.meal_prep_days.map((d2) => DAY_NAMES[d2]).join(', ')}
                </div>
              )}
            </SectionContent>
          </SectionCard>
        )}

        {/* Food Preferences */}
        {(d.cuisines || d.adventurousness || d.meal_prep_style || d.cooking_frustrations) && (
          <SectionCard
            $updated={updatedSections.has('cuisines') || updatedSections.has('adventurousness')}
          >
            <SectionTitle>Food Preferences</SectionTitle>
            <SectionContent>
              {d.cuisines?.length > 0 && (
                <ChipRow>
                  {d.cuisines.map((c) => (
                    <Chip key={c} $active>
                      {c}
                    </Chip>
                  ))}
                </ChipRow>
              )}
              {d.adventurousness && (
                <div style={{ marginTop: 6 }}>
                  Style:{' '}
                  {{
                    familiar: 'Keep it familiar',
                    mix_it_up: 'Mix it up',
                    surprise_me: 'Surprise me',
                  }[d.adventurousness] || d.adventurousness}
                </div>
              )}
              {d.meal_prep_style && (
                <div>
                  Prep:{' '}
                  {{ meal_prep: 'Batch prep', cook_fresh: 'Cook fresh', mix: 'Mix of both' }[
                    d.meal_prep_style
                  ] || d.meal_prep_style}
                </div>
              )}
              {d.cooking_frustrations?.length > 0 && (
                <div>
                  Frustrations: {d.cooking_frustrations.map((f) => f.replace(/_/g, ' ')).join(', ')}
                </div>
              )}
            </SectionContent>
          </SectionCard>
        )}

        {/* Budget */}
        {(d.weekly_budget || d.shopping_style || d.preferred_stores) && (
          <SectionCard
            $updated={
              updatedSections.has('weekly_budget') || updatedSections.has('preferred_stores')
            }
          >
            <SectionTitle>Budget & Shopping</SectionTitle>
            <SectionContent>
              {d.weekly_budget && <div>${d.weekly_budget}/week</div>}
              {d.shopping_style && <div>Shopping: {d.shopping_style.replace(/_/g, ' ')}</div>}
              {d.preferred_stores?.length > 0 && (
                <ChipRow>
                  {d.preferred_stores.map((s) => (
                    <Chip key={s} $active>
                      {s}
                    </Chip>
                  ))}
                </ChipRow>
              )}
            </SectionContent>
          </SectionCard>
        )}

        {/* Health */}
        {d.health_goals?.length > 0 && (
          <SectionCard $updated={updatedSections.has('health_goals')}>
            <SectionTitle>Health Goals</SectionTitle>
            <SectionContent>
              <ChipRow>
                {d.health_goals.map((g) => (
                  <Chip key={g} $active>
                    {g.replace(/_/g, ' ')}
                  </Chip>
                ))}
              </ChipRow>
              {d.daily_carb_limit && (
                <div style={{ marginTop: 4 }}>Carb limit: {d.daily_carb_limit}g/day</div>
              )}
            </SectionContent>
          </SectionCard>
        )}

        {/* Faith */}
        {d.faith_practices && d.faith_practices.has_faith_practices != null && (
          <SectionCard $updated={updatedSections.has('faith_practices')}>
            <SectionTitle>Faith Practices</SectionTitle>
            <SectionContent>
              {d.faith_practices.has_faith_practices ? 'Yes' : 'None'}
            </SectionContent>
          </SectionCard>
        )}
      </>
    );
  }

  // ── Render ────────────────────────────────────────────

  // Filter out the initial trigger message and context messages from display
  const displayMessages = messages.filter(
    (m) =>
      !(
        m.role === 'user' &&
        (m.content === 'Begin the Koda onboarding conversation.' ||
          m.content === "I'm back to finish my onboarding setup." ||
          m.content.startsWith('The user has switched back to voice setup.'))
      ),
  );

  return (
    <Wrapper>
      <TopBar>
        {onSwitchToManual && (
          <SwitchLink
            type="button"
            onClick={() => {
              if (isVoice) stopMic();
              stopSpeaking();
              // Flush pending save
              if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveConversationHistoryAction({ messages: messagesRef.current });
              }
              onSwitchToManual(messagesRef.current, partialData);
            }}
          >
            {'\u270F\uFE0F'} Switch to manual setup
          </SwitchLink>
        )}
        {isVoice && !completionData && !voiceStopped && currentState && (
          <StopButton type="button" onClick={handleStopVoice}>
            {'\u23F9'} Stop listening
          </StopButton>
        )}
      </TopBar>

      <ProgressRow>
        <ProgressBarOuter>
          <ProgressBarFill $pct={completionData ? 100 : progressPct} />
        </ProgressBarOuter>
        <ProgressLabel>
          {completionData ? '100% complete' : `${progressPct}% complete`}
        </ProgressLabel>
      </ProgressRow>

      <PanelContainer>
        {/* Left Panel: Background Form Fill */}
        <LeftPanel>{renderFormFill()}</LeftPanel>

        {/* Right Panel: Chat */}
        <RightPanel>
          {/* Voice status indicators */}
          {isVoice && (
            <VoiceStatusArea>
              {isSpeaking && <SpeakingIndicator />}
              {isListening && <ListeningIndicator showMic={false} />}
              {isProcessing && <ProcessingIndicator />}
            </VoiceStatusArea>
          )}

          <ChatArea ref={chatRef}>
            {displayMessages.map((msg, i) => (
              <MessageRow key={i} $isUser={msg.role === 'user'}>
                <Avatar $isUser={msg.role === 'user'}>{msg.role === 'user' ? 'You' : 'K'}</Avatar>
                <Bubble $isUser={msg.role === 'user'}>{msg.content}</Bubble>
              </MessageRow>
            ))}

            {sending && (
              <MessageRow $isUser={false}>
                <Avatar $isUser={false}>K</Avatar>
                <Bubble $isUser={false}>
                  <TypingDots>
                    <span />
                    <span />
                    <span />
                  </TypingDots>
                </Bubble>
              </MessageRow>
            )}

            {/* Voice: live transcript */}
            {isVoice && isListening && interimTranscript && (
              <TranscriptBubble text={interimTranscript} />
            )}

            {/* Voice: inactivity prompt */}
            {isVoice && inactivityPrompt && isListening && (
              <InactivityBanner>
                Still there? Say something or tap the mic when you&apos;re ready.
              </InactivityBanner>
            )}
          </ChatArea>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          {/* Completion: show finish button */}
          {completionData && (
            <VoiceStatusArea>
              <SendButton
                type="button"
                onClick={handleComplete}
                disabled={isPending}
                style={{ maxWidth: 280, width: '100%', height: 44 }}
              >
                {isPending ? 'Setting up...' : "Let's go!"}
              </SendButton>
            </VoiceStatusArea>
          )}

          {/* Voice mode controls */}
          {isVoice && !completionData && (
            <>
              {isPaused && !voiceStopped && (
                <VoiceStatusArea>
                  <InactivityBanner>Session paused to save battery</InactivityBanner>
                  <ResumeButton type="button" onClick={resumeMic}>
                    Resume
                  </ResumeButton>
                </VoiceStatusArea>
              )}
              {voiceStopped && (
                <VoiceStatusArea>
                  <ResumeButton type="button" onClick={handleResumeVoice}>
                    Continue with voice
                  </ResumeButton>
                  {onSwitchToManual && (
                    <SwitchLink
                      type="button"
                      onClick={() => {
                        stopSpeaking();
                        if (saveTimerRef.current) {
                          clearTimeout(saveTimerRef.current);
                          saveConversationHistoryAction({ messages: messagesRef.current });
                        }
                        onSwitchToManual(messagesRef.current, partialData);
                      }}
                    >
                      Switch to manual setup
                    </SwitchLink>
                  )}
                </VoiceStatusArea>
              )}
              {!isSTTSupported() && (
                <ErrorBanner>
                  Voice not supported in this browser. Try Chrome or Safari.
                </ErrorBanner>
              )}
            </>
          )}

          {/* Text mode input */}
          {!isVoice && !completionData && (
            <InputArea onSubmit={handleSubmit}>
              <TextInput
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer..."
                disabled={sending}
                autoFocus
              />
              <SendButton type="submit" disabled={!inputValue.trim() || sending}>
                Send
              </SendButton>
            </InputArea>
          )}
        </RightPanel>
      </PanelContainer>

      {isVoice && <PermissionModal />}
    </Wrapper>
  );
}
