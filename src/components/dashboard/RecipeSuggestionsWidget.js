'use client'

import styled from 'styled-components'
import Link from 'next/link'
import SectionHeader from '@/components/common/SectionHeader'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

const SuggestionCard = styled(Link)`
  display: block;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.purpleLight};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.purpleMid};
  }

  & + & {
    margin-top: ${({ theme }) => theme.spacing.sm};
  }
`

const SuggestionName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const SuggestionReason = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PrepBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.purple};
  font-weight: 500;
`

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`

export default function RecipeSuggestionsWidget({ dinnerIdeas }) {
  const suggestions = (dinnerIdeas || []).slice(0, 2)

  return (
    <Card>
      <SectionHeader title="Recipe suggestions" linkText="Recipe Box" linkHref="/recipes" />
      {suggestions.length === 0 ? (
        <EmptyState>Scan your pantry for personalized ideas</EmptyState>
      ) : (
        suggestions.map(idea => (
          <SuggestionCard key={idea.id} href="/recipes">
            <SuggestionName>{idea.name}</SuggestionName>
            <SuggestionReason>
              {idea.reason} &middot; <PrepBadge>{idea.prepTime}</PrepBadge>
            </SuggestionReason>
          </SuggestionCard>
        ))
      )}
    </Card>
  )
}
