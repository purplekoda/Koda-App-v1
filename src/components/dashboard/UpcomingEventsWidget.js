'use client'

import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const EventRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const ColorDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const EventTitle = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EventDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UpcomingEventsWidget({ events }) {
  return (
    <div>
      <SectionHeader title="Upcoming" linkText="All events" linkHref="/events" />
      <List>
        {events.map((event) => (
          <EventRow key={event.id}>
            <ColorDot $color={event.color} />
            <EventTitle>{event.title}</EventTitle>
            <EventDate>{formatDate(event.date)}</EventDate>
          </EventRow>
        ))}
      </List>
    </div>
  )
}
