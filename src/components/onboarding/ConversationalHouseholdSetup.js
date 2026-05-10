'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import styled, { keyframes, css } from 'styled-components';
import HouseholdMembersStep from './steps/HouseholdMembersStep';
import { useVoiceInput } from '@/lib/voice/useVoiceInput';
import { useVoiceOutput } from '@/lib/voice/useVoiceOutput';
import { useMicPermission } from '@/hooks/useMicPermission';
import { FAITH_PRACTICE_OPTIONS } from '@/data/faith-practices';
import { COMPLETION_MARKER } from '@/data/household-chat-flow';
import {
  sendHouseholdChatMessage,
  extractPartialHouseholdData,
  saveHouseholdMemberProgressAction,
  saveHouseholdFaithAction,
} from '@/app/(onboarding)/onboarding/household-chat-actions';

// ── Animations ────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(29, 158, 117, 0); }
`;

// ── Layout ────────────────────────────────────────────────

const SplitWrapper = styled.div`
  display: flex;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const ChatPanel = styled.div`
  flex: 0.6;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex: none;
    height: 60vh;
    border-right: none;
    border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

const CardsPanel = styled.div`
  flex: 0.4;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex: none;
    height: 40vh;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const CardsPanelHeader = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// ── Chat area ─────────────────────────────────────────────

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`;

const KodaDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`;

const ChatTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`;

const MicStatus = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $active, theme }) => ($active ? theme.colors.tealLight + '40' : theme.colors.borderLight)};
  color: ${({ $active, theme }) => ($active ? theme.colors.teal : theme.colors.textMuted)};
  transition: all 0.2s;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BubbleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 85%;
  animation: ${fadeIn} 0.25s ease;
  ${({ $role }) => $role === 'user' && 'flex-direction: row-reverse;'}
`;

const BubbleAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealLight : theme.colors.teal};
  color: ${({ $role, theme }) => ($role === 'user' ? theme.colors.teal : 'white')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`;

const Bubble = styled.div`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealLight : theme.colors.background};
  color: ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealDark : theme.colors.textPrimary};
  border: 1px solid ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealMid : theme.colors.borderLight};
  border-bottom-right-radius: ${({ $role }) => ($role === 'user' ? '4px' : undefined)};
  border-bottom-left-radius: ${({ $role }) => ($role === 'koda' ? '4px' : undefined)};
`;

const TypingIndicator = styled.div`
  align-self: flex-start;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  animation: ${fadeIn} 0.2s ease;
`;

// ── Input bar ─────────────────────────────────────────────

const InputArea = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`;

const TextInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.teal}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const MicButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${({ $listening, theme }) => ($listening ? theme.colors.teal : theme.colors.borderLight)};
  color: ${({ $listening, theme }) => ($listening ? 'white' : theme.colors.textMuted)};
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  position: relative;

  &:hover { background: ${({ theme }) => theme.colors.teal}; color: white; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ListeningRing = styled.span`
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.teal};
  animation: ${pulse} 1.5s ease-in-out infinite;
  pointer-events: none;
`;

const SendButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// ── Summary ───────────────────────────────────────────────

const SummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const SummaryCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`;

const SummaryName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SummaryDetail = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

const Tag = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 600;
  background: ${({ $color }) => $color || '#e5e5e5'};
  color: ${({ $textColor }) => $textColor || '#333'};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const PrimaryBtn = styled.button`
  flex: 1;
  height: 44px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
  flex: 1;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
`;

// ── Active member highlight wrapper ───────────────────────

const ActiveCardWrapper = styled.div`
  ${({ $active }) => $active && css`animation: ${glowPulse} 2s ease-in-out infinite;`}
  border-radius: 12px;
`;

// ── Helpers (module-level, no state) ─────────────────────

function stripCompletionMarker(text) {
  const idx = text.indexOf(COMPLETION_MARKER);
  if (idx < 0) return text;
  return text.substring(0, idx).trim();
}

function checkCompletionInResponse(responseText) {
  const idx = responseText.indexOf(COMPLETION_MARKER);
  if (idx < 0) return null;
  const afterMarker = responseText.substring(idx + COMPLETION_MARKER.length).trim();
  try {
    return JSON.parse(afterMarker);
  } catch {
    console.error('[checkCompletion] Failed to parse JSON after marker');
    return null;
  }
}

// ── Component ─────────────────────────────────────────────

/**
 * Goal-based household setup — Gemini drives the entire conversation.
 * The code only relays messages and watches for the HOUSEHOLD_SETUP_COMPLETE marker.
 *
 * Two phases: 'chatting' and 'complete'.
 */

export default function ConversationalHouseholdSetup({
  initialMembers = [],
  onComplete,
  onBack,
  faithPractices: initialFaith = {},
}) {
  // ── Core state ────────────────────────────────────────
  const [phase, setPhase] = useState('chatting');
  const [members, setMembers] = useState(initialMembers);
  const [faithPractices, setFaithPractices] = useState(initialFaith);
  const [completionData, setCompletionData] = useState(null);

  // Chat state — messages use {role, content} for Gemini compatibility
  // and {role, text} for display. We keep both formats.
  const [displayMessages, setDisplayMessages] = useState([]);
  const [geminiHistory, setGeminiHistory] = useState([]); // {role: 'user'|'model', content}
  const [draft, setDraft] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);
  const micActive = useRef(true);
  const handleUserMessageRef = useRef(null);
  const [micMuted, setMicMuted] = useState(false);

  // Voice
  const {
    isListening,
    interimText,
    supported: sttSupported,
    startVoiceInput,
    stopVoiceInput,
    clearError,
  } = useVoiceInput();
  const { speak, supported: ttsSupported } = useVoiceOutput();
  const { checkAndRequest, PermissionModal } = useMicPermission();

  // ── Helpers ───────────────────────────────────────────

  function addDisplay(role, text) {
    setDisplayMessages((prev) => [...prev, { role, text }]);
  }

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, processing]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  // ── Auto-listen ───────────────────────────────────────

  const beginListening = useCallback(() => {
    if (!micActive.current || micMuted) return;
    startVoiceInput((finalText) => {
      if (finalText.trim()) {
        handleUserMessageRef.current?.(finalText.trim());
      }
    });
  }, [micMuted, startVoiceInput]);

  // ── Update background cards via partial extraction ────

  const updateCardsFromConversation = useCallback(async (history) => {
    const result = await extractPartialHouseholdData({ messages: history });
    if (result.success && result.data.members?.length) {
      const cardMembers = result.data.members.map((m) => ({
        name: m.name || 'Unknown',
        age: m.age ?? null,
        age_group: m.age != null && m.age <= 17 ? 'child' : 'adult',
        is_picky_eater: m.is_picky_eater ?? false,
        picky_issues: [
          ...(m.picky_issues || []),
          ...(m.picky_favorites || []).map((f) => `Loves: ${f}`),
        ],
        allergies: m.allergies || [],
        dietary_restrictions: m.dietary_restrictions || [],
        track_macros: m.track_macros ?? false,
        macro_calories: m.macro_calories ?? null,
        macro_protein_g: m.macro_protein_g ?? null,
        macro_carbs_g: m.macro_carbs_g ?? null,
        macro_fat_g: m.macro_fat_g ?? null,
        individual_faith_practices: null,
      }));
      setMembers(cardMembers);
    }
  }, []);

  // ── Greet on mount ────────────────────────────────────

  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

    async function init() {
      // Send a trigger message to Gemini so it generates the opening message
      const trigger = 'Start the household setup conversation now.';

      const initialHistory = [{ role: 'user', content: trigger }];

      setProcessing(true);
      const result = await sendHouseholdChatMessage({ messages: initialHistory });
      setProcessing(false);

      if (result.success) {
        // Only display Gemini's response — the trigger is not shown
        setGeminiHistory([
          { role: 'user', content: trigger },
          { role: 'model', content: result.data.response },
        ]);
        addDisplay('koda', stripCompletionMarker(result.data.response));

        // Extract partial data for cards
        updateCardsFromConversation([
          { role: 'user', content: trigger },
          { role: 'model', content: result.data.response },
        ]);
      } else {
        // Retry once — if Gemini is unavailable, show a minimal error
        addDisplay('koda', 'Having trouble connecting. Please refresh to try again.');
        setGeminiHistory([
          { role: 'user', content: trigger },
          { role: 'model', content: 'Having trouble connecting. Please refresh to try again.' },
        ]);
      }

      // Auto-start mic
      if (sttSupported) {
        try {
          const state = await navigator.permissions.query({ name: 'microphone' });
          let granted = state.state === 'granted';
          if (!granted) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            granted = true;
          }
          if (granted) setTimeout(() => beginListening(), 1200);
        } catch {
          // Mic not available — user can type
        }
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop mic when complete
  useEffect(() => {
    if (phase === 'complete') {
      micActive.current = false;
      stopVoiceInput();
    }
  }, [phase, stopVoiceInput]);

  // ── Handle completed setup data ───────────────────────

  async function handleSetupComplete(data) {
    const finalMembers = (data.members || []).map((m) => ({
      name: m.name,
      age: m.age ?? null,
      age_group: m.age != null && m.age <= 17 ? 'child' : 'adult',
      is_picky_eater: m.is_picky_eater ?? false,
      picky_issues: [
        ...(m.picky_issues || []),
        ...(m.picky_favorites || []).map((f) => `Loves: ${f}`),
      ],
      allergies: m.allergies || [],
      dietary_restrictions: m.dietary_restrictions || [],
      track_macros: m.track_macros ?? false,
      macro_calories: m.macro_calories ?? null,
      macro_protein_g: m.macro_protein_g ?? null,
      macro_carbs_g: m.macro_carbs_g ?? null,
      macro_fat_g: m.macro_fat_g ?? null,
      individual_faith_practices: null,
    }));

    // Build faith practices object
    let finalFaith = { ...faithPractices };
    if (data.faith_practices?.has_faith_practices) {
      finalFaith.follows_faith_based_diet = true;
      finalFaith.household_faith_practices = (data.faith_practices.practices || []).map(
        (p) => p.practice_id,
      );

      for (const practice of data.faith_practices.practices || []) {
        const fp = FAITH_PRACTICE_OPTIONS.find((p) => p.id === practice.practice_id);
        const appliesTo =
          practice.applies_to === 'all'
            ? finalMembers.map((m) => m.name)
            : practice.applies_to || [];

        for (const memberName of appliesTo) {
          const member = finalMembers.find(
            (m) => m.name.toLowerCase() === memberName.toLowerCase(),
          );
          if (member) {
            member.individual_faith_practices = {
              ...(member.individual_faith_practices || {}),
              follows_individual_faith_diet: true,
              individual_faith_practices: [
                ...(member.individual_faith_practices?.individual_faith_practices || []),
                practice.practice_id,
              ],
              ...(fp?.levelField && practice.level ? { [fp.levelField]: practice.level } : {}),
            };
          }
        }

        if (fp?.levelField && practice.level) {
          finalFaith[fp.levelField] = practice.level;
        }
      }
    }

    setMembers(finalMembers);
    setFaithPractices(finalFaith);
    setCompletionData(data);
    setPhase('complete');

    startTransition(async () => {
      await saveHouseholdMemberProgressAction(finalMembers);
      if (finalFaith.follows_faith_based_diet) {
        await saveHouseholdFaithAction(finalFaith);
      }
    });
  }

  // ── Handle user message — the core relay ──────────────

  async function handleUserMessage(text) {
    // Show in chat
    addDisplay('user', text);

    // Build updated history
    const updatedHistory = [...geminiHistory, { role: 'user', content: text }];

    // Send to Gemini
    setProcessing(true);
    stopVoiceInput();

    const result = await sendHouseholdChatMessage({ messages: updatedHistory });

    setProcessing(false);

    if (!result.success) {
      addDisplay('koda', 'Sorry, something went wrong. Could you try saying that again?');
      setTimeout(() => beginListening(), 800);
      return;
    }

    const responseText = result.data.response;
    const fullHistory = [...updatedHistory, { role: 'model', content: responseText }];
    setGeminiHistory(fullHistory);

    // Check for completion
    const data = checkCompletionInResponse(responseText);
    if (data) {
      // Show the farewell text (before the marker)
      const farewell = stripCompletionMarker(responseText);
      if (farewell) addDisplay('koda', farewell);

      // Process and save the completed data
      await handleSetupComplete(data);
    } else {
      // Normal conversational response — show it and keep going
      addDisplay('koda', responseText);

      // Update background cards (fire and forget)
      updateCardsFromConversation(fullHistory);

      // Resume listening
      setTimeout(() => beginListening(), 800);
    }
  }

  // Keep ref in sync so beginListening can call it
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  });

  // ── Final actions ─────────────────────────────────────

  function handleComplete() {
    onComplete?.(members, faithPractices);
  }

  function handleEditRequest() {
    // Reset to chatting — tell Gemini to start over
    setPhase('chatting');
    micActive.current = true;
    setCompletionData(null);

    const editMsg = 'I need to change some information. Can we go through everyone again?';
    handleUserMessage(editMsg);
  }

  // ── Submit handler ────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || processing) return;
    setDraft('');
    handleUserMessage(text);
  }

  // ── Voice handler (mute/unmute toggle) ─────────────────

  function handleMicToggle() {
    clearError();
    if (micMuted) {
      setMicMuted(false);
      beginListening();
    } else {
      setMicMuted(true);
      stopVoiceInput();
    }
  }

  // Restart listening when unmuted
  useEffect(() => {
    if (!micMuted && !processing && !isListening && micActive.current) {
      beginListening();
    }
  }, [micMuted, processing, isListening, beginListening]);

  // ── Display value for input ───────────────────────────

  const displayValue = isListening && interimText ? interimText : draft;

  // ── Build member cards for right panel ────────────────

  const memberCards = members.map((m, i) => ({
    ...m,
    age_group: m.age != null && m.age <= 17 ? 'child' : 'adult',
    is_owner: i === 0,
  }));

  // ── Render ────────────────────────────────────────────

  return (
    <SplitWrapper>
      {/* ── Left: Chat ── */}
      <ChatPanel>
        <ChatHeader>
          <KodaDot />
          <ChatTitle>Household Setup</ChatTitle>
          {sttSupported && phase !== 'complete' && (
            <MicStatus $active={isListening && !micMuted}>
              {micMuted ? 'Mic muted' : isListening ? 'Mic live' : 'Mic ready'}
            </MicStatus>
          )}
        </ChatHeader>

        <MessagesArea ref={scrollRef}>
          {displayMessages.map((msg, i) => (
            <BubbleRow key={i} $role={msg.role}>
              <BubbleAvatar $role={msg.role}>{msg.role === 'user' ? 'You' : 'K'}</BubbleAvatar>
              <Bubble $role={msg.role}>{msg.text}</Bubble>
            </BubbleRow>
          ))}

          {processing && <TypingIndicator>Koda is thinking{'\u2026'}</TypingIndicator>}

          {/* Summary section rendered inline in chat when complete */}
          {phase === 'complete' && (
            <SummarySection>
              {members.map((m, i) => (
                <SummaryCard key={i}>
                  <SummaryName>
                    {m.name}
                    {m.age != null ? ` (age ${m.age})` : ''}
                  </SummaryName>
                  {m.allergies?.length > 0 && (
                    <TagRow>
                      {m.allergies.map((a) => (
                        <Tag key={a} $color="#FEE2E2" $textColor="#991B1B">
                          {a}
                        </Tag>
                      ))}
                    </TagRow>
                  )}
                  {m.dietary_restrictions?.length > 0 && (
                    <SummaryDetail>Diet: {m.dietary_restrictions.join(', ')}</SummaryDetail>
                  )}
                  {m.is_picky_eater && (
                    <TagRow>
                      {(m.picky_issues || []).map((p) => (
                        <Tag key={p} $color="#FEF3C7" $textColor="#92400E">
                          {p}
                        </Tag>
                      ))}
                    </TagRow>
                  )}
                  {m.track_macros && (
                    <SummaryDetail>
                      Macros:{' '}
                      {[
                        m.macro_calories && `${m.macro_calories} cal`,
                        m.macro_protein_g && `${m.macro_protein_g}g protein`,
                        m.macro_carbs_g && `${m.macro_carbs_g}g carbs`,
                        m.macro_fat_g && `${m.macro_fat_g}g fat`,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'tracking enabled'}
                    </SummaryDetail>
                  )}
                  {m.individual_faith_practices?.follows_individual_faith_diet && (
                    <SummaryDetail>
                      Faith:{' '}
                      {(m.individual_faith_practices.individual_faith_practices || [])
                        .map((id) => {
                          const p = FAITH_PRACTICE_OPTIONS.find((fp) => fp.id === id);
                          return p?.name || id;
                        })
                        .join(', ')}
                    </SummaryDetail>
                  )}
                </SummaryCard>
              ))}
              <ButtonRow>
                <PrimaryBtn type="button" onClick={handleComplete} disabled={isPending}>
                  {isPending ? 'Saving\u2026' : 'Looks great \u2014 let\u2019s go!'}
                </PrimaryBtn>
                <SecondaryBtn type="button" onClick={handleEditRequest}>
                  I need to change something
                </SecondaryBtn>
              </ButtonRow>
            </SummarySection>
          )}
        </MessagesArea>

        {phase !== 'complete' && (
          <InputArea onSubmit={handleSubmit}>
            <TextInput
              ref={inputRef}
              value={displayValue}
              onChange={(e) => {
                if (!isListening) setDraft(e.target.value);
              }}
              placeholder={
                isListening
                  ? 'Listening \u2014 just speak your answer\u2026'
                  : processing
                    ? 'Koda is thinking\u2026'
                    : micMuted
                      ? 'Mic muted \u2014 type or tap mic to unmute'
                      : 'Type your answer\u2026'
              }
              maxLength={500}
              disabled={processing}
              readOnly={isListening && !micMuted}
            />
            {sttSupported && (
              <MicButton
                type="button"
                $listening={isListening && !micMuted}
                onClick={handleMicToggle}
                disabled={processing}
                aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
                title={
                  micMuted ? 'Mic is muted \u2014 tap to unmute' : 'Mic is live \u2014 tap to mute'
                }
              >
                {micMuted ? (
                  '\uD83D\uDD07'
                ) : (
                  <>
                    {isListening ? '\uD83C\uDFA4' : '\uD83C\uDFA4'}
                    {isListening && <ListeningRing />}
                  </>
                )}
              </MicButton>
            )}
            <SendButton type="submit" disabled={processing || (!draft.trim() && !isListening)}>
              Send
            </SendButton>
          </InputArea>
        )}
      </ChatPanel>

      {/* ── Right: Cards ── */}
      <CardsPanel>
        <CardsPanelHeader>
          {members.length > 0
            ? `Your Household (${members.length} ${members.length === 1 ? 'member' : 'members'})`
            : 'Your Household'}
        </CardsPanelHeader>
        {members.length > 0 ? (
          <HouseholdMembersStep
            members={memberCards}
            onChange={() => {}}
            embedded
            displayMode
            activeMemberIdx={null}
          />
        ) : (
          <SummaryDetail style={{ textAlign: 'center', padding: '32px 0' }}>
            Members will appear here as you tell Koda about your family.
          </SummaryDetail>
        )}
      </CardsPanel>

      <PermissionModal />
    </SplitWrapper>
  );
}
