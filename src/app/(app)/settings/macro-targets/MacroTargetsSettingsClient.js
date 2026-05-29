'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { saveMacroTargetsAction, calculateMacroTargetsAction } from '@/app/(app)/macros/actions'

// ─── Shared Styles ────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PageDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const MemberCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.card};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  background: ${({ $expanded, theme }) => $expanded ? theme.colors.grayLight : 'transparent'};
  transition: background 0.12s ease;
  &:hover { background: ${({ theme }) => theme.colors.grayLight}; }
`

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`

const MemberLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const MemberName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MemberAge = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const TrackingBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $on, theme }) => $on ? theme.colors.tealLight : theme.colors.grayLight};
  color: ${({ $on, theme }) => $on ? theme.colors.teal : theme.colors.textMuted};
`

const ChevronIcon = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Switch = styled.div`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;
  cursor: pointer;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '20px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: left 0.15s ease;
  }
`

const ExpandedSection = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.xl};
  &:first-child { margin-top: 0; }
`

const TargetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const TargetField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const TargetLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

const TargetInput = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  text-align: center;
  min-height: ${({ theme }) => theme.touchTarget};
  width: 100%;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    background: white;
  }
`

const TargetUnit = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`

const CalcButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  color: ${({ theme }) => theme.colors.teal};
  background: transparent;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  transition: all 0.12s ease;
  &:hover { background: ${({ theme }) => theme.colors.tealLight}; }
`

const DistributionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const DistributionLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DistributionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const DistField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const DistLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`

const DistInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1.5px solid ${({ $error, theme }) => $error ? theme.colors.coral : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  text-align: center;
  width: 100%;
  min-height: 48px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.teal}; background: white; }
`

const DistError = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.coral};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const AutoDistHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SaveButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.md};
  border: none;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const TrackToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const TrackToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 200;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  white-space: nowrap;
`

// ─── Gemini Calculator Styles ─────────────────────────────────────────────────

const CalcBox = styled.div`
  background: ${({ theme }) => theme.colors.tealLight};
  border: 0.5px solid ${({ theme }) => theme.colors.teal}40;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const CalcStep = styled.p`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const CalcLoadingText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  text-align: center;
  margin: 0;
`

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Pill = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.surface};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.textSecondary};
  cursor: pointer;
  min-height: 36px;
  transition: all 0.12s ease;
  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`

const WeightInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: white;
  min-height: ${({ theme }) => theme.touchTarget};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.teal}; }
`

const WeightInputNote = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textMuted};
`

const CalcProceedButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border: none;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const SkipLink = styled.button`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: underline;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: block;
  background: none;
  border: none;
  padding: 0;
`

const CalcSecondaryLink = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const SuggestedCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SuggestedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: 400px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const SuggestedItem = styled.div`
  text-align: center;
`

const SuggestedValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.teal};
`

const SuggestedLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const SuggestedReasoning = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  font-style: italic;
  margin: 0;
`

const UseTargetsButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

// ─── GeminiCalculator Sub-component ──────────────────────────────────────────

const GOALS = ['Lose weight', 'Maintain weight', 'Build muscle', 'Improve energy']
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active']

