'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { saveMacroLoggingSettingsAction } from '../actions';

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PageDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const MemberRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  cursor: pointer;

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`;

const MemberLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MemberName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const MemberAge = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Switch = styled.div`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '20px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: left 0.15s ease;
  }
`;

export default function MacroLoggingSettingsClient({ members }) {
  const [settings, setSettings] = useState(() => {
    const map = {};
    members.forEach((m) => {
      map[m.id] = m.allowPhotoMacroLogging !== false;
    });
    return map;
  });
  const [, startTransition] = useTransition();

  function toggle(memberId) {
    const next = !settings[memberId];
    setSettings((prev) => ({ ...prev, [memberId]: next }));

    startTransition(async () => {
      await saveMacroLoggingSettingsAction(memberId, next);
    });
  }

  return (
    <PageWrapper>
      <BackLink href="/settings">{'\u2190'} Settings</BackLink>
      <PageTitle>Photo macro logging</PageTitle>
      <PageDesc>
        Control which household members can log extra food items by photo. When turned off, the
        &quot;Add food or snack&quot; button is hidden for that member.
      </PageDesc>

      <Section>
        {members.map((m) => (
          <MemberRow key={m.id} onClick={() => toggle(m.id)}>
            <MemberInfo>
              <Avatar $color={m.color}>{m.initial}</Avatar>
              <MemberLabel>
                <MemberName>{m.name}</MemberName>
                <MemberAge>{m.ageGroup}</MemberAge>
              </MemberLabel>
            </MemberInfo>
            <Switch $on={settings[m.id]} />
          </MemberRow>
        ))}
        {members.length === 0 && (
          <MemberAge style={{ display: 'block', padding: '16px 0', textAlign: 'center' }}>
            No household members with macro tracking.
          </MemberAge>
        )}
      </Section>
    </PageWrapper>
  );
}
