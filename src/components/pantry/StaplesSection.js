'use client';

import { useState, useTransition, useRef, useEffect, useMemo, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { STAPLE_CATEGORIES, SUGGESTED_STAPLES } from '@/lib/dal/staples-constants';
import {
  addStapleAction,
  deleteStapleAction,
  toggleStapleStockAction,
} from '@/app/(app)/pantry/staple-actions';

// ── Styled components ─────────────────────────────────

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderLeft = styled.div``;

const SectionTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const SectionSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 4px 0 0 0;
  line-height: 1.4;
`;

const AddStapleBtn = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  min-height: ${({ theme }) => theme.touchTarget};
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`;

// ── Category accordion ────────────────────────────────

const CategoryBlock = styled.div`
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
`;

const CategoryHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  cursor: pointer;
  text-align: left;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const CategoryName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CategoryCount = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 8px;
`;

const ChevronIcon = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: transform 0.15s ease;
  transform: ${({ $open }) => ($open ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const CategoryItems = styled.div`
  display: flex;
  flex-direction: column;
`;

const StapleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 8px ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.surface};
`;

const StapleName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
`;

const StockBadge = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  min-height: 28px;

  background: ${({ $outOfStock, theme }) =>
    $outOfStock ? theme.colors.coralLight : theme.colors.tealLight};
  color: ${({ $outOfStock, theme }) => ($outOfStock ? theme.colors.coral : theme.colors.teal)};

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
    border-color: ${({ theme }) => theme.colors.coralMid};
    color: ${({ theme }) => theme.colors.coral};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const EmptyStaples = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

// ── Inline "Add your own" input per category ─────────

const popIn = keyframes`
  0%   { transform: scale(0.85); opacity: 0.5; }
  60%  { transform: scale(1.06); }
  100% { transform: scale(1); opacity: 1; }
`;

const amberPulse = keyframes`
  0%   { background: transparent; }
  30%  { background: #FAEEDA; }
  100% { background: transparent; }
`;

const InlineAddRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px ${({ theme }) => theme.spacing.md};
  border-top: 1.5px dashed ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const InlineInput = styled.input`
  flex: 1;
  padding: 7px 10px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12px;
  }
`;

const InlineAddBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealDark};
    transform: scale(1.08);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const DuplicateMsg = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.amber};
  padding: 2px ${({ theme }) => theme.spacing.md} 6px;
  background: ${({ theme }) => theme.colors.surface};
`;

const StapleRowAnimated = styled(StapleRow)`
  ${({ $justAdded }) => $justAdded && css`animation: ${popIn} 0.35s ease forwards;`}
  ${({ $highlighted }) => $highlighted && css`animation: ${amberPulse} 1.2s ease forwards;`}
`;

const CustomBadge = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.borderLight};
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  white-space: nowrap;
`;

// ── Inline remove confirmation for custom items ──────

const InlineConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InlineConfirmLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.amber};
  font-weight: 500;
  white-space: nowrap;
`;

const InlineConfirmBtn = styled.button`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  min-height: 24px;
  background: ${({ theme }) => theme.colors.coral};
  color: white;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const InlineCancelBtn = styled.button`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-height: 24px;

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`;

const CheckBadge = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  background: #16A34A;
  color: white;
  transition: transform 0.15s ease;

  &:hover:not(:disabled) {
    background: #15803D;
    transform: scale(1.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ── Modal (Add staple sheet) ──────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 520px;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-height: 85vh;
  overflow: hidden;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const SearchInput = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const CustomAddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const CategorySelect = styled.select`
  padding: 9px 8px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  min-width: 140px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const SmallBtn = styled.button`
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  min-height: 36px;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`;

const SuggestedList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SuggestedCatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.sm} 0 4px 0;
  margin-top: ${({ theme }) => theme.spacing.xs};

  &:first-child {
    margin-top: 0;
    padding-top: 0;
  }
