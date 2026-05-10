'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import {
  GROCERY_STORES,
  GROCERY_CATEGORIES,
  FULFILLMENT_OPTIONS,
  storeColor,
} from '@/data/grocery-stores';
import { saveGroceryPreferencesAction } from '../actions';

// ── Layout ─────────────────────────────────────────────

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

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

// ── Store cards ────────────────────────────────────────

const StoreCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ $isDefault, $color }) =>
    $isDefault ? `2px solid ${$color}` : '0.5px solid #E5E7EB'};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 14px 16px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  position: relative;
`;

const StoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StoreIconCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $color }) => $color + '18'};
  border: 1px solid ${({ $color }) => $color + '30'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StoreInitial = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`;

const StoreInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StoreNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StoreName = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Badge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $variant, theme }) =>
    $variant === 'default' ? theme.colors.tealLight : theme.colors.purpleLight};
  color: ${({ $variant, theme }) =>
    $variant === 'default' ? theme.colors.tealDark : theme.colors.purpleDark};
`;

const StoreSub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
    color: ${({ theme }) => theme.colors.coral};
    border-color: ${({ theme }) => theme.colors.coral};
  }
`;

const CategoryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`;

const CatChip = styled.button`
  font-size: 12px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ $active, theme }) => ($active ? '#85B7EB' : theme.colors.border)};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blueLight : theme.colors.background};
  color: ${({ $active, theme }) => ($active ? theme.colors.blue : theme.colors.textSecondary)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
    color: ${({ theme }) => theme.colors.blue};
  }
`;

// ── Add store ──────────────────────────────────────────

const AddStoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 0.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const Dropdown = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const DropdownOption = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  font-size: 14px;
  color: ${({ $disabled, theme }) =>
    $disabled ? theme.colors.textMuted : theme.colors.textPrimary};
  background: transparent;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  transition: background 0.1s ease;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ $disabled, theme }) =>
    $disabled ? 'transparent' : theme.colors.borderLight}; }
`;

const DDDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

// ── Divider ────────────────────────────────────────────

const Divider = styled.hr`
  border: none;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

// ── Toggle rows ────────────────────────────────────────

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:last-of-type { border-bottom: none; }
`;

const ToggleLabel = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToggleName = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ToggleSub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const Toggle = styled.button`
  width: 36px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.borderLight)};
  border: 0.5px solid ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    top: 1px;
    left: ${({ $on }) => ($on ? 'calc(100% - 18px)' : '1px')};
    transition: left 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
`;

// ── Tip box ────────────────────────────────────────────

const TipBox = styled.div`
  background: ${({ theme }) => theme.colors.tealLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 14px;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const TipText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.tealDark};
  line-height: 1.5;
  margin: 0;
`;

// ── Save footer ────────────────────────────────────────

const SaveFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
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

// ── Other-store custom name input ──────────────────────

const OtherInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  margin-top: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }
`;

// ── Component ──────────────────────────────────────────

function initStoreList(groceryPreferences) {
  const existing = groceryPreferences?.store_list;
  if (Array.isArray(existing) && existing.length > 0) return existing;

  // Back-compat: migrate flat stores array
  const flat = groceryPreferences?.stores || [];
  return flat.map((v, i) => ({
    value: v,
    label: GROCERY_STORES.find((s) => s.value === v)?.label || v,
    is_default: i === 0,
    categories: [],
  }));
}

export default function GroceryStoreSettingsClient({ groceryPreferences }) {
  const [storeList, setStoreList] = useState(() => initStoreList(groceryPreferences));
  const [otherNames, setOtherNames] = useState(() => {
    // map value→custom name for 'other' entries
    const map = {};
    (groceryPreferences?.store_list || []).forEach((s) => {
      if (s.value === 'other') map[s.label] = s.label;
    });
    return map;
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [splitByStore, setSplitByStore] = useState(groceryPreferences?.split_by_store !== false);
  const [allowOverride, setAllowOverride] = useState(groceryPreferences?.allow_override !== false);
  const [smartSuggestions, setSmartSuggestions] = useState(
    Boolean(groceryPreferences?.smart_suggestions),
  );
  const [status, setStatus] = useState(null);
  const [isPending, startTransition] = useTransition();

  const addedValues = new Set(storeList.map((s) => s.value));

  function addStore(storeValue) {
    const storeMeta = GROCERY_STORES.find((s) => s.value === storeValue);
    if (!storeMeta) return;
    setStoreList((prev) => [
      ...prev,
      {
        value: storeValue,
        label: storeMeta.label,
        is_default: prev.length === 0,
        categories: [],
      },
    ]);
    setShowDropdown(false);
  }

  function removeStore(idx) {
    setStoreList((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // If we removed the default, promote the first remaining
      if (prev[idx].is_default && next.length > 0) {
        next[0] = { ...next[0], is_default: true };
      }
      return next;
    });
  }

  function setDefault(idx) {
    setStoreList((prev) => prev.map((s, i) => ({ ...s, is_default: i === idx })));
  }

  function toggleCategory(storeIdx, cat) {
    setStoreList((prev) =>
      prev.map((s, i) => {
        if (i !== storeIdx) return s;
        const cats = s.categories.includes(cat)
          ? s.categories.filter((c) => c !== cat)
          : [...s.categories, cat];
        return { ...s, categories: cats };
      }),
    );
  }

  function handleSave() {
    setStatus(null);
    // Merge custom names for 'other' stores
    const finalList = storeList.map((s) => {
      if (s.value === 'other' && otherNames[s.label]) {
        return { ...s, label: otherNames[s.label] || 'Other' };
      }
      return s;
    });
    startTransition(async () => {
      const result = await saveGroceryPreferencesAction({
        store_list: finalList,
        split_by_store: splitByStore,
        allow_override: allowOverride,
        smart_suggestions: smartSuggestions,
        fulfillment: groceryPreferences?.fulfillment || '',
        delivery_address: groceryPreferences?.delivery_address || '',
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
        <PageTitle>Grocery store settings</PageTitle>
      </PageHeader>

      {/* ── Store cards ── */}
      <SectionLabel>My stores</SectionLabel>

      {storeList.length === 0 && (
        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12 }}>
          No stores added yet. Use the button below to add your first store.
        </p>
      )}

      {storeList.map((store, idx) => {
        const color = storeColor(store.value);
        const initial = store.label.charAt(0).toUpperCase();
        return (
          <StoreCard key={idx} $isDefault={store.is_default} $color={color}>
            <RemoveButton
              type="button"
              onClick={() => removeStore(idx)}
              aria-label={`Remove ${store.label}`}
            >
              ×
            </RemoveButton>

            <StoreRow>
              <StoreIconCircle $color={color}>
                <StoreInitial $color={color}>{initial}</StoreInitial>
              </StoreIconCircle>
              <StoreInfo>
                <StoreNameRow>
                  <StoreName>{store.label}</StoreName>
                  {store.is_default && <Badge $variant="default">Default</Badge>}
                  {!store.is_default && (
                    <Badge
                      as="button"
                      $variant="override"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDefault(idx)}
                    >
                      Set default
                    </Badge>
                  )}
                </StoreNameRow>
                <StoreSub>
                  {GROCERY_STORES.find((s) => s.value === store.value)?.description || ''}
                </StoreSub>
                {store.value === 'other' && (
                  <OtherInput
                    value={otherNames[store.label] || ''}
                    onChange={(e) =>
                      setOtherNames((prev) => ({
                        ...prev,
                        [store.label]: e.target.value,
                      }))
                    }
                    placeholder="Enter store name"
                    maxLength={100}
                  />
                )}
              </StoreInfo>
            </StoreRow>

            <CategoryRow>
              {GROCERY_CATEGORIES.map((cat) => (
                <CatChip
                  key={cat}
                  type="button"
                  $active={store.categories.includes(cat)}
                  onClick={() => toggleCategory(idx, cat)}
                >
                  {cat}
                </CatChip>
              ))}
            </CategoryRow>
          </StoreCard>
        );
      })}

      {/* ── Add store dropdown ── */}
      {!showDropdown ? (
        <AddStoreButton type="button" onClick={() => setShowDropdown(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add another store
        </AddStoreButton>
      ) : (
        <Dropdown>
          {GROCERY_STORES.map((s) => {
            const already = addedValues.has(s.value) && s.value !== 'other';
            return (
              <DropdownOption
                key={s.value}
                type="button"
                $disabled={already}
                onClick={() => !already && addStore(s.value)}
              >
                <DDDot $color={s.color} />
                {s.label}
                {already && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>Added</span>
                )}
              </DropdownOption>
            );
          })}
          <DropdownOption
            type="button"
            onClick={() => setShowDropdown(false)}
            style={{ color: '#9CA3AF', justifyContent: 'center' }}
          >
            Cancel
          </DropdownOption>
        </Dropdown>
      )}

      <Divider />

      {/* ── List preferences ── */}
      <SectionLabel>List preferences</SectionLabel>

      <ToggleRow>
        <ToggleLabel>
          <ToggleName>Split list by store</ToggleName>
          <ToggleSub>Koda sorts items into separate lists per store</ToggleSub>
        </ToggleLabel>
        <Toggle type="button" $on={splitByStore} onClick={() => setSplitByStore((v) => !v)} />
      </ToggleRow>

      <ToggleRow>
        <ToggleLabel>
          <ToggleName>Allow list override</ToggleName>
          <ToggleSub>Change store directly on each grocery list</ToggleSub>
        </ToggleLabel>
        <Toggle type="button" $on={allowOverride} onClick={() => setAllowOverride((v) => !v)} />
      </ToggleRow>

      <ToggleRow>
        <ToggleLabel>
          <ToggleName>Smart store suggestions</ToggleName>
          <ToggleSub>Koda recommends best store based on your week</ToggleSub>
        </ToggleLabel>
        <Toggle
          type="button"
          $on={smartSuggestions}
          onClick={() => setSmartSuggestions((v) => !v)}
        />
      </ToggleRow>

      <TipBox>
        <TipText>
          Tip: assign categories to each store so Koda automatically splits your grocery list — no
          sorting needed!
        </TipText>
      </TipBox>

      <SaveFooter>
        {status && <StatusText $error={!status.ok}>{status.msg}</StatusText>}
        <SaveButton onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save stores'}
        </SaveButton>
      </SaveFooter>
    </PageWrapper>
  );
}
