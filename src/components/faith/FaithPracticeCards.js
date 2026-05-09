'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { FAITH_PRACTICE_OPTIONS } from '@/data/faith-practices'

// ── Styled Components ─────────────────────────────────────

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const IntroText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.5;
`

const Card = styled.div`
  border: 1.5px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.tealLight + '15' : theme.colors.surface};
  overflow: hidden;
  transition: border-color 0.15s ease, background 0.15s ease;
`

const CardHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
`

const CardEmoji = styled.span`
  font-size: 22px;
  flex-shrink: 0;
`

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`

const CardName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CardDescription = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
`

const Checkbox = styled.div`
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 2px solid ${({ $checked, theme }) =>
    $checked ? theme.colors.teal : theme.colors.border};
  background: ${({ $checked, theme }) =>
    $checked ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  color: #fff;
  font-size: 12px;
`

const ExpandedPanel = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const PanelNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.sm};
  line-height: 1.4;
  font-style: italic;
`

// ── Observance Level Options ──────────────────────────────

const LevelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const LevelOption = styled.button`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.tealLight + '20' : theme.colors.background};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
`

const Radio = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $selected, theme }) =>
      $selected ? theme.colors.teal : 'transparent'};
  }
`

const LevelLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const LevelSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
`

// ── Toggle option (for LDS multi-toggle) ──────────────────

const ToggleRow = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ $on, theme }) =>
    $on ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $on, theme }) =>
    $on ? theme.colors.tealLight + '20' : theme.colors.background};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
`

const ToggleSwitch = styled.div`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.borderLight)};
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '18px' : '2px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: left 0.2s ease;
  }
`

// ── Freeform input ────────────────────────────────────────

const FreeformInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  margin-top: ${({ theme }) => theme.spacing.md};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }
`

const BottomNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: ${({ theme }) => theme.spacing.lg};
  line-height: 1.5;
`

// ── Main Component ────────────────────────────────────────

/**
 * Reusable faith practice selection cards.
 *
 * @param {Object} props
 * @param {string[]} props.practices - Selected practice IDs
 * @param {Object} props.practiceDetails - Level/toggle details per practice
 * @param {Function} props.onChange - (practices[], details{}) => void
 * @param {boolean} [props.disabled]
 */
