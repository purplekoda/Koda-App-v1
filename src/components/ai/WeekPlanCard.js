'use client'

import styled from 'styled-components'
import { Card as BaseCard, ItemName, ButtonRow, ConfirmButton, RejectButton } from './SuggestionCard'

const Card = styled(BaseCard)`
  align-self: stretch;
  max-width: 100%;
`

const Range = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 10px;
`

const Row = styled.div`
  display: flex;
  font-size: 13px;
  padding: 6px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Day = styled.span`
  width: 44px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`

const Meal = styled.span`
  flex: 1;
`

const MealType = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-right: 6px;
  text-transform: capitalize;
`

const WeekButtonRow = styled(ButtonRow)``

const Save = styled(ConfirmButton)`
  flex: 1;
`

const NotNow = styled(RejectButton)`
  flex: 0 0 auto;
  padding: 8px 14px;
`

export default function WeekPlanCard({ card, onConfirm, onReject, disabled }) {
  if (!card) return null
  const { title = 'Your week of meals', range, rows = [], status } = card
  const done = !!status

  return (
    <Card>
      <ItemName>{title}</ItemName>
      {range ? <Range>{range}</Range> : null}
      {rows.map((r, i) => (
        <Row key={`${r.day}-${r.mealType || 'm'}-${i}`}>
          <Day>{r.day}</Day>
          <Meal>
            {r.mealType ? <MealType>{r.mealType}:</MealType> : null}
            {r.meal}
          </Meal>
        </Row>
      ))}
      <WeekButtonRow>
        <Save type="button" onClick={onConfirm} disabled={disabled || done}>
          {status === 'saved' ? 'Saved' : 'Save my week'}
        </Save>
        <NotNow type="button" onClick={onReject} disabled={disabled || done}>
          {status === 'dismissed' ? 'Dismissed' : 'Not now'}
        </NotNow>
      </WeekButtonRow>
    </Card>
  )
}
