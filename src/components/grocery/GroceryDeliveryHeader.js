'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { GROCERY_STORES, FULFILLMENT_OPTIONS, storeColor, storeLabel } from '@/data/grocery-stores';

const HeaderCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};

  & + & {
    margin-top: ${({ theme }) => theme.spacing.md};
    padding-top: ${({ theme }) => theme.spacing.md};
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const RowLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  padding-top: 7px;
  min-width: 90px;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
`;

const Chip = styled.button`
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $active, theme }) =>
    $active ? theme.colors.amber : theme.colors.border};
  background: ${({ $active, theme }) => ($active ? theme.colors.amberLight : theme.colors.surface)};
  color: ${({ $active, theme }) => ($active ? theme.colors.amber : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.amber};
    color: ${({ theme }) => theme.colors.amber};
  }
`;

const EmptyHint = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  padding-top: 7px;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${({ theme }) => theme.colors.teal};
  }
`;

/**
 * GroceryDeliveryHeader
 *
 * Displays "Sending to" and fulfillment method at the top of the grocery page.
 * Shows only the stores the user saved in settings. Falls back to all stores if none saved.
 * Pre-selects the user's saved preferences, but allows per-run override.
 *
 * Props:
 *   groceryPreferences: { stores: string[], fulfillment: string, ... }
 *   selectedStore: string
 *   onSelectStore: (string) => void
 *   selectedFulfillment: string
 *   onSelectFulfillment: (string) => void
 */
export default function GroceryDeliveryHeader({
  groceryPreferences,
  selectedStore,
  onSelectStore,
  selectedFulfillment,
  onSelectFulfillment,
}) {
  // Support both new store_list (rich) and legacy flat stores array
  const storeList = groceryPreferences?.store_list;
  const hasStoreList = Array.isArray(storeList) && storeList.length > 0;

  const displayStores = hasStoreList
    ? storeList.map((s) => ({
        value: s.value,
        label:
          s.value === 'other'
            ? s.label || 'Other'
            : GROCERY_STORES.find((g) => g.value === s.value)?.label || s.label,
      }))
    : (groceryPreferences?.stores || []).length > 0
      ? groceryPreferences.stores.map((v) => ({
          value: v,
          label: storeLabel(v, groceryPreferences.other_store_name),
        }))
      : null; // null = no stores configured

  return (
    <HeaderCard>
      <Row>
        <RowLabel>Sending to</RowLabel>
        <ChipRow>
          {displayStores ? (
            displayStores.map((store) => (
              <Chip
                key={store.value}
                type="button"
                $active={selectedStore === store.value}
                onClick={() => onSelectStore(selectedStore === store.value ? '' : store.value)}
              >
                {store.label}
              </Chip>
            ))
          ) : (
            <EmptyHint href="/settings/grocery-stores">Set preferred stores in settings</EmptyHint>
          )}
        </ChipRow>
      </Row>

      <Row>
        <RowLabel>How</RowLabel>
        <ChipRow>
          {FULFILLMENT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              type="button"
              $active={selectedFulfillment === opt.value}
              onClick={() => onSelectFulfillment(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
      </Row>
    </HeaderCard>
  );
}
