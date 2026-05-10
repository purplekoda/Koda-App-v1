'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GROCERY_STORES, storeColor, storeLabel } from '@/data/grocery-stores';
import { saveIngredientStoreAssignmentsAction } from '@/app/(app)/recipes/[id]/actions';

// ── Helpers ────────────────────────────────────────────

function buildStoreMap(groceryPreferences) {
  const list = groceryPreferences?.store_list;
  if (Array.isArray(list) && list.length > 0) return list;
  const flat = groceryPreferences?.stores || [];
  return flat.map((v, i) => ({
    value: v,
    label: storeLabel(v, groceryPreferences?.other_store_name),
    is_default: i === 0,
  }));
}

function defaultStore(storeMap) {
  return storeMap.find((s) => s.is_default)?.value || storeMap[0]?.value || '';
}

// ── Styled components ──────────────────────────────────

const Wrapper = styled.section`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

// ── Store filter tabs ──────────────────────────────────

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ $active, $color, theme }) =>
    $active ? ($color || theme.colors.teal) : theme.colors.border};
  background: ${({ $active, $color }) =>
    $active ? ($color ? $color + '18' : '#E1F5EE') : 'transparent'};
  color: ${({ $active, $color, theme }) =>
    $active ? ($color || theme.colors.teal) : theme.colors.textSecondary};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $color, theme }) => $color || theme.colors.teal};
  }
`;

const TabDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

// ── Grouped store section ──────────────────────────────

const StoreGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const GroupLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ $color }) => $color};
`;

const GroupCount = styled.span`
  font-size: 11px;
  padding: 2px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $color }) => $color + '18'};
  color: ${({ $color }) => $color};
`;

// ── Ingredient row + inline dropdown ──────────────────

const ItemWrap = styled.div`
  margin-bottom: 6px;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ $open, theme }) =>
    $open ? `${theme.radii.md} ${theme.radii.md} 0 0` : theme.radii.md};
  border-bottom-color: ${({ $open, theme }) => ($open ? 'transparent' : theme.colors.border)};
  cursor: pointer;
  user-select: none;
`;

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ItemQty = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: 4px;
`;

const StorePill = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 3px 9px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $color }) => $color + '18'};
  color: ${({ $color }) => $color};
  white-space: nowrap;
  cursor: pointer;
`;

const Chevron = styled.span`
  font-size: 9px;
  opacity: 0.7;
  display: inline-block;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.15s ease;
`;

const InlineDropdown = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-top: none;
  border-radius: 0 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const DDOption = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: 9px 14px;
  text-align: left;
  background: transparent;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background 0.1s ease;

  &:first-child { border-top: none; }
  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`;

const DDDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const DDName = styled.span`
  flex: 1;
`;

const DDSub = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DDCheck = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
`;

// ── Send bar ───────────────────────────────────────────

const SendBar = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SendInfo = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SendStrong = styled.strong`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
`;

const SendButton = styled.button`
  font-size: 13px;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.9; }
`;

const Tip = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin-top: 8px;
`;

