'use client'

import { useState, startTransition } from 'react'
import styled from 'styled-components'
import { rateMealAction } from '@/app/(app)/meals/actions'

// ── Styled components ─────────────────────────────────────────────────────────

const RatingCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.card};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const MealRatingName = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RatingButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ThumbButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  transition: all 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    transform: scale(1.05);
  }
`

const CheckMark = styled.div`
  color: ${({ theme }) => theme.colors.teal || '#16a34a'};
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
`

const CollapseCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.card};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const CollapseHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  gap: ${({ theme }) => theme.spacing.sm};
`

const CollapseChevron = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
  display: inline-block;
`

const CollapseBody = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWithin48Hours(weekStart) {
  if (!weekStart) return true
  try {
    const now = Date.now()
    const parsed = new Date(weekStart).getTime()
    // weekStart is a YYYY-MM-DD date — treat it as "yesterday's" boundary
    // We show cards if the weekStart date is within the last 48 hours
    return now - parsed < 48 * 60 * 60 * 1000
  } catch {
    return true
  }
}

// ── Sub-component: single card ────────────────────────────────────────────────

function SingleRatingCard({ meal, onRated }) {
  const [checked, setChecked] = useState(false)

  function handleRate(rating) {
    setChecked(true)
    startTransition(async () => {
      const weekStart = meal.weekStart || new Date().toISOString().split('T')[0]
      await rateMealAction({ mealName: meal.name, rating, weekStart }).catch(() => {})
      onRated(meal.name, rating)
      // Remove card after brief animation delay
      setTimeout(() => {
        // Parent handles dismissal via rated state
      }, 1000)
    })
  }

  return (
    <RatingCard>
      <MealRatingName>{meal.name}</MealRatingName>
      <RatingButtons>
        {checked ? (
          <CheckMark>{'✓'}</CheckMark>
        ) : (
          <>
            <ThumbButton onClick={() => handleRate('thumbs_up')} aria-label="Thumbs up">
              {'👍'}
            </ThumbButton>
            <ThumbButton onClick={() => handleRate('thumbs_down')} aria-label="Thumbs down">
              {'👎'}
            </ThumbButton>
          </>
        )}
      </RatingButtons>
    </RatingCard>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MealRatingCards({ meals = [], onRated }) {
  const [ratedNames, setRatedNames] = useState(new Set())
  const [collapseOpen, setCollapseOpen] = useState(false)

  if (!meals || meals.length === 0) return null

  // Filter: not yet rated, within 48h
  const unrated = meals.filter(
    m => !ratedNames.has(m.name) && isWithin48Hours(m.weekStart)
  )

  if (unrated.length === 0) return null

  function handleRated(mealName, rating) {
    // Add a brief delay before removing so checkmark is visible
    setTimeout(() => {
      setRatedNames(prev => new Set([...prev, mealName]))
    }, 1000)
    if (onRated) onRated(mealName, rating)
  }

  // Show up to 2 directly; collapse the rest
  if (unrated.length <= 2) {
    return (
      <>
        {unrated.map(meal => (
          <SingleRatingCard key={meal.name} meal={meal} onRated={handleRated} />
        ))}
      </>
    )
  }

  // Collapsed view
  return (
    <CollapseCard>
      <CollapseHeader onClick={() => setCollapseOpen(v => !v)}>
        <span>Rate yesterday&apos;s meals ({unrated.length})</span>
        <CollapseChevron $open={collapseOpen}>{'▼'}</CollapseChevron>
      </CollapseHeader>
      {collapseOpen && (
        <CollapseBody>
          {unrated.map(meal => (
            <SingleRatingCard key={meal.name} meal={meal} onRated={handleRated} />
          ))}
        </CollapseBody>
      )}
    </CollapseCard>
  )
}
