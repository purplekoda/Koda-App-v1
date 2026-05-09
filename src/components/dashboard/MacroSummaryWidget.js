'use client'

import { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import SectionHeader from '@/components/common/SectionHeader'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
`

const ToggleRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ToggleBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.tealLight : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
`

/* ── Household view ── */

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const MemberInitial = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $color }) => $color || '#ccc'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  flex-shrink: 0;
`

const MemberName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`

const MacroDots = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

const MacroDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color, theme }) => theme.colors[$color] || $color};
`

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: ${({ theme }) => theme.spacing.sm};
  background: ${({ $status, theme }) => {
    if ($status === 'green') return theme.colors.success
    if ($status === 'amber') return theme.colors.warning
    return theme.colors.error
  }};
`

/* ── Individual view (macro cards) ── */

const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const MacroCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
`

const MacroValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MacroLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
`

const MacroTarget = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`

const macroDotColors = ['amber', 'teal', 'purple', 'blue']

function getMemberStatus(member) {
  if (!member.weeklyActuals?.length) return 'green'
  const today = member.weeklyActuals[0]
  const t = member.targets
  const calPct = today.calories / t.calories
  const proPct = today.protein / t.protein
  if (calPct > 1.15 || proPct < 0.7) return 'red'
  if (calPct > 1.05 || proPct < 0.85) return 'amber'
  return 'green'
}

export default function MacroSummaryWidget({ macroMembers }) {
  const [view, setView] = useState('household')
  const members = macroMembers || []

  if (members.length === 0) {
    return (
      <Card>
        <SectionHeader title="Macro summary" />
        <EmptyState>No household members tracking macros</EmptyState>
      </Card>
    )
  }

  // For individual view, show the first member's today data
  const primaryMember = members[0]
  const todayData = primaryMember?.weeklyActuals?.[0]
  const targets = primaryMember?.targets

  return (
    <Link href="/macros" style={{ textDecoration: 'none' }}>
      <Card>
        <SectionHeader title="Macro summary" linkText="Full view" linkHref="/macros" />

        <ToggleRow>
          <ToggleBtn $active={view === 'household'} onClick={e => { e.preventDefault(); setView('household') }}>
            Household
          </ToggleBtn>
          <ToggleBtn $active={view === 'individual'} onClick={e => { e.preventDefault(); setView('individual') }}>
            Individual
          </ToggleBtn>
        </ToggleRow>

        {view === 'household' ? (
          members.map(member => (
            <MemberRow key={member.id}>
              <MemberInitial $color={member.color}>
                {member.initial || member.name?.charAt(0)}
              </MemberInitial>
              <MemberName>{member.name}</MemberName>
              <MacroDots>
                {macroDotColors.map((c, i) => (
                  <MacroDot key={i} $color={c} />
                ))}
              </MacroDots>
              <StatusDot $status={getMemberStatus(member)} />
            </MemberRow>
          ))
        ) : (
          todayData && targets ? (
            <MacroGrid>
              <MacroCard>
                <MacroValue>{todayData.calories}</MacroValue>
                <MacroLabel>Calories</MacroLabel>
                <MacroTarget>/{targets.calories}</MacroTarget>
              </MacroCard>
              <MacroCard>
                <MacroValue>{todayData.protein}g</MacroValue>
                <MacroLabel>Protein</MacroLabel>
                <MacroTarget>/{targets.protein}g</MacroTarget>
              </MacroCard>
              <MacroCard>
                <MacroValue>{todayData.carbs}g</MacroValue>
                <MacroLabel>Carbs</MacroLabel>
                <MacroTarget>/{targets.carbs}g</MacroTarget>
              </MacroCard>
              <MacroCard>
                <MacroValue>{todayData.fat}g</MacroValue>
                <MacroLabel>Fat</MacroLabel>
                <MacroTarget>/{targets.fat}g</MacroTarget>
              </MacroCard>
            </MacroGrid>
          ) : (
            <EmptyState>No data for today yet</EmptyState>
          )
        )}
      </Card>
    </Link>
  )
}
