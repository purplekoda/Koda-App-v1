'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

const PageWrapper = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 100dvh;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xxl};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`;

const ToggleLabel = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ToggleDesc = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const Toggle = styled.button`
  width: 48px;
  height: 28px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  position: relative;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '23px' : '3px')};
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
`;

const NOTIFICATION_OPTIONS = [
  { key: 'meal_reminders', label: 'Meal reminders', desc: "Get reminded when it's time to cook" },
  {
    key: 'grocery_reminders',
    label: 'Grocery list reminders',
    desc: 'Reminders to check your grocery list',
  },
  { key: 'pantry_expiry', label: 'Pantry expiry alerts', desc: 'When items are about to expire' },
  { key: 'weekly_plan', label: 'Weekly plan summary', desc: 'Sunday evening meal plan overview' },
  {
    key: 'ai_suggestions',
    label: 'Koda suggestions',
    desc: 'Recipe and meal suggestions from Koda',
  },
];

export default function NotificationsSettingsClient() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(() => {
    const defaults = {};
    NOTIFICATION_OPTIONS.forEach((opt) => {
      defaults[opt.key] = true;
    });
    return defaults;
  });

  function togglePref(key) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <PageWrapper>
      <BackLink type="button" onClick={() => router.push('/settings')}>
        &larr; Settings
      </BackLink>
      <Title>Notifications</Title>
      <Subtitle>Choose which notifications you receive from Koda.</Subtitle>

      {NOTIFICATION_OPTIONS.map((opt) => (
        <ToggleRow key={opt.key}>
          <div>
            <ToggleLabel>{opt.label}</ToggleLabel>
            <ToggleDesc>{opt.desc}</ToggleDesc>
          </div>
          <Toggle
            type="button"
            $on={prefs[opt.key]}
            onClick={() => togglePref(opt.key)}
            aria-label={`Toggle ${opt.label}`}
          />
        </ToggleRow>
      ))}
    </PageWrapper>
  );
}
