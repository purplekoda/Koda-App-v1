'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { saveProfileAction } from '../actions';

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
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`;

const Field = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SaveBtn = styled.button`
  flex: 1;
  height: 44px;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
`;

const CancelBtn = styled.button`
  height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.background}; }
`;

const StatusText = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.success)};
`;

export default function ProfileSettingsClient({ user, profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [familyName, setFamilyName] = useState(profile?.family_name || '');
  const [status, setStatus] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveProfileAction({
        display_name: displayName,
        family_name: familyName,
      });
      if (result.success) {
        setStatus({ ok: true, msg: 'Saved' });
        setTimeout(() => router.push('/settings'), 1500);
      } else {
        setStatus({ ok: false, msg: result.error });
      }
    });
  }

  return (
    <PageWrapper>
      <BackLink type="button" onClick={() => router.push('/settings')}>
        &larr; Settings
      </BackLink>
      <Title>Profile</Title>

      <Field>
        <Label htmlFor="display_name">Your name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="First name"
          maxLength={100}
        />
      </Field>

      <Field>
        <Label htmlFor="family_name">Family name</Label>
        <Input
          id="family_name"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="e.g. The Johnsons"
          maxLength={100}
        />
      </Field>

      <Field>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled />
      </Field>

      {status && <StatusText $error={!status.ok}>{status.msg}</StatusText>}

      <ButtonRow>
        <CancelBtn type="button" onClick={() => router.push('/settings')}>
          Back
        </CancelBtn>
        <SaveBtn type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </SaveBtn>
      </ButtonRow>
    </PageWrapper>
  );
}