function GeminiCalculator({ onApply, onClose }) {
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState(null)
  const [activity, setActivity] = useState(null)
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggested, setSuggested] = useState(null)
  const [error, setError] = useState(null)
  const [, startTransition] = useTransition()

  function calculate(weightVal) {
    setLoading(true)
    setError(null)
    startTransition(async () => {
      const result = await calculateMacroTargetsAction({
        goal: goal.toLowerCase(),
        activity: activity.toLowerCase(),
        weight_optional: weightVal || null,
      })
      setLoading(false)
      if (result.success) {
        setSuggested(result.data)
        setStep(4)
      } else {
        setError(result.error || 'Could not calculate targets.')
        setStep(3)
      }
    })
  }

  if (loading) {
    return (
      <CalcBox>
        <CalcLoadingText>Calculating your targets...</CalcLoadingText>
      </CalcBox>
    )
  }

  return (
    <CalcBox>
      {step === 1 && (
        <>
          <CalcStep>What&apos;s your main goal?</CalcStep>
          <PillRow>
            {GOALS.map(g => (
              <Pill key={g} $active={goal === g} onClick={() => { setGoal(g); setStep(2) }}>
                {g}
              </Pill>
            ))}
          </PillRow>
          <CalcSecondaryLink onClick={onClose}>Cancel</CalcSecondaryLink>
        </>
      )}

      {step === 2 && (
        <>
          <CalcStep>How active are you on a typical day?</CalcStep>
          <PillRow>
            {ACTIVITY_LEVELS.map(a => (
              <Pill key={a} $active={activity === a} onClick={() => { setActivity(a); setStep(3) }}>
                {a}
              </Pill>
            ))}
          </PillRow>
          <CalcSecondaryLink onClick={() => setStep(1)}>Back</CalcSecondaryLink>
        </>
      )}

      {step === 3 && (
        <>
          <CalcStep>
            Roughly how much do you weigh?{' '}
            <WeightInputNote>(optional)</WeightInputNote>
          </CalcStep>
          <WeightInput
            type="text"
            placeholder="e.g. 150 lbs or 68 kg"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          {error && <DistError>{error}</DistError>}
          <CalcProceedButton onClick={() => calculate(weight)}>
            Calculate my targets
          </CalcProceedButton>
          <SkipLink onClick={() => calculate('')}>
            Skip and calculate without weight
          </SkipLink>
          <CalcSecondaryLink onClick={() => setStep(2)}>Back</CalcSecondaryLink>
        </>
      )}

      {step === 4 && suggested && (
        <>
          <CalcStep>Here are your suggested targets</CalcStep>
          <SuggestedCard>
            <SuggestedGrid>
              <SuggestedItem>
                <SuggestedValue>{suggested.calories}</SuggestedValue>
                <SuggestedLabel>kcal</SuggestedLabel>
              </SuggestedItem>
              <SuggestedItem>
                <SuggestedValue>{suggested.protein}g</SuggestedValue>
                <SuggestedLabel>Protein</SuggestedLabel>
              </SuggestedItem>
              <SuggestedItem>
                <SuggestedValue>{suggested.carbs}g</SuggestedValue>
                <SuggestedLabel>Carbs</SuggestedLabel>
              </SuggestedItem>
              <SuggestedItem>
                <SuggestedValue>{suggested.fat}g</SuggestedValue>
                <SuggestedLabel>Fat</SuggestedLabel>
              </SuggestedItem>
            </SuggestedGrid>
            {suggested.reasoning && (
              <SuggestedReasoning>{suggested.reasoning}</SuggestedReasoning>
            )}
          </SuggestedCard>
          <UseTargetsButton onClick={() => onApply(suggested)}>
            Use these targets
          </UseTargetsButton>
          <CalcSecondaryLink onClick={onClose}>Adjust manually instead</CalcSecondaryLink>
        </>
      )}
    </CalcBox>
  )
}

// ─── MemberTargetForm Sub-component ──────────────────────────────────────────

