'use client';

import { useState, useTransition } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import FaithPracticeToggle from '@/components/faith/FaithPracticeToggle';
import FaithPracticeCards from '@/components/faith/FaithPracticeCards';
import { saveHouseholdFaithPracticesAction, saveMemberFaithPracticesAction } from './actions';
import { FAITH_PRACTICE_OPTIONS } from '@/data/faith-practices';

// ── Layout ────────────────────────────────────────────────

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
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.teal};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    text-decoration: underline;
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

const DividerLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MemberCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MemberName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SaveButton = styled.button`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $error, theme }) => ($error ? '#991B1B' : theme.colors.teal)};
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SummaryTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SummaryText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

// ── Component ─────────────────────────────────────────────

export default function FaithPracticesClient({ faithPractices, members, memberFaithData }) {
  const [isPending, startTransition] = useTransition();

  // Household-level state
  const [enabled, setEnabled] = useState(faithPractices.follows_faith_based_diet || false);
  const [practices, setPractices] = useState(faithPractices.household_faith_practices || []);
  const [details, setDetails] = useState(faithPractices);
  const [householdStatus, setHouseholdStatus] = useState(null);

  // Member-level state
  const [memberStates, setMemberStates] = useState(() => {
    const states = {};
    for (const member of members) {
      const mf = memberFaithData.find((m) => m.id === member.id);
      const fp = mf?.faith_practices || {};
      states[member.id] = {
        enabled: fp.follows_individual_faith_diet || false,
        practices: fp.individual_faith_practices || [],
        details: fp,
      };
    }
    return states;
  });
  const [memberStatuses, setMemberStatuses] = useState({});

  function handleHouseholdToggle(val) {
    setEnabled(val);
    setHouseholdStatus(null);
  }

  function handleHouseholdChange(newPractices, newDetails) {
    setPractices(newPractices);
    setDetails(newDetails);
    setHouseholdStatus(null);
  }

  function saveHousehold() {
    startTransition(async () => {
      const payload = {
        ...details,
        follows_faith_based_diet: enabled,
        household_faith_practices: practices,
      };
      const result = await saveHouseholdFaithPracticesAction(payload);
      setHouseholdStatus(result.success ? 'saved' : result.error);
    });
  }

  function handleMemberToggle(memberId, val) {
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], enabled: val },
    }));
    setMemberStatuses((prev) => ({ ...prev, [memberId]: null }));
  }

  function handleMemberChange(memberId, newPractices, newDetails) {
    setMemberStates((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], practices: newPractices, details: newDetails },
    }));
    setMemberStatuses((prev) => ({ ...prev, [memberId]: null }));
  }

  function saveMember(memberId) {
    startTransition(async () => {
      const state = memberStates[memberId];
      const payload = {
        ...state.details,
        follows_faith_based_diet: state.enabled,
        household_faith_practices: state.practices,
      };
      const result = await saveMemberFaithPracticesAction(memberId, payload);
      setMemberStatuses((prev) => ({
        ...prev,
        [memberId]: result.success ? 'saved' : result.error,
      }));
    });
  }

  // Build summary
  const activePracticeNames =
    practices.length > 0
      ? practices.map((id) => {
          const opt = FAITH_PRACTICE_OPTIONS.find((p) => p.id === id);
          return opt?.name || id;
        })
      : [];

  return (
    <PageWrapper>
      <BackLink href="/settings">&larr; Settings</BackLink>
      <PageTitle>Faith-based and cultural practices</PageTitle>
      <PageSubtitle>Skip this section if it does not apply to your household.</PageSubtitle>

      {/* Household-level */}
      <Section>
        <SectionTitle>Household practices</SectionTitle>
        <FaithPracticeToggle
          enabled={enabled}
          onToggle={handleHouseholdToggle}
          label="Our household follows faith-based dietary guidelines"
        />

        {enabled && (
          <FaithPracticeCards
            practices={practices}
            practiceDetails={details}
            onChange={handleHouseholdChange}
          />
        )}

        <SaveButton onClick={saveHousehold} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </SaveButton>
        {householdStatus && (
          <StatusText $error={householdStatus !== 'saved'}>
            {householdStatus === 'saved' ? 'Saved' : householdStatus}
          </StatusText>
        )}
      </Section>

      {/* Individual members */}
      {members.length > 0 && (
        <>
          <Divider />
          <DividerLabel>Individual member practices</DividerLabel>

          {members.map((member) => {
            const state = memberStates[member.id] || { enabled: false, practices: [], details: {} };
            const status = memberStatuses[member.id];

            return (
              <MemberCard key={member.id}>
                <MemberName>{member.name}</MemberName>
                <FaithPracticeToggle
                  enabled={state.enabled}
                  onToggle={(val) => handleMemberToggle(member.id, val)}
                  label="This person follows individual faith-based dietary practices"
                />

                {state.enabled && (
                  <FaithPracticeCards
                    practices={state.practices}
                    practiceDetails={state.details}
                    onChange={(p, d) => handleMemberChange(member.id, p, d)}
                  />
                )}

                <SaveButton onClick={() => saveMember(member.id)} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save'}
                </SaveButton>
                {status && (
                  <StatusText $error={status !== 'saved'}>
                    {status === 'saved' ? 'Saved' : status}
                  </StatusText>
                )}
              </MemberCard>
            );
          })}
        </>
      )}

      {/* Summary card */}
      {enabled && practices.length > 0 && (
        <SummaryCard>
          <SummaryTitle>What this means for your meal plans</SummaryTitle>
          <SummaryText>
            Based on your settings, Koda will treat the following as strict requirements when
            suggesting meals: {activePracticeNames.join(', ')}. Koda will never suggest meals that
            violate these practices and will always prioritize compliant recipes.
          </SummaryText>
        </SummaryCard>
      )}
    </PageWrapper>
  );
}
