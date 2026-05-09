'use client'

import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import MacroPieChart from './MacroPieChart'

// FDA daily reference values (2,000 cal diet)
const DAILY_VALUES = {
  fiber_g: 28,
  sugar_g: 50,
  sodium_mg: 2300,
  cholesterol_mg: 300,
  saturated_fat_g: 20,
  vitamin_c_mg: 90,
  iron_mg: 18,
}

const MICRO_ROWS = [
  { key: 'fiber_g', label: 'Fiber', unit: 'g', hasDv: true },
  { key: 'sugar_g', label: 'Sugar', unit: 'g', hasDv: false },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', hasDv: true },
  { key: 'cholesterol_mg', label: 'Cholesterol', unit: 'mg', hasDv: true },
  { key: 'saturated_fat_g', label: 'Saturated Fat', unit: 'g', hasDv: true },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', hasDv: true },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', hasDv: true },
]

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`

const NutritionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SkeletonBlock = styled.div`
  height: 110px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.5s infinite;
`

const ErrorText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin: 0;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`

const Divider = styled.hr`
  border: none;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.md};
`

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Chevron = styled.span`
  display: inline-flex;
  transition: transform 0.3s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  font-size: 12px;
`

const MicroList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  max-height: ${({ $expanded }) => ($expanded ? '400px' : '0')};
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  transition: max-height 0.35s ease, opacity 0.25s ease;
`

const MicroRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const MicroName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MicroRight = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MicroValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DvPercent = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 40px;
  text-align: right;
`

const EstimatedLabel = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin: ${({ theme }) => theme.spacing.md} 0 0;
`

export default function NutritionPanel({ nutrition, isEstimated, loading, error }) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <NutritionCard>
        <SkeletonBlock />
      </NutritionCard>
    )
  }

  if (error && !nutrition) {
    return (
      <NutritionCard>
        <ErrorText>Nutrition info unavailable</ErrorText>
      </NutritionCard>
    )
  }

  if (!nutrition) return null

  return (
    <NutritionCard>
      <MacroPieChart nutrition={nutrition} />

      {isEstimated && (
        <EstimatedLabel>
          Nutrition estimated by Koda &middot; values are approximate
        </EstimatedLabel>
      )}

      <Divider />

      <ToggleButton onClick={() => setExpanded(v => !v)}>
        {expanded ? 'Hide full nutrition' : 'See full nutrition'}
        <Chevron $expanded={expanded}>&#x25BC;</Chevron>
      </ToggleButton>

      <MicroList $expanded={expanded}>
        {MICRO_ROWS.map(row => {
          const value = nutrition[row.key] ?? 0
          const rounded = Math.round(value * 10) / 10
          const dvPct = row.hasDv && DAILY_VALUES[row.key]
            ? Math.round((value / DAILY_VALUES[row.key]) * 100)
            : null
          return (
            <MicroRow key={row.key}>
              <MicroName>{row.label}</MicroName>
              <MicroRight>
                <MicroValue>{rounded} {row.unit}</MicroValue>
                {dvPct !== null && <DvPercent>{dvPct}% DV</DvPercent>}
              </MicroRight>
            </MicroRow>
          )
        })}
      </MicroList>
    </NutritionCard>
  )
}
