'use client'

import { useState, useEffect, useTransition } from 'react'
import styled from 'styled-components'
import { fetchWeeklyExtras, fetchMonthlyExtras, updateMacroExtraAction } from '@/app/(app)/macros/actions'

const MEAL_TIME_LABELS = {
  breakfast_addition: 'Breakfast',
  morning_snack: 'AM Snack',
  lunch_addition: 'Lunch',
  afternoon_snack: 'PM Snack',
  evening_snack: 'Evening',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ─── Helpers ──────────────────────────────────────────

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function getWeekDates(weekStart) {
  const dates = []
  const start = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// ─── Styles ───────────────────────────────────────────

const Wrapper = styled.div``

const ToggleRow = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 2px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ToggleBtn = styled.button`
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  min-height: 32px;
  color: ${({ $active, theme }) => $active ? theme.colors.surface : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
`

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
`

// Weekly styles
const DayRow = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
`

const DayHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  text-align: left;
  cursor: pointer;
  border-bottom: ${({ $expanded, theme }) => $expanded ? `0.5px solid ${theme.colors.borderLight}` : 'none'};
`

const DayInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const DayDate = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.teal : theme.colors.textPrimary};
`

const DaySummary = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ExpandIcon = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
`

const ExtraItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const ExtraThumb = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.grayLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

const ExtraInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ExtraName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: block;
`

const ExtraMeta = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ExtraMacros = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

const EditBtn = styled.button`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

// Edit modal
const EditOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
`

const EditCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 400px;
  width: 100%;
`

const EditTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const EditFieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const EditField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const EditLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
`

const EditInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 16px;
  font-weight: 600;
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const EditButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const SaveBtn = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;

  &:disabled { opacity: 0.5; }
`

const CancelBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

// Monthly styles
const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MonthTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.grayLight};

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md};
`

const CalendarHeader = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xs};
`

const CalendarDay = styled.button`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 13px;
  color: ${({ $hasData, theme }) => $hasData ? theme.colors.textPrimary : theme.colors.textMuted};
  font-weight: ${({ $hasData }) => $hasData ? 500 : 400};
  cursor: ${({ $hasData }) => $hasData ? 'pointer' : 'default'};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight : 'transparent'};

  &:hover {
    background: ${({ $hasData, theme }) => $hasData ? theme.colors.grayLight : 'transparent'};
  }
`

const CalendarDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const DayDetail = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const DayDetailTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const DayDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child { border-bottom: none; }
`

// ─── Component ────────────────────────────────────────