function MemberTargetForm({ member }) {
  const [trackMacros, setTrackMacros] = useState(member.trackMacros ?? member.track_macros ?? false)
  const [targets, setTargets] = useState({
    calories: member.targets?.calories ?? member.daily_calorie_target ?? '',
    protein: member.targets?.protein ?? member.daily_protein_target ?? '',
    carbs: member.targets?.carbs ?? member.daily_carb_target ?? '',
    fat: member.targets?.fat ?? member.daily_fat_target ?? '',
  })
  const [autoDistribute, setAutoDistribute] = useState(true)
  const [distribution, setDistribution] = useState(
    member.mealDistribution ?? member.macro_meal_distribution ?? { breakfast: 25, lunch: 35, dinner: 40 }
  )
  const [showCalc, setShowCalc] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [, startTransition] = useTransition()

  const distTotal =
    (parseInt(distribution.breakfast) || 0) +
    (parseInt(distribution.lunch) || 0) +
    (parseInt(distribution.dinner) || 0)
  const distError = !autoDistribute && distTotal !== 100

  function handleTargetChange(key, val) {
    setTargets(prev => ({ ...prev, [key]: val }))
  }

  function handleDistChange(meal, val) {
    setDistribution(prev => ({ ...prev, [meal]: val }))
  }

  function handleApplySuggested(suggested) {
    setTargets({
      calories: suggested.calories,
      protein: suggested.protein,
      carbs: suggested.carbs,
      fat: suggested.fat,
    })
    setShowCalc(false)
  }

  function handleSave() {
    setSaving(true)
    const distToSave = autoDistribute
      ? { breakfast: 25, lunch: 35, dinner: 40 }
      : {
          breakfast: parseInt(distribution.breakfast) || 0,
          lunch: parseInt(distribution.lunch) || 0,
          dinner: parseInt(distribution.dinner) || 0,
        }

    startTransition(async () => {
      const result = await saveMacroTargetsAction({
        member_id: member.id,
        track_macros: trackMacros,
        daily_calorie_target: parseInt(targets.calories) || 0,
        daily_protein_target: parseInt(targets.protein) || 0,
        daily_carb_target: parseInt(targets.carbs) || 0,
        daily_fat_target: parseInt(targets.fat) || 0,
        macro_meal_distribution: distToSave,
      })
      setSaving(false)
      if (result.success) {
        setToast('Saved!')
        setTimeout(() => setToast(null), 2500)
      } else {
        setToast(result.error || 'Could not save.')
        setTimeout(() => setToast(null), 3000)
      }
    })
  }

  return (
    <>
      <TrackToggleRow>
        <TrackToggleLabel>Track macros for {member.name}</TrackToggleLabel>
        <Switch $on={trackMacros} onClick={() => setTrackMacros(p => !p)} />
      </TrackToggleRow>

      {trackMacros && (
        <>
          <SectionTitle>Daily targets</SectionTitle>
          <TargetGrid>
            {[
              { key: 'calories', label: 'Calories', unit: 'kcal' },
              { key: 'protein', label: 'Protein', unit: 'g' },
              { key: 'carbs', label: 'Carbs', unit: 'g' },
              { key: 'fat', label: 'Fat', unit: 'g' },
            ].map(({ key, label, unit }) => (
              <TargetField key={key}>
                <TargetLabel>{label}</TargetLabel>
                <TargetInput
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={targets[key]}
                  onChange={e => handleTargetChange(key, e.target.value)}
                  placeholder="0"
                />
                <TargetUnit>{unit}</TargetUnit>
              </TargetField>
            ))}
          </TargetGrid>

          {!showCalc && (
            <CalcButton onClick={() => setShowCalc(true)}>
              Help me calculate my targets
            </CalcButton>
          )}

          {showCalc && (
            <GeminiCalculator onApply={handleApplySuggested} onClose={() => setShowCalc(false)} />
          )}

          <SectionTitle>Per meal distribution</SectionTitle>
          <DistributionRow>
            <DistributionLabel>Let Koda distribute automatically</DistributionLabel>
            <Switch $on={autoDistribute} onClick={() => setAutoDistribute(p => !p)} />
          </DistributionRow>

          {autoDistribute && (
            <AutoDistHint>25% breakfast &middot; 35% lunch &middot; 40% dinner</AutoDistHint>
          )}

          {!autoDistribute && (
            <>
              <DistributionGrid>
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                  <DistField key={meal}>
                    <DistLabel>{meal.charAt(0).toUpperCase() + meal.slice(1)}</DistLabel>
                    <DistInput
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      value={distribution[meal]}
                      onChange={e => handleDistChange(meal, e.target.value)}
                      $error={distError}
                    />
                    <TargetUnit>%</TargetUnit>
                  </DistField>
                ))}
              </DistributionGrid>
              {distError && (
                <DistError>
                  Breakfast + lunch + dinner must add up to 100% (currently {distTotal}%)
                </DistError>
              )}
            </>
          )}
        </>
      )}

      <SaveButton onClick={handleSave} disabled={saving || (!autoDistribute && distError)}>
        {saving ? 'Saving...' : 'Save'}
      </SaveButton>

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MacroTargetsSettingsClient({ members }) {
  const [expandedId, setExpandedId] = useState(members[0]?.id ?? null)

  return (
    <PageWrapper>
      <BackLink href="/settings">{'←'} Settings</BackLink>
      <PageTitle>Macro targets</PageTitle>
      <PageDesc>
        Set daily calorie and macro goals for each household member. Turn on tracking to
        unlock the Macros tab for that member.
      </PageDesc>

      {members.length === 0 && (
        <MemberAge style={{ display: 'block', textAlign: 'center', padding: '24px 0' }}>
          No household members found.
        </MemberAge>
      )}

      {members.map(member => (
        <MemberCard key={member.id}>
          <MemberRow
            $expanded={expandedId === member.id}
            onClick={() => setExpandedId(id => id === member.id ? null : member.id)}
          >
            <MemberInfo>
              <Avatar $color={member.color}>{member.initial}</Avatar>
              <MemberLabel>
                <MemberName>{member.name}</MemberName>
                <MemberAge>{member.ageGroup}</MemberAge>
              </MemberLabel>
            </MemberInfo>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrackingBadge $on={member.trackMacros ?? member.track_macros}>
                {(member.trackMacros ?? member.track_macros) ? 'Tracking' : 'Off'}
              </TrackingBadge>
              <ChevronIcon>{expandedId === member.id ? '▲' : '▼'}</ChevronIcon>
            </div>
          </MemberRow>

          {expandedId === member.id && (
            <ExpandedSection>
              <MemberTargetForm member={member} />
            </ExpandedSection>
          )}
        </MemberCard>
      ))}
    </PageWrapper>
  )
}