const NoStoresHint = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  padding: 10px 22px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`;

// ── Main component ─────────────────────────────────────

export default function IngredientStoreAssignment({ recipe, groceryPreferences }) {
  const storeMap = buildStoreMap(groceryPreferences);
  const fallback = defaultStore(storeMap);

  // assignments[i] = store value for ingredients[i]
  const [assignments, setAssignments] = useState(() => {
    const saved = recipe.ingredient_store_assignments;
    if (Array.isArray(saved) && saved.length === recipe.ingredients.length) return saved;
    return recipe.ingredients.map(() => fallback);
  });

  const [openIdx, setOpenIdx] = useState(null);
  const [filterStore, setFilterStore] = useState('all');
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();
  const toastRef = useRef(null);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  function showToast(msg) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }

  function toggleOpen(idx) {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  }

  function assign(ingredientIdx, storeValue) {
    setAssignments((prev) => {
      const next = [...prev];
      next[ingredientIdx] = storeValue;
      return next;
    });
    setOpenIdx(null);
  }

  function handleSend() {
    startTransition(async () => {
      const result = await saveIngredientStoreAssignmentsAction(recipe.id, assignments);
      if (result.success) {
        showToast('Store assignments saved');
      } else {
        showToast(result.error || 'Could not save');
      }
    });
  }

  if (!storeMap.length) {
    return (
      <Wrapper>
        <SectionTitle style={{ marginBottom: 12 }}>Store assignments</SectionTitle>
        <NoStoresHint>
          <a
            href="/settings/grocery-stores"
            style={{ color: '#1D9E75', textDecoration: 'underline' }}
          >
            Add your grocery stores in settings
          </a>{' '}
          to assign ingredients to specific stores.
        </NoStoresHint>
      </Wrapper>
    );
  }

  // Group ingredients by assigned store
  const byStore = {};
  storeMap.forEach((s) => {
    byStore[s.value] = [];
  });
  assignments.forEach((storeVal, i) => {
    const key =
      storeVal && byStore[storeVal] !== undefined ? storeVal : fallback || storeMap[0]?.value;
    if (!byStore[key]) byStore[key] = [];
    byStore[key].push(i);
  });

  const listsReady = Object.values(byStore).filter((arr) => arr.length > 0).length;
  const storeNamesUsed = storeMap
    .filter((s) => byStore[s.value]?.length > 0)
    .map((s) => s.label || storeLabel(s.value))
    .join(', ');

  const visibleStores =
    filterStore === 'all' ? storeMap : storeMap.filter((s) => s.value === filterStore);

  return (
    <Wrapper>
      <SectionHeader>
        <SectionTitle>Store assignments</SectionTitle>
      </SectionHeader>

      {/* Store filter tabs */}
      <TabRow>
        <Tab type="button" $active={filterStore === 'all'} onClick={() => setFilterStore('all')}>
          All stores
        </Tab>
        {storeMap.map((s) => {
          const color = storeColor(s.value);
          return (
            <Tab
              key={s.value}
              type="button"
              $active={filterStore === s.value}
              $color={color}
              onClick={() => setFilterStore(s.value)}
            >
              <TabDot $color={color} />
              {s.label || storeLabel(s.value)}
            </Tab>
          );
        })}
      </TabRow>

      {/* Ingredient groups by store */}
      {visibleStores.map((store) => {
        const indices = byStore[store.value] || [];
        if (indices.length === 0) return null;
        const color = storeColor(store.value);
        const displayLabel = store.label || storeLabel(store.value);

        return (
          <StoreGroup key={store.value}>
            <GroupHeader>
              <GroupLabel $color={color}>{displayLabel}</GroupLabel>
              <GroupCount $color={color}>
                {indices.length} {indices.length === 1 ? 'item' : 'items'}
              </GroupCount>
            </GroupHeader>

            {indices.map((i) => {
              const ing = recipe.ingredients[i];
              const isOpen = openIdx === i;
              const assignedStore = storeMap.find((s) => s.value === assignments[i]) || storeMap[0];
              const pillColor = storeColor(assignedStore?.value);

              return (
                <ItemWrap key={i}>
                  <ItemRow $open={isOpen} onClick={() => toggleOpen(i)}>
                    <ItemName>{ing.name}</ItemName>
                    {ing.quantity && <ItemQty>{ing.quantity}</ItemQty>}
                    <StorePill $color={pillColor}>
                      {assignedStore?.label || storeLabel(assignedStore?.value)}
                      <Chevron $open={isOpen}>▾</Chevron>
                    </StorePill>
                  </ItemRow>

                  {isOpen && (
                    <InlineDropdown>
                      {storeMap.map((opt) => {
                        const optColor = storeColor(opt.value);
                        const isChosen = assignments[i] === opt.value;
                        const optLabel = opt.label || storeLabel(opt.value);
                        const optDesc =
                          GROCERY_STORES.find((g) => g.value === opt.value)?.description || '';

                        return (
                          <DDOption
                            key={opt.value}
                            type="button"
                            onClick={() => assign(i, opt.value)}
                          >
                            <DDDot $color={optColor} />
                            <DDName>{optLabel}</DDName>
                            {optDesc && <DDSub>{optDesc}</DDSub>}
                            {isChosen && <DDCheck>✓</DDCheck>}
                          </DDOption>
                        );
                      })}
                    </InlineDropdown>
                  )}
                </ItemWrap>
              );
            })}
          </StoreGroup>
        );
      })}

      {/* Send bar */}
      <SendBar>
        <SendInfo>
          <SendStrong>
            {listsReady} {listsReady === 1 ? 'list' : 'lists'} ready
          </SendStrong>
          {storeNamesUsed && ` · ${storeNamesUsed}`}
        </SendInfo>
        <SendButton onClick={handleSend} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save assignments'}
        </SendButton>
      </SendBar>
      <Tip>Tap any store pill to reassign that ingredient</Tip>

      {toast && <Toast>{toast}</Toast>}
    </Wrapper>
  );
}
