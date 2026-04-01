'use client'

import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const IdeaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const IdeaCard = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const Rank = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $rank, theme }) => {
    if ($rank === 1) return theme.colors.teal
    if ($rank === 2) return theme.colors.tealLight
    return theme.colors.grayLight
  }};
  color: ${({ $rank, theme }) => {
    if ($rank === 1) return '#FFFFFF'
    if ($rank === 2) return theme.colors.teal
    return theme.colors.textSecondary
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`

const IdeaInfo = styled.div`
  flex: 1;
`

const IdeaName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const IdeaReason = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const IdeaMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const MetaChip = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $variant, theme }) => {
    if ($variant === 'uses-expiring') return theme.colors.expiringAmberBg
    if ($variant === 'pantry-ready') return theme.colors.tealLight
    if ($variant === 'quick') return theme.colors.blueLight
    return theme.colors.grayLight
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'uses-expiring') return theme.colors.amber
    if ($variant === 'pantry-ready') return theme.colors.teal
    if ($variant === 'quick') return theme.colors.blue
    return theme.colors.textSecondary
  }};
`

const PrepTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PantryMatch = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const MatchRing = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid ${({ $pct, theme }) =>
    $pct >= 80 ? theme.colors.teal :
    $pct >= 50 ? theme.colors.amber :
    theme.colors.coral};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $pct, theme }) =>
    $pct >= 80 ? theme.colors.teal :
    $pct >= 50 ? theme.colors.amber :
    theme.colors.coral};
`

const MatchLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  margin-top: ${({ theme }) => theme.spacing.sm};
  min-height: 36px;

  &:hover {
    opacity: 0.9;
  }
`

export default function DinnerIdeas({ ideas, onAddToMealPlan }) {
  return (
    <Card>
      <Header>
        <PurpleDot />
        <Title>Dinner ideas from Koda</Title>
      </Header>
      <Subtitle>
        Ranked by freshness priority: uses expiring items first, then pantry-ready meals.
      </Subtitle>

      <IdeaList>
        {ideas.map((idea) => {
          const pct = Math.round((idea.pantryMatch / idea.pantryTotal) * 100)
          return (
            <IdeaCard key={idea.id}>
              <Rank $rank={idea.priority}>{idea.priority}</Rank>
              <IdeaInfo>
                <IdeaName>{idea.name}</IdeaName>
                <IdeaReason>{idea.reason}</IdeaReason>
                <IdeaMeta>
                  {idea.tags.map(t => (
                    <MetaChip key={t} $variant={t}>{t.replace('-', ' ')}</MetaChip>
                  ))}
                  <PrepTime>{'\u23F1'} {idea.prepTime}</PrepTime>
                </IdeaMeta>
                <AddButton onClick={() => onAddToMealPlan && onAddToMealPlan(idea)}>
                  + Add to tonight
                </AddButton>
              </IdeaInfo>
              <PantryMatch>
                <MatchRing $pct={pct}>{pct}%</MatchRing>
                <MatchLabel>pantry</MatchLabel>
              </PantryMatch>
            </IdeaCard>
          )
        })}
      </IdeaList>
    </Card>
  )
}
