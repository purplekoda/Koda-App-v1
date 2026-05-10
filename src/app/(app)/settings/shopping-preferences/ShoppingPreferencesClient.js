'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import SingleSelectCards from '@/components/onboarding/shared/SingleSelectCards';
import { SHOPPING_STYLE_OPTIONS, DELIVERY_SERVICE_OPTIONS } from '@/data/onboarding-options';
import { saveShoppingPreferencesAction } from '../actions';

const PageWrapper = styled.div`
  max-width: 540px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const BackButton = styled(Link)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.4;
`;

const DeliveryServiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.md};
`;

const DeliveryChip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.border)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.tealLight + '30' : theme.colors.surface)};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.textSecondary)};
  font-size: 13px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`;

const SaveFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xxl};
`;

const SaveButton = styled.button`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
`;

const StatusText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.success)};
`;

export default function ShoppingPreferencesClient({
  shoppingStyle: initialStyle,
  deliveryService: initialSvc,
}) {
  const [style, setStyle] = useState(initialStyle);
  const [svc, setSvc] = useState(initialSvc);
  const [status, setStatus] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveShoppingPreferencesAction({
        shopping_style: style,
        preferred_delivery_service: style === 'delivery_preferred' ? svc : null,
      });
      setStatus(result.success ? { ok: true, msg: 'Saved' } : { ok: false, msg: result.error });
    });
  }

  return (
    <PageWrapper>
      <PageHeader>
        <BackButton href="/settings" aria-label="Back to settings">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 2L4 7L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </BackButton>
        <PageTitle>Shopping preferences</PageTitle>
      </PageHeader>

      <Subtitle>
        This helps Koda organize your grocery lists the way that works best for you.
      </Subtitle>

      <SingleSelectCards
        options={SHOPPING_STYLE_OPTIONS.map((o) => ({
          value: o.value,
          label: `${o.icon} ${o.label}`,
          subtitle: o.subtitle,
        }))}
        selected={style}
        onChange={setStyle}
      />

      {style === 'delivery_preferred' && (
        <DeliveryServiceRow>
          {DELIVERY_SERVICE_OPTIONS.map((opt) => (
            <DeliveryChip
              key={opt.value}
              type="button"
              $selected={svc === opt.value}
              onClick={() => setSvc(opt.value)}
            >
              {opt.label}
            </DeliveryChip>
          ))}
        </DeliveryServiceRow>
      )}

      <SaveFooter>
        {status && <StatusText $error={!status.ok}>{status.msg}</StatusText>}
        <SaveButton onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving\u2026' : 'Save preferences'}
        </SaveButton>
      </SaveFooter>
    </PageWrapper>
  );
}