export default function MacroHistory({ memberId, memberName, targets }) {
  const [mode, setMode] = useState('weekly')
  const [weeklyExtras, setWeeklyExtras] = useState([])
  const [monthlyExtras, setMonthlyExtras] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
  const [editingExtra, setEditingExtra] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [selectedMonthDay, setSelectedMonthDay] = useState(null)
  const [, startTransition] = useTransition()
  const [savingEdit, setSavingEdit] = useState(false)

  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const weekStart = getWeekStart()
  const weekDates = getWeekDates(weekStart)
  const todayStr = new Date().toISOString().slice(0, 10)

  // Load weekly data
  useEffect(() => {
    startTransition(async () => {
      const result = await fetchWeeklyExtras(memberId, weekStart)
      if (result.success) setWeeklyExtras(result.data || [])
    })
  }, [memberId, weekStart, startTransition])

  // Load monthly data when switching to monthly
  useEffect(() => {
    if (mode !== 'monthly') return
    startTransition(async () => {
      const result = await fetchMonthlyExtras(memberId, monthYear.year, monthYear.month)
      if (result.success) setMonthlyExtras(result.data || [])
    })
  }, [memberId, mode, monthYear, startTransition])

  // ─── Edit Handlers ──────────────────────────────────

  function openEdit(extra) {
    setEditingExtra(extra)
    setEditValues({
      calories: extra.calories,
      protein: extra.protein,
      carbs: extra.carbs,
      fat: extra.fat,
    })
  }

  async function saveEdit() {
    if (!editingExtra) return
    setSavingEdit(true)
    const result = await updateMacroExtraAction(editingExtra.id, editValues)
    if (result.success) {
      setWeeklyExtras(prev =>
        prev.map(e => e.id === editingExtra.id ? { ...e, ...editValues, edited_by_user: true } : e)
      )
    }
    setSavingEdit(false)
    setEditingExtra(null)
  }

  // ─── Weekly View ────────────────────────────────────

  function renderWeekly() {
    return (
      <>
        {weekDates.map(date => {
          const dayExtras = weeklyExtras.filter(e => e.logged_date === date)
          const isToday = date === todayStr
          const dateObj = new Date(date + 'T12:00:00')
          const dayName = DAY_NAMES[dateObj.getDay()]
          const label = `${dayName} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`
          const totalCal = dayExtras.reduce((sum, e) => sum + (e.calories || 0), 0)
          const totalProt = dayExtras.reduce((sum, e) => sum + (e.protein || 0), 0)
          const expanded = expandedDay === date

          return (
            <DayRow key={date}>
              <DayHeader
                $expanded={expanded}
                onClick={() => setExpandedDay(expanded ? null : date)}
              >
                <DayInfo>
                  <DayDate $isToday={isToday}>
                    {label}{isToday ? ' (Today)' : ''}
                  </DayDate>
                  <DaySummary>
                    {dayExtras.length === 0
                      ? 'No extras logged'
                      : `${dayExtras.length} item${dayExtras.length !== 1 ? 's' : ''} · ${totalCal} cal · ${totalProt}g protein`}
                  </DaySummary>
                </DayInfo>
                {dayExtras.length > 0 && <ExpandIcon $expanded={expanded}>&#x25BC;</ExpandIcon>}
              </DayHeader>

              {expanded && dayExtras.map(extra => (
                <ExtraItem key={extra.id}>
                  <ExtraThumb>
                    {extra.photo_url ? <img src={extra.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} /> : '&#x1F372;'}
                  </ExtraThumb>
                  <ExtraInfo>
                    <ExtraName>{extra.food_name}</ExtraName>
                    <ExtraMeta>{MEAL_TIME_LABELS[extra.meal_time] || extra.meal_time}</ExtraMeta>
                  </ExtraInfo>
                  <ExtraMacros>
                    {extra.calories} cal · {extra.protein}g P
                  </ExtraMacros>
                  {!extra.is_locked && (
                    <EditBtn onClick={() => openEdit(extra)}>Edit</EditBtn>
                  )}
                </ExtraItem>
              ))}
            </DayRow>
          )
        })}

        {weeklyExtras.length === 0 && (
          <EmptyState>No extras logged this week. Use the &quot;Add food or snack&quot; button on the Today tab to get started.</EmptyState>
        )}
      </>
    )
  }

  // ─── Monthly View ───────────────────────────────────

  function renderMonthly() {
    const { year, month } = monthYear
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Group extras by day
    const byDay = {}
    monthlyExtras.forEach(e => {
      const d = new Date(e.logged_date).getDate()
      if (!byDay[d]) byDay[d] = []
      byDay[d].push(e)
    })

    // Determine status color for each day
    function getDayColor(dayNum) {
      const extras = byDay[dayNum]
      if (!extras || extras.length === 0) return null
      const totalCal = extras.reduce((sum, e) => sum + (e.calories || 0), 0)
      const diff = Math.abs(totalCal) / (targets.calories || 1)
      // Simple heuristic: just indicate data exists. Full accuracy needs meal data too
      if (diff <= 0.1) return '#1D9E75'
      if (diff <= 0.25) return '#BA7517'
      return '#1D9E75' // Default green since extras alone don't tell the full story
    }

    return (
      <>
        <MonthNav>
          <NavButton onClick={() => setMonthYear(prev => {
            const m = prev.month - 1
            return m < 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: m }
          })}>
            &#x2039;
          </NavButton>
          <MonthTitle>{MONTH_NAMES[month]} {year}</MonthTitle>
          <NavButton onClick={() => setMonthYear(prev => {
            const m = prev.month + 1
            return m > 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: m }
          })}>
            &#x203A;
          </NavButton>
        </MonthNav>

        <CalendarGrid>
          {DAY_NAMES.map(d => <CalendarHeader key={d}>{d}</CalendarHeader>)}
          {Array.from({ length: firstDay }, (_, i) => <span key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1
            const hasData = !!byDay[dayNum]
            const dotColor = getDayColor(dayNum)
            const selected = selectedMonthDay === dayNum

            return (
              <CalendarDay
                key={dayNum}
                $hasData={hasData}
                $selected={selected}
                onClick={() => hasData && setSelectedMonthDay(selected ? null : dayNum)}
              >
                {dayNum}
                {dotColor && <CalendarDot $color={dotColor} />}
              </CalendarDay>
            )
          })}
        </CalendarGrid>

        {selectedMonthDay && byDay[selectedMonthDay] && (
          <DayDetail>
            <DayDetailTitle>
              {MONTH_NAMES[month]} {selectedMonthDay} — Extras
            </DayDetailTitle>
            {byDay[selectedMonthDay].map(extra => (
              <DayDetailRow key={extra.id}>
                <span>{extra.food_name} ({MEAL_TIME_LABELS[extra.meal_time] || extra.meal_time})</span>
                <span>{extra.calories} cal · {extra.protein}g P · {extra.carbs}g C · {extra.fat}g F</span>
              </DayDetailRow>
            ))}
          </DayDetail>
        )}

        {monthlyExtras.length === 0 && (
          <EmptyState>No extras logged in {MONTH_NAMES[month]}.</EmptyState>
        )}
      </>
    )
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <Wrapper>
      <ToggleRow>
        <ToggleBtn $active={mode === 'weekly'} onClick={() => setMode('weekly')}>Weekly</ToggleBtn>
        <ToggleBtn $active={mode === 'monthly'} onClick={() => setMode('monthly')}>Monthly</ToggleBtn>
      </ToggleRow>

      {mode === 'weekly' ? renderWeekly() : renderMonthly()}

      {/* Edit Modal */}
      {editingExtra && (
        <EditOverlay onClick={() => setEditingExtra(null)}>
          <EditCard onClick={e => e.stopPropagation()}>
            <EditTitle>Edit {editingExtra.food_name}</EditTitle>
            <EditFieldRow>
              {['calories', 'protein', 'carbs', 'fat'].map(key => (
                <EditField key={key}>
                  <EditLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</EditLabel>
                  <EditInput
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={editValues[key]}
                    onChange={e => {
                      const val = key === 'calories' ? parseInt(e.target.value, 10) : parseFloat(e.target.value)
                      setEditValues(prev => ({ ...prev, [key]: isNaN(val) ? 0 : val }))
                    }}
                  />
                </EditField>
              ))}
            </EditFieldRow>
            <EditButtons>
              <CancelBtn onClick={() => setEditingExtra(null)}>Cancel</CancelBtn>
              <SaveBtn onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save changes'}
              </SaveBtn>
            </EditButtons>
          </EditCard>
        </EditOverlay>
      )}
    </Wrapper>
  )
}
