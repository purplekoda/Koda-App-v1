'use client'

import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const Wrapper = styled.div``

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const EventCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ $color }) => $color};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const EventInfo = styled.div`
  flex: 1;
`

const EventTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EventTime = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`

const TimeBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.grayLight};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
`

export default function TodayScheduleWidget({ schedule }) {
  return (
    <Wrapper>
      <SectionHeader title="Today" linkText="All" linkHref="/calendar" />
      <EventList>
        {schedule.map((event) => (
          <EventCard key={event.id} $color={event.color}>
            <EventInfo>
              <EventTitle>{event.title}</EventTitle>
              <EventTime>{event.time}</EventTime>
            </EventInfo>
            <TimeBadge>{event.shortTime}</TimeBadge>
          </EventCard>
        ))}
      </EventList>
    </Wrapper>
  )
}
