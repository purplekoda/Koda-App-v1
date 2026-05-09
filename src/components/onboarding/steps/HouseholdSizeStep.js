'use client'

import { useState } from 'react'
import styled from 'styled-components'
import StepShell from '../shared/StepShell'
import NumberStepper from '../shared/NumberStepper'
import HouseholdMembersStep from './HouseholdMembersStep'
import ConversationalHouseholdSetup from '../ConversationalHouseholdSetup'

// ── Styled ─────────────────────────────────────────────

const ModeToggle = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ModeBtn = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
  background: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.surface};
  color: ${({ $active }) => $active ? 'white' : 'inherit'};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;

  &:not(:last-child) {
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const CountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const CountRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`

const CountLabel = styled.div`
  width: 80px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TotalRow = styled.div`
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Hint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const InfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  font-size: 13px;
  color: #92400E;
  line-height: 1.5;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const ChatSetupBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.tealLight}20;
  color: ${({ theme }) => theme.colors.teal};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    background: ${({ theme }) => theme.colors.tealLight}40;
  }
`

export default function HouseholdSizeStep({
  numAdults, numChildren, members, userName,
  onChangeAdults, onChangeChildren, onChangeMembers,
  faithPractices, onChangeFaith,
  onNext, onBack, isPending,
  voiceMode = false,
}) {
  // 'profiles' = add individual members, 'counts' = just adult/child numbers, 'conversational' = Koda chat setup
  const [mode, setMode] = useState(members.length > 0 ? 'profiles' : 'profiles')

  const total = mode === 'profiles'
    ? Math.max(members.length, 1)
    : numAdults + numChildren

  // Conversational mode renders full-screen
  if (mode === 'conversational') {
    return (
      <ConversationalHouseholdSetup
        initialMembers={members}
        faithPractices={faithPractices}
        onComplete={(updatedMembers, updatedFaith) => {
          onChangeMembers(updatedMembers)
          if (onChangeFaith) onChangeFaith(updatedFaith)
          onNext()
        }}
        onBack={() => setMode('profiles')}
      />
    )
  }

  return (
    <StepShell
      title="Who's in your household?"
      subtitle="Add your family so Koda can personalize meals for everyone."
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={mode === 'counts' ? (numAdults + numChildren) < 1 : false}
      showBack={false}
      voiceMode={voiceMode}
    >
      {!voiceMode && (
        <ChatSetupBtn type="button" onClick={() => setMode('conversational')}>
          Let Koda set this up for me
        </ChatSetupBtn>
      )}

      <ModeToggle>
        <ModeBtn
          type="button"
          $active={mode === 'profiles'}
          onClick={() => setMode('profiles')}
        >
          Add family members
        </ModeBtn>
        <ModeBtn
          type="button"
          $active={mode === 'counts'}
          onClick={() => setMode('counts')}
        >
          Family numbers
        </ModeBtn>
      </ModeToggle>

      <Hint>
        You don't have to use real names, but when Koda knows about dietary restrictions
        or picky eaters, it can accommodate everyone — so it's worth adding each person individually!
      </Hint>

      {mode === 'profiles' ? (
        <HouseholdMembersStep
          members={members}
          onChange={onChangeMembers}
          userName={userName}
          faithPractices={faithPractices}
          onChangeFaith={onChangeFaith}
          embedded
        />
      ) : (
        <>
          <CountSection>
            <CountRow>
              <CountLabel>Adults</CountLabel>
              <NumberStepper value={numAdults} onChange={onChangeAdults} min={0} max={10} />
            </CountRow>
            <CountRow>
              <CountLabel>Children</CountLabel>
              <NumberStepper value={numChildren} onChange={onChangeChildren} min={0} max={10} />
            </CountRow>
            <TotalRow>
              Cooking for {numAdults + numChildren} {(numAdults + numChildren) === 1 ? 'person' : 'people'}
            </TotalRow>
          </CountSection>

          <InfoBox>
            Without individual profiles, Koda won't be able to account for picky eaters,
            allergies, or personal preferences for each family member. You can always add
            profiles later in Settings.
          </InfoBox>
        </>
      )}
    </StepShell>
  )
}