`;

const SuggestedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background 0.2s ease;
  background: ${({ $confirming, theme }) =>
    $confirming ? theme.colors.amberLight : 'transparent'};

  &:hover {
    background: ${({ $confirming, theme }) =>
      $confirming ? theme.colors.amberLight : theme.colors.borderLight};
  }
`;

const SuggestedName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const AddItemBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;

  background: ${({ $added }) => ($added ? '#16A34A' : '#E5E7EB')};
  color: ${({ $added }) => ($added ? '#FFFFFF' : '#9CA3AF')};

  &:hover:not([disabled]) {
    background: ${({ $added }) => ($added ? '#15803D' : '#D1D5DB')};
    transform: scale(1.08);
  }

  &:active:not([disabled]) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmInline = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
`;

const ConfirmLabel = styled.span`
  color: ${({ theme }) => theme.colors.amber};
  font-weight: 500;
`;

const ConfirmBtn = styled.button`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  min-height: 24px;
  background: ${({ theme }) => theme.colors.coral};
  color: white;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-height: 24px;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const CloseBtn = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  align-self: flex-end;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`;

// ── Component ─────────────────────────────────────────

export default function StaplesSection({ initialStaples }) {
  const [staples, setStaples] = useState(initialStaples || []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();
  const toastRef = useRef(null);

  // Per-category inline "Add your own" input values
  const [catInputs, setCatInputs] = useState({});
  // Per-category duplicate warning message
  const [dupMsgs, setDupMsgs] = useState({});
  // Set of staple IDs that were just added (for pop-in animation)
  const [justAdded, setJustAdded] = useState(new Set());
  // Set of staple IDs to highlight amber (duplicate already exists)
  const [highlighted, setHighlighted] = useState(new Set());
  // Staple ID being confirmed for removal via checkmark
  const [confirmingRemoveId, setConfirmingRemoveId] = useState(null);

  useEffect(() => {
    setStaples(initialStaples || []);
  }, [initialStaples]);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  function showToast(msg) {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }

  // Build a name → staple lookup for duplicate checking
  const staplesByLowerName = useMemo(() => {
    const map = new Map();
    for (const s of staples) map.set(s.name.toLowerCase(), s);
    return map;
  }, [staples]);

  // Group staples by category — always show all categories so the inline input appears
  const grouped = useMemo(() => {
    const map = {};
    for (const cat of STAPLE_CATEGORIES) map[cat] = [];
    for (const s of staples) {
      const cat = STAPLE_CATEGORIES.includes(s.category) ? s.category : 'Other';
      map[cat].push(s);
    }
    return Object.entries(map);
  }, [staples]);

  function toggleCategory(cat) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleToggleStock(staple) {
    const newOutOfStock = !staple.is_out_of_stock;
    setStaples((prev) =>
      prev.map((s) =>
        s.id === staple.id
          ? {
              ...s,
              is_out_of_stock: newOutOfStock,
              out_of_stock_since: newOutOfStock ? new Date().toISOString() : null,
            }
          : s,
      ),
    );

    startTransition(async () => {
      const result = await toggleStapleStockAction(staple.id, newOutOfStock);
      if (result.success) {
        if (newOutOfStock) {
          showToast(`${staple.name} added to your grocery list.`);
        } else {
          showToast(`${staple.name} marked as in stock.`);
        }
      } else {
        setStaples((prev) => prev.map((s) => (s.id === staple.id ? staple : s)));
        showToast(result.error || 'Could not update stock status.');
      }
    });
  }

  function handleDelete(staple) {
    if (!confirm(`Remove "${staple.name}" from your staples?`)) return;
    startTransition(async () => {
      const result = await deleteStapleAction(staple.id);
      if (result.success) {
        setStaples((prev) => prev.filter((s) => s.id !== staple.id));
        showToast(`${staple.name} removed from staples.`);
      } else {
        showToast(result.error || 'Could not remove staple.');
      }
    });
  }

  // ── Remove custom item via checkmark toggle ────────
  function handleCustomCheckClick(staple) {
    if (confirmingRemoveId === staple.id) {
      setConfirmingRemoveId(null);
    } else {
      setConfirmingRemoveId(staple.id);
    }
  }

  function handleConfirmCustomRemove(staple) {
    startTransition(async () => {
      const result = await deleteStapleAction(staple.id);
      if (result.success) {
        setStaples((prev) => prev.filter((s) => s.id !== staple.id));
        showToast(`${staple.name} removed from staples.`);
      } else {
        showToast(result.error || 'Could not remove staple.');
      }
      setConfirmingRemoveId(null);
    });
  }

  // ── Inline custom add per category ─────────────────
  const handleInlineAdd = useCallback(
    (category) => {
      const raw = (catInputs[category] || '').trim();
      if (!raw) return;

      // Parse comma-separated items
      const names = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length === 0) return;

      // Check for duplicates
      const toAdd = [];
      const dupes = [];
      for (const name of names) {
        const existing = staplesByLowerName.get(name.toLowerCase());
        if (existing) {
          dupes.push(existing);
        } else if (!toAdd.some((n) => n.toLowerCase() === name.toLowerCase())) {
          toAdd.push(name);
        }
      }

      // Show duplicate feedback
      if (dupes.length > 0) {
        // Highlight existing items with amber pulse
        const dupeIds = new Set(dupes.map((d) => d.id));
        setHighlighted(dupeIds);
        setTimeout(() => setHighlighted(new Set()), 1400);

        if (toAdd.length === 0) {
          // All items were duplicates
          const dupeNames = dupes.map((d) => d.name);
          setDupMsgs((prev) => ({
            ...prev,
            [category]:
              dupeNames.length === 1
                ? `${dupeNames[0]} is already in your staples.`
                : `${dupeNames.join(', ')} are already in your staples.`,
          }));
          setTimeout(
            () =>
              setDupMsgs((prev) => {
                const next = { ...prev };
                delete next[category];
                return next;
              }),
            3000,
          );
          return;
        }
      }

      // Clear input immediately
      setCatInputs((prev) => ({ ...prev, [category]: '' }));
      setDupMsgs((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });

      // Add items
      startTransition(async () => {
        const added = [];
        for (const name of toAdd) {
          const result = await addStapleAction(name, category, true);
          if (result.success) {
            added.push(result.data);
          }
        }

        if (added.length > 0) {
          setStaples((prev) => [...prev, ...added]);

          // Pop-in animation for new items
          const newIds = new Set(added.map((a) => a.id));
          setJustAdded(newIds);
          setTimeout(() => setJustAdded(new Set()), 500);

          if (added.length === 1) {
            showToast(`${added[0].name} added to ${category}.`);
          } else {
            showToast(`${added.length} items added to ${category}.`);
          }
        }

        // Show duplicate note alongside success if there were dupes
        if (dupes.length > 0) {
          const dupeNames = dupes.map((d) => d.name);
          setDupMsgs((prev) => ({
            ...prev,
            [category]:
              dupeNames.length === 1
                ? `${dupeNames[0]} is already in your staples.`
                : `${dupeNames.join(', ')} are already in your staples.`,
          }));
          setTimeout(
            () =>
              setDupMsgs((prev) => {
                const next = { ...prev };
                delete next[category];
                return next;
              }),
            3000,
          );
        }
      });
    },
    [catInputs, staplesByLowerName],
  );

  function handleStapleAdded(newStaple) {
    setStaples((prev) => [...prev, newStaple]);
  }

  const outOfStockCount = staples.filter((s) => s.is_out_of_stock).length;

  return (
    <Section>
      <SectionHeader>
        <HeaderLeft>
          <SectionTitle>Pantry Staples</SectionTitle>
          <SectionSubtitle>
            Items you always keep in stock — Koda assumes these are available every week.
            {outOfStockCount > 0 && ` ${outOfStockCount} out of stock.`}
          </SectionSubtitle>
        </HeaderLeft>
        <AddStapleBtn onClick={() => setSheetOpen(true)}>+ Add staple</AddStapleBtn>
      </SectionHeader>

      {grouped.map(([cat, items]) => (
        <CategoryBlock key={cat}>
          <CategoryHeader onClick={() => toggleCategory(cat)}>
            <div>
              <CategoryName>{cat}</CategoryName>
              <CategoryCount>({items.length})</CategoryCount>
            </div>
            <ChevronIcon $open={expandedCats.has(cat)}>{'\u25B6'}</ChevronIcon>
          </CategoryHeader>
          {expandedCats.has(cat) && (
            <CategoryItems>
              {items.map((staple) => {
                const isConfirmingRemove = confirmingRemoveId === staple.id;
                return (
                  <StapleRowAnimated
                    key={staple.id}
                    $justAdded={justAdded.has(staple.id)}
                    $highlighted={highlighted.has(staple.id)}
                    style={isConfirmingRemove ? { background: '#FAEEDA' } : undefined}
                  >
                    <StapleName>{staple.name}</StapleName>
                    {staple.is_custom && <CustomBadge>custom</CustomBadge>}

                    {isConfirmingRemove ? (
                      <InlineConfirmRow>
                        <InlineConfirmLabel>Remove from staples?</InlineConfirmLabel>
                        <InlineConfirmBtn
                          onClick={() => handleConfirmCustomRemove(staple)}
                          disabled={isPending}
                        >
                          Confirm
                        </InlineConfirmBtn>
                        <InlineCancelBtn onClick={() => setConfirmingRemoveId(null)}>
                          Cancel
                        </InlineCancelBtn>
                      </InlineConfirmRow>
                    ) : (
                      <>
                        <StockBadge
                          $outOfStock={staple.is_out_of_stock}
                          onClick={() => handleToggleStock(staple)}
                          disabled={isPending}
                        >
                          {staple.is_out_of_stock ? 'Out of stock' : 'In stock'}
                        </StockBadge>
                        {staple.is_custom ? (
                          <CheckBadge
                            title="Remove custom staple"
                            onClick={() => handleCustomCheckClick(staple)}
                            disabled={isPending}
                          >
                            {'\u2713'}
                          </CheckBadge>
                        ) : (
                          <DeleteBtn
                            title="Remove staple"
                            onClick={() => handleDelete(staple)}
                            disabled={isPending}
                          >
                            {'\u2715'}
                          </DeleteBtn>
                        )}
                      </>
                    )}
                  </StapleRowAnimated>
                );
              })}

              {/* Inline "Add your own" input */}
              <InlineAddRow>
                <InlineInput
                  value={catInputs[cat] || ''}
                  onChange={(e) => setCatInputs((prev) => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlineAdd(cat);
                  }}
                  placeholder="Type an item and press Add..."
                />
                <InlineAddBtn
                  onClick={() => handleInlineAdd(cat)}
                  disabled={!(catInputs[cat] || '').trim() || isPending}
                  title="Add custom item"
                >
                  +
                </InlineAddBtn>
              </InlineAddRow>
              {dupMsgs[cat] && <DuplicateMsg>{dupMsgs[cat]}</DuplicateMsg>}
            </CategoryItems>
          )}
        </CategoryBlock>
      ))}

      {sheetOpen && (
        <AddStapleSheet
          existingNames={new Set(staples.map((s) => s.name.toLowerCase()))}
          existingStaples={staples}
          onAdd={handleStapleAdded}
          onRemove={(stapleId) => setStaples((prev) => prev.filter((s) => s.id !== stapleId))}
          onClose={() => setSheetOpen(false)}
          showToast={showToast}
        />
      )}

      {toast && <Toast>{toast}</Toast>}

      <Divider />
    </Section>
  );
}

// ── Add Staple Sheet (modal) ──────────────────────────

function AddStapleSheet({ existingNames, existingStaples, onAdd, onRemove, onClose, showToast }) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Other');
  const [isPending, startTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(null); // name being confirmed

  // Build a lookup from lowercase name → staple record for deletion
  const staplesByName = useMemo(() => {
    const map = new Map();
    for (const s of existingStaples) map.set(s.name.toLowerCase(), s);
    return map;
  }, [existingStaples]);

  function handleToggleAdded(name) {
    if (confirmingRemove === name) {
      setConfirmingRemove(null); // cancel if tapping same item again
    } else {
      setConfirmingRemove(name);
    }
  }

  function handleConfirmRemove(name) {
    const staple = staplesByName.get(name.toLowerCase());
    if (!staple) return;
    startTransition(async () => {
      const result = await deleteStapleAction(staple.id);
      if (result.success) {
        onRemove(staple.id);
        showToast(`${staple.name} removed from staples.`);
      } else {
        showToast(result.error || 'Could not remove staple.');
      }
      setConfirmingRemove(null);
    });
  }

  // Filter suggested items by search
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    const results = [];
    for (const [cat, items] of Object.entries(SUGGESTED_STAPLES)) {
      const filtered = items.filter((name) => !q || name.toLowerCase().includes(q));
      if (filtered.length > 0) results.push([cat, filtered]);
    }
    return results;
  }, [search]);

  function handleAddSuggested(name, category) {
    startTransition(async () => {
      const result = await addStapleAction(name, category, false);
      if (result.success) {
        onAdd(result.data);
        showToast(`${name} added to staples.`);
      } else {
        showToast(result.error || 'Could not add staple.');
      }
    });
  }

  function handleAddCustom() {
    const name = customName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await addStapleAction(name, customCategory, true);
      if (result.success) {
        onAdd(result.data);
        setCustomName('');
        showToast(`${name} added to staples.`);
      } else {
        showToast(result.error || 'Could not add staple.');
      }
    });
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Add Staples</ModalTitle>

        {/* Custom add */}
        <CustomAddRow>
          <SearchInput
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
            placeholder="Type a custom staple..."
            style={{ flex: 1 }}
          />
          <CategorySelect
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          >
            {STAPLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </CategorySelect>
          <SmallBtn
            onClick={handleAddCustom}
            disabled={
              !customName.trim() || isPending || existingNames.has(customName.trim().toLowerCase())
            }
          >
            + Add
          </SmallBtn>
        </CustomAddRow>

        {/* Search suggested */}
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suggested staples..."
        />

        <SuggestedList>
          {filteredCategories.map(([cat, items]) => (
            <div key={cat}>
              <SuggestedCatLabel>{cat}</SuggestedCatLabel>
              {items.map((name) => {
                const alreadyAdded = existingNames.has(name.toLowerCase());
                const isConfirming = confirmingRemove === name;
                return (
                  <SuggestedRow key={name} $confirming={isConfirming}>
                    <SuggestedName>{name}</SuggestedName>
                    {isConfirming ? (
                      <ConfirmInline>
                        <ConfirmLabel>Remove from staples?</ConfirmLabel>
                        <ConfirmBtn onClick={() => handleConfirmRemove(name)} disabled={isPending}>
                          Confirm
                        </ConfirmBtn>
                        <CancelBtn onClick={() => setConfirmingRemove(null)}>Cancel</CancelBtn>
                      </ConfirmInline>
                    ) : (
                      <AddItemBtn
                        $added={alreadyAdded}
                        disabled={isPending}
                        onClick={() =>
                          alreadyAdded ? handleToggleAdded(name) : handleAddSuggested(name, cat)
                        }
                        title={alreadyAdded ? 'Remove from staples' : `Add ${name}`}
                        aria-label={alreadyAdded ? `${name}, added — tap to remove` : `Add ${name}`}
                      >
                        {alreadyAdded ? '\u2713' : '+'}
                      </AddItemBtn>
                    )}
                  </SuggestedRow>
                );
              })}
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div
              style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}
            >
              No matches. Use the custom input above to add it.
            </div>
          )}
        </SuggestedList>

        <CloseBtn onClick={onClose}>Done</CloseBtn>
      </ModalBox>
    </ModalOverlay>
  );
}