export default function FaithPracticeCards({ practices = [], practiceDetails = {}, onChange, disabled }) {
  const [customText, setCustomText] = useState(practiceDetails.custom_practice || '')

  function togglePractice(id) {
    if (disabled) return
    const newPractices = practices.includes(id)
      ? practices.filter(p => p !== id)
      : [...practices, id]

    // If deselecting, clear details for that practice
    let newDetails = { ...practiceDetails }
    if (!newPractices.includes(id)) {
      const practice = FAITH_PRACTICE_OPTIONS.find(p => p.id === id)
      if (practice?.levelField) {
        delete newDetails[practice.levelField]
      }
      // Clear LDS toggles
      if (id === 'lds') {
        delete newDetails.is_lds
        delete newDetails.lds_no_coffee
        delete newDetails.lds_no_alcohol
        delete newDetails.lds_no_black_tea
      }
      if (id === 'orthodox') {
        delete newDetails.orthodox_fasting
        delete newDetails.orthodox_fasting_calendar
      }
    } else {
      // If selecting LDS, default all toggles on
      if (id === 'lds') {
        newDetails.is_lds = true
        newDetails.lds_no_coffee = true
        newDetails.lds_no_alcohol = true
        newDetails.lds_no_black_tea = true
      }
      if (id === 'orthodox') {
        newDetails.orthodox_fasting = true
      }
      if (id === 'catholic_lenten') {
        newDetails.catholic_lenten = true
      }
    }

    onChange(newPractices, newDetails)
  }

  function setLevel(levelField, value) {
    if (disabled) return
    const newDetails = { ...practiceDetails, [levelField]: value }
    onChange(practices, newDetails)
  }

  function toggleLDSField(field) {
    if (disabled) return
    const newDetails = { ...practiceDetails, [field]: !practiceDetails[field] }
    onChange(practices, newDetails)
  }

  function handleCustomChange(e) {
    const val = e.target.value
    setCustomText(val)
    const newDetails = { ...practiceDetails, custom_practice: val }
    onChange(practices, newDetails)
  }

  return (
    <CardList>
      <IntroText>
        Koda respects all dietary traditions. Select any that apply and we will honor them across all meal planning.
      </IntroText>

      {FAITH_PRACTICE_OPTIONS.map(practice => {
        const selected = practices.includes(practice.id)

        return (
          <Card key={practice.id} $selected={selected}>
            <CardHeader type="button" onClick={() => togglePractice(practice.id)}>
              <CardEmoji>{practice.emoji}</CardEmoji>
              <CardBody>
                <CardName>{practice.name}</CardName>
                <CardDescription>{practice.description}</CardDescription>
              </CardBody>
              <Checkbox $checked={selected}>
                {selected && '\u2713'}
              </Checkbox>
            </CardHeader>

            {selected && practice.selectType !== 'boolean' && (
              <ExpandedPanel>
                {practice.introNote && (
                  <PanelNote>{practice.introNote}</PanelNote>
                )}

                {/* Single-select levels */}
                {practice.selectType === 'single' && (
                  <LevelList>
                    {practice.observanceLevels.map(level => (
                      <LevelOption
                        key={level.value}
                        type="button"
                        $selected={practiceDetails[practice.levelField] === level.value}
                        onClick={() => setLevel(practice.levelField, level.value)}
                      >
                        <Radio $selected={practiceDetails[practice.levelField] === level.value} />
                        <CardBody>
                          <LevelLabel>{level.label}</LevelLabel>
                          <LevelSubtitle>{level.subtitle}</LevelSubtitle>
                        </CardBody>
                      </LevelOption>
                    ))}
                  </LevelList>
                )}

                {/* Multi-toggle (LDS) */}
                {practice.selectType === 'multi_toggle' && (
                  <LevelList>
                    {practice.observanceLevels.map(level => (
                      <ToggleRow
                        key={level.value}
                        type="button"
                        $on={practiceDetails[level.value] !== false}
                        onClick={() => toggleLDSField(level.value)}
                      >
                        <ToggleSwitch $on={practiceDetails[level.value] !== false} />
                        <CardBody>
                          <LevelLabel>{level.label}</LevelLabel>
                          <LevelSubtitle>{level.subtitle}</LevelSubtitle>
                        </CardBody>
                      </ToggleRow>
                    ))}
                  </LevelList>
                )}

                {/* Boolean with toggle (Orthodox) */}
                {practice.selectType === 'boolean_with_toggle' && (
                  <LevelList>
                    {practice.observanceLevels.map(level => (
                      <ToggleRow
                        key={level.value}
                        type="button"
                        $on={practiceDetails[level.value] === true}
                        onClick={() => toggleLDSField(level.value)}
                      >
                        <ToggleSwitch $on={practiceDetails[level.value] === true} />
                        <CardBody>
                          <LevelLabel>{level.label}</LevelLabel>
                          <LevelSubtitle>{level.subtitle}</LevelSubtitle>
                        </CardBody>
                      </ToggleRow>
                    ))}
                  </LevelList>
                )}

                {/* Freeform (Other) */}
                {practice.selectType === 'freeform' && (
                  <FreeformInput
                    type="text"
                    placeholder="Describe your dietary practice..."
                    value={customText}
                    onChange={handleCustomChange}
                    maxLength={200}
                  />
                )}

                {practice.closingNote && (
                  <PanelNote>{practice.closingNote}</PanelNote>
                )}
              </ExpandedPanel>
            )}
          </Card>
        )
      })}

      <BottomNote>
        For certified or strict observance levels we recommend verifying specific ingredient and preparation requirements with your religious authority as requirements can vary by community and interpretation.
      </BottomNote>
    </CardList>
  )
}
