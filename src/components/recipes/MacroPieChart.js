'use client'

import { useState, useCallback } from 'react'
import styled from 'styled-components'

const MACROS = [
  { key: 'protein', label: 'Protein', color: '#1D9E75', calPerGram: 4, field: 'protein_g' },
  { key: 'carbs', label: 'Carbs', color: '#185FA5', calPerGram: 4, field: 'carbs_g' },
  { key: 'fat', label: 'Fat', color: '#9B6BC4', calPerGram: 9, field: 'fat_g' },
  { key: 'other', label: 'Other', color: '#D85A30', calPerGram: 0, field: null },
]

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ChartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
`

const SvgWrap = styled.div`
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
`

const CenterLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`

const CalorieCount = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`

const CalorieUnit = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const LegendItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    opacity: 0.8;
  }
`

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const MacroName = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 48px;
  text-align: left;
`

const GramsLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`

const PctLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 4px;
`

export default function MacroPieChart({ nutrition }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const calories = nutrition.calories || 0
  const proteinCal = (nutrition.protein_g || 0) * 4
  const carbsCal = (nutrition.carbs_g || 0) * 4
  const fatCal = (nutrition.fat_g || 0) * 9
  const totalMacro = proteinCal + carbsCal + fatCal
  const otherCal = Math.max(0, calories - totalMacro)

  const slices = [
    { cal: proteinCal, grams: nutrition.protein_g || 0 },
    { cal: carbsCal, grams: nutrition.carbs_g || 0 },
    { cal: fatCal, grams: nutrition.fat_g || 0 },
    { cal: otherCal, grams: otherCal > 0 ? Math.round(otherCal) : 0 },
  ]

  const handleLegendTap = useCallback((idx) => {
    setActiveIdx(idx)
    setTimeout(() => setActiveIdx(null), 800)
  }, [])

  // Build SVG segments
  let offset = 0
  const segments = slices.map((slice, i) => {
    const pct = calories > 0 ? slice.cal / calories : 0
    const length = pct * CIRCUMFERENCE
    const segment = { length, offset, color: MACROS[i].color, pct }
    offset += length
    return segment
  })

  return (
    <ChartContainer>
      <SvgWrap>
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* Background track */}
          <circle
            cx="55"
            cy="55"
            r={RADIUS}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="14"
          />
          {/* Macro segments */}
          <g transform="rotate(-90 55 55)">
            {segments.map((seg, i) => {
              if (seg.length <= 0) return null
              const isActive = activeIdx === i
              return (
                <circle
                  key={MACROS[i].key}
                  cx="55"
                  cy="55"
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isActive ? 18 : 14}
                  strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="butt"
                  style={{ transition: 'stroke-width 0.3s ease' }}
                />
              )
            })}
          </g>
        </svg>
        <CenterLabel>
          <CalorieCount>{calories}</CalorieCount>
          <CalorieUnit>Calories</CalorieUnit>
        </CenterLabel>
      </SvgWrap>

      <Legend>
        {MACROS.map((macro, i) => {
          const slice = slices[i]
          // Hide "Other" row if zero
          if (macro.key === 'other' && slice.cal <= 0) return null
          const pct = calories > 0 ? Math.round((slice.cal / calories) * 100) : 0
          const displayGrams = macro.key === 'other'
            ? `${Math.round(slice.cal)} cal`
            : `${Math.round(slice.grams * 10) / 10}g`
          return (
            <LegendItem key={macro.key} onClick={() => handleLegendTap(i)}>
              <Dot $color={macro.color} />
              <MacroName>{macro.label}</MacroName>
              <GramsLabel $color={macro.color}>{displayGrams}</GramsLabel>
              <PctLabel>{pct}%</PctLabel>
            </LegendItem>
          )
        })}
      </Legend>
    </ChartContainer>
  )
}
