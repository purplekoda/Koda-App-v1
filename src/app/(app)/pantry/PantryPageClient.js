'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '@/lib/dal/pantry-constants';
import ScanUpload from '@/components/kitchen/ScanUpload';
import DinnerIdeas from '@/components/kitchen/DinnerIdeas';
import StaplesSection from '@/components/pantry/StaplesSection';
import { startScan, addToMealPlan } from '@/app/(app)/kitchen/actions';
import {
  addPantryItemAction,
  updatePantryItemAction,
  deletePantryItemAction,
  toggleDepletedAction,
  commitScanToPantryAction,
} from './actions';

// ── Expiry helpers ────────────────────────────────────

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring';
  return 'ok';
}

function formatExpiry(expiryDate) {
  if (!expiryDate) return null;
  const d = new Date(expiryDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScanDate(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Styled components ─────────────────────────────────

const PantryLayout = styled.div`
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
`;

const PantryMain = styled.div``;

const PantryStaplesColumn = styled.div`
  position: sticky;
  top: 24px;
  background: ${({ theme }) => theme.colors.backgroundSecondary || theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  max-height: calc(100vh - 120px);

  & > section {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    position: static;
    margin-top: 32px;
    padding-top: 24px;
    border: none;
    border-top: 0.5px solid ${({ theme }) => theme.colors.border};
    border-radius: 0;
    background: transparent;
    max-height: none;
    overflow-y: visible;
  }
`;

const MobileDividerLabel = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const PageTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const MainTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const MainSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const TitleBlock = styled.div``;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`;

const LegendRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ $status, theme }) =>
    $status === 'expired'
      ? theme.colors.coral
      : $status === 'expiring'
        ? '#F59E0B'
        : theme.colors.border};
  border-left: 3px solid ${({ $status, theme }) =>
    $status === 'expired'
      ? theme.colors.coral
      : $status === 'expiring'
        ? '#F59E0B'
        : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  opacity: ${({ $depleted }) => ($depleted ? 0.5 : 1)};
`;

const ItemMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: ${({ $depleted }) => ($depleted ? 'line-through' : 'none')};
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const MetaChip = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $variant }) =>
    $variant === 'expired'
      ? theme.colors.coralLight
      : $variant === 'expiring'
        ? '#FEF3C7'
        : theme.colors.borderLight};
  color: ${({ theme, $variant }) =>
    $variant === 'expired'
      ? theme.colors.coral
      : $variant === 'expiring'
        ? '#92400E'
        : theme.colors.textMuted};
  font-weight: ${({ $variant }) => ($variant === 'expired' || $variant === 'expiring' ? 600 : 400)};
`;

const ItemActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const DangerIconButton = styled(IconButton)`
  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
    border-color: ${({ theme }) => theme.colors.coralMid};
    color: ${({ theme }) => theme.colors.coral};
  }
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs} 0;
  margin-top: ${({ theme }) => theme.spacing.sm};
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};

  &:first-child {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
  }
`;

// ── Scan section ──────────────────────────────────────

const ScanBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 14px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ $stale, theme }) => ($stale ? '#F59E0B' : theme.colors.borderLight)};
  border-left: 3px solid ${({ $stale, theme }) => ($stale ? '#F59E0B' : theme.colors.teal)};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const ScanBannerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ScanBannerTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ScanBannerMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ScanBannerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ScanResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ScanResultsTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const RescanLink = styled.button`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.teal};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const ScanEditList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ScanEditRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const AddedByYouChip = styled(MetaChip)`
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
`;

const ManualAddSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ManualAddLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ManualAddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ManualAddButton = styled.button`
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  min-height: ${({ theme }) => theme.touchTarget};
  flex-shrink: 0;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const SaveScanButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const PreScanItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

const PreScanItemName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PreScanItemList = styled.div`
  margin: ${({ theme }) => theme.spacing.md} 0;
  max-height: 280px;
  overflow-y: auto;
`;

const PreScanQuestion = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmptyTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

// ── Modal ─────────────────────────────────────────────

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
  max-width: 480px;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  padding: 9px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const Select = styled.select`
  padding: 9px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const PrimaryButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.coral};
  margin: 0;
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

// ── Form state helper ──────────────────────────────────

const EMPTY_FORM = {
  ingredient_name: '',
  quantity: '',
  unit: '',
  purchase_date: '',
  expiry_date: '',
  category: 'Other',
};

function itemToForm(item) {
  return {
    ingredient_name: item.ingredient_name || '',
    quantity: item.quantity != null ? String(item.quantity) : '',
    unit: item.unit || '',
    purchase_date: item.purchase_date || '',
    expiry_date: item.expiry_date || '',
    category: item.category || 'Other',
  };
}

function getScanIsStale(lastScan) {
  if (!lastScan?.scannedAt) return false;
  const days = Math.floor(
    (Date.now() - new Date(lastScan.scannedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  return days >= 7;
}

// ── Component ──────────────────────────────────────────

export default function PantryPageClient({
  initialItems,
  initialScanItems,
  initialDinnerIdeas,
  initialLastScan,
  initialStaples,
}) {
  const router = useRouter();

  // ── Managed pantry state ──
  const [items, setItems] = useState(initialItems || []);

  // Sync items when server re-fetches after router.refresh()
  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  // ── Scan state ──
  const [scanScreen, setScanScreen] = useState('idle');
  const [scanEditItems, setScanEditItems] = useState([]); // AI-detected, user-curated
  const [scanManualAdds, setScanManualAdds] = useState([]); // typed in during review
  const [scanAddName, setScanAddName] = useState('');
  const [dinnerIdeas, setDinnerIdeas] = useState(initialDinnerIdeas || []);
  const [lastScan, setLastScan] = useState(initialLastScan);
  const [isScanPending, startScanTransition] = useTransition();
  const [isSavingScan, startSaveScanTransition] = useTransition();

  // ── Pre-scan dialog state ──
  const [preScanOpen, setPreScanOpen] = useState(false);
  const [preScanShowList, setPreScanShowList] = useState(false);
  const [shouldDeleteManual, setShouldDeleteManual] = useState(false);

  const toastTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), []);

  function showToast(msg) {
    clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  // ── Scan handlers ──

  function handleScanButtonClick() {
    const manualItems = items.filter((i) => i.source === 'manual');
    if (manualItems.length > 0) {
      setPreScanShowList(false);
      setShouldDeleteManual(false);
      setPreScanOpen(true);
    } else {
      setScanScreen('scanning');
    }
  }

  function handlePreScanNo() {
    setShouldDeleteManual(true);
    setPreScanOpen(false);
    setScanScreen('scanning');
  }

  function handlePreScanDeleteItem(itemId) {
    startTransition(async () => {
      const result = await deletePantryItemAction(itemId);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    });
  }

  function handlePreScanProceed() {
    setPreScanOpen(false);
    setPreScanShowList(false);
    setScanScreen('scanning');
  }

  function handleScanComplete(imageData) {
    startScanTransition(async () => {
      const result = await startScan(imageData);
      if (result.success && result.data) {
        setScanEditItems(result.data.pantryItems);
        setScanManualAdds([]);
        setScanAddName('');
        setDinnerIdeas(result.data.dinnerIdeas);
        if (result.data.lastScan) setLastScan(result.data.lastScan);
        setScanScreen('results');
      } else {
        showToast(result?.error || 'Scan failed. Please try again.');
        setScanScreen('idle');
      }
    });
  }

  function handleDeleteScanItem(itemId) {
    setScanEditItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function handleAddManualScanItem() {
    const name = scanAddName.trim();
    if (!name) return;
    setScanManualAdds((prev) => [...prev, { id: `madd-${Date.now()}`, name, category: 'Other' }]);
    setScanAddName('');
  }

  function handleSaveScanItems() {
    const total = scanEditItems.length + scanManualAdds.length;
    startSaveScanTransition(async () => {
      const result = await commitScanToPantryAction(
        scanEditItems,
        scanManualAdds,
        shouldDeleteManual,
      );
      if (result.success) {
        setScanScreen('idle');
        setScanEditItems([]);
        setScanManualAdds([]);
        setShouldDeleteManual(false);
        router.refresh();
        showToast(`${total} item${total !== 1 ? 's' : ''} saved to pantry`);
      } else {
        showToast(result.error || 'Could not save items.');
      }
    });
  }

  function handleAddToMealPlan(idea) {
    startScanTransition(async () => {
      const result = await addToMealPlan(idea.id);
      if (result.success) {
        showToast(`Added "${result.data?.addedMeal || idea.name}" to tonight\u2019s dinner`);
      } else {
        showToast('Failed to add to meal plan. Please try again.');
      }
    });
  }

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setForm(itemToForm(item));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setFormError(null);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.ingredient_name.trim()) {
      setFormError('Ingredient name is required.');
      return;
    }
    startTransition(async () => {
      const result = editingItem
        ? await updatePantryItemAction(editingItem.id, form)
        : await addPantryItemAction(form);

      if (result.success && result.data) {
        if (editingItem) {
          setItems((prev) => prev.map((i) => (i.id === editingItem.id ? result.data : i)));
          showToast('Item updated');
        } else {
          setItems((prev) => [...prev, result.data]);
          showToast('Item added');
        }
        closeModal();
      } else {
        setFormError(result.error || 'Could not save item.');
      }
    });
  }

  function handleDelete(item) {
    if (!confirm(`Remove "${item.ingredient_name}" from your pantry?`)) return;
    if (!confirm('This cannot be undone. Are you sure?')) return;
    startTransition(async () => {
      const result = await deletePantryItemAction(item.id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        showToast('Item removed');
      } else {
        showToast(result.error || 'Could not remove item.');
      }
    });
  }

  function handleToggleDepleted(item) {
    startTransition(async () => {
      const result = await toggleDepletedAction(item.id, !item.is_depleted);
      if (result.success) {
        // Remove depleted items from list (page shows non-depleted only)
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        showToast(item.is_depleted ? 'Marked as available' : 'Marked as used up');
      } else {
        showToast(result.error || 'Could not update item.');
      }
    });
  }

  const sortByExpiry = (a, b) => {
    const order = { expired: 0, expiring: 1, ok: 2, none: 3 };
    const sa = getExpiryStatus(a.expiry_date);
    const sb = getExpiryStatus(b.expiry_date);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date);
    return a.ingredient_name.localeCompare(b.ingredient_name);
  };

  const manualItems = [...items.filter((i) => i.source !== 'scan')].sort(sortByExpiry);
  const scanItems = [...items.filter((i) => i.source === 'scan')].sort(sortByExpiry);

  // Get the scan date from the most recent scan item's created_at
  const scanDate =
    scanItems.length > 0
      ? formatScanDate(
          scanItems.reduce(
            (latest, i) => (!latest || i.created_at > latest ? i.created_at : latest),
            null,
          ),
        )
      : null;

  function renderItem(item) {
    const status = getExpiryStatus(item.expiry_date);
    const expiryLabel = item.expiry_date
      ? status === 'expired'
        ? `Expired ${formatExpiry(item.expiry_date)}`
        : status === 'expiring'
          ? `Expires ${formatExpiry(item.expiry_date)}`
          : `Exp. ${formatExpiry(item.expiry_date)}`
      : null;

    const qtyLabel =
      item.quantity != null ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : null;

    return (
      <ItemCard key={item.id} $status={status} $depleted={item.is_depleted}>
        <ItemMain>
          <ItemName $depleted={item.is_depleted}>{item.ingredient_name}</ItemName>
          <ItemMeta>
            {qtyLabel && <MetaChip>{qtyLabel}</MetaChip>}
            <MetaChip>{item.category}</MetaChip>
            {expiryLabel && (
              <MetaChip
                $variant={
                  status === 'expired' ? 'expired' : status === 'expiring' ? 'expiring' : undefined
                }
              >
                {expiryLabel}
              </MetaChip>
            )}
          </ItemMeta>
        </ItemMain>
        <ItemActions>
          <IconButton
            title={item.is_depleted ? 'Mark as available' : 'Mark as used up'}
            onClick={() => handleToggleDepleted(item)}
            disabled={isPending}
          >
            {item.is_depleted ? '\u21A9' : '\u2713'}
          </IconButton>
          <IconButton title="Edit" onClick={() => openEdit(item)} disabled={isPending}>
            {'\u270F\uFE0F'}
          </IconButton>
          <DangerIconButton title="Remove" onClick={() => handleDelete(item)} disabled={isPending}>
            {'\u2715'}
          </DangerIconButton>
        </ItemActions>
      </ItemCard>
    );
  }

  const expiringCount = items.filter((i) => {
    const s = getExpiryStatus(i.expiry_date);
    return s === 'expiring' || s === 'expired';
  }).length;

  const scanIsStale = getScanIsStale(lastScan);

  return (
    <>
      <PageTitle>
        <MainTitle>Pantry</MainTitle>
        <MainSubtitle>
          Manage your ingredients and staples — Koda uses this for meal planning.
        </MainSubtitle>
      </PageTitle>

      <PantryLayout>
        {/* ── Left column: Current Pantry ── */}
        <PantryMain>
          <PageHeader>
            <TitleBlock>
              <Title>Current Pantry</Title>
              <Subtitle>
                {items.length === 0
                  ? 'Track what you have — Koda uses this for meal planning.'
                  : `${items.length} item${items.length !== 1 ? 's' : ''}${expiringCount > 0 ? ` · ${expiringCount} need${expiringCount === 1 ? 's' : ''} attention` : ''}`}
              </Subtitle>
            </TitleBlock>
            <AddButton onClick={openAdd}>+ Add item</AddButton>
          </PageHeader>

          {/* ── Scan section ── */}
          {scanScreen === 'idle' && (
            <ScanBanner $stale={scanIsStale}>
              <ScanBannerInfo>
                <ScanBannerTitle>
                  {scanIsStale ? 'Time for a fresh scan' : 'Scan your fridge'}
                </ScanBannerTitle>
                <ScanBannerMeta>
                  {lastScan
                    ? `Last scan: ${lastScan.date} \u00B7 ${lastScan.itemsDetected} items`
                    : 'Take photos and Koda will detect items and suggest meals'}
                </ScanBannerMeta>
              </ScanBannerInfo>
              <ScanBannerButton onClick={handleScanButtonClick} disabled={isScanPending}>
                {'\uD83D\uDCF7'} {scanIsStale ? 'Re-scan' : 'Scan fridge'}
              </ScanBannerButton>
            </ScanBanner>
          )}

          {scanScreen === 'scanning' && <ScanUpload onScanComplete={handleScanComplete} />}

          {scanScreen === 'results' && (
            <>
              <ScanResultsHeader>
                <ScanResultsTitle>
                  Review {scanEditItems.length + scanManualAdds.length} detected item
                  {scanEditItems.length + scanManualAdds.length !== 1 ? 's' : ''}
                </ScanResultsTitle>
                <RescanLink onClick={() => setScanScreen('scanning')}>Scan again</RescanLink>
              </ScanResultsHeader>

              <ScanEditList>
                {scanEditItems.map((item) => (
                  <ScanEditRow key={item.id}>
                    <ItemMain>
                      <ItemName>{item.name}</ItemName>
                      <ItemMeta>
                        <MetaChip>{item.category}</MetaChip>
                        {item.freshness === 'expiring' && (
                          <MetaChip $variant="expiring">Expiring soon</MetaChip>
                        )}
                        {item.freshness === 'low' && (
                          <MetaChip $variant="expired">Running low</MetaChip>
                        )}
                      </ItemMeta>
                    </ItemMain>
                    <DangerIconButton title="Remove" onClick={() => handleDeleteScanItem(item.id)}>
                      {'\u2715'}
                    </DangerIconButton>
                  </ScanEditRow>
                ))}
                {scanManualAdds.map((item) => (
                  <ScanEditRow key={item.id}>
                    <ItemMain>
                      <ItemName>{item.name}</ItemName>
                      <ItemMeta>
                        <MetaChip>{item.category}</MetaChip>
                        <AddedByYouChip>Added by you</AddedByYouChip>
                      </ItemMeta>
                    </ItemMain>
                    <DangerIconButton
                      title="Remove"
                      onClick={() =>
                        setScanManualAdds((prev) => prev.filter((i) => i.id !== item.id))
                      }
                    >
                      {'\u2715'}
                    </DangerIconButton>
                  </ScanEditRow>
                ))}
              </ScanEditList>

              <ManualAddSection>
                <ManualAddLabel>Missing something? Add it manually:</ManualAddLabel>
                <ManualAddRow>
                  <Input
                    value={scanAddName}
                    onChange={(e) => setScanAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddManualScanItem();
                    }}
                    placeholder="e.g. Greek yogurt"
                  />
                  <ManualAddButton onClick={handleAddManualScanItem} disabled={!scanAddName.trim()}>
                    + Add
                  </ManualAddButton>
                </ManualAddRow>
              </ManualAddSection>

              {dinnerIdeas.length > 0 && (
                <DinnerIdeas ideas={dinnerIdeas} onAddToMealPlan={handleAddToMealPlan} />
              )}

              <SaveScanButton
                onClick={handleSaveScanItems}
                disabled={isSavingScan || scanEditItems.length + scanManualAdds.length === 0}
              >
                {isSavingScan
                  ? 'Saving\u2026'
                  : `Save ${scanEditItems.length + scanManualAdds.length} item${scanEditItems.length + scanManualAdds.length !== 1 ? 's' : ''} to pantry`}
              </SaveScanButton>
            </>
          )}

          {items.length > 0 && (
            <LegendRow>
              <LegendItem>
                <LegendDot
                  $color={({ theme }) => theme?.colors?.coral || '#EF4444'}
                  style={{ background: '#EF4444' }}
                />
                Expired
              </LegendItem>
              <LegendItem>
                <LegendDot style={{ background: '#F59E0B' }} />
                Expiring within 3 days
              </LegendItem>
              <LegendItem>
                <LegendDot style={{ background: '#1D9E75' }} />
                Fresh
              </LegendItem>
            </LegendRow>
          )}

          {items.length === 0 ? (
            <EmptyState>
              <EmptyIcon>{'\uD83E\uDEDB'}</EmptyIcon>
              <EmptyTitle>No pantry items yet</EmptyTitle>
              <p>
                Add ingredients you have on hand. Koda will always check here first when planning
                meals.
              </p>
            </EmptyState>
          ) : (
            <ItemList>
              {manualItems.length > 0 && scanItems.length > 0 && (
                <SectionLabel>Manually added</SectionLabel>
              )}
              {manualItems.map((item) => renderItem(item))}

              {scanItems.length > 0 && (
                <SectionLabel>Scanned{scanDate ? ` · ${scanDate}` : ''}</SectionLabel>
              )}
              {scanItems.map((item) => renderItem(item))}
            </ItemList>
          )}
        </PantryMain>

        {/* ── Right column: Pantry Staples ── */}
        <PantryStaplesColumn>
          <MobileDividerLabel>Pantry Staples</MobileDividerLabel>
          <StaplesSection initialStaples={initialStaples} />
        </PantryStaplesColumn>
      </PantryLayout>

      {/* ── Pre-scan dialog: ask about existing manual items ── */}
      {preScanOpen && (
        <ModalOverlay onClick={() => setPreScanOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>You have manually added items</ModalTitle>

            {!preScanShowList ? (
              <>
                <PreScanQuestion>
                  {items.filter((i) => i.source === 'manual').length} manually added item
                  {items.filter((i) => i.source === 'manual').length !== 1 ? 's are' : ' is'}{' '}
                  already in your pantry. Keep{' '}
                  {items.filter((i) => i.source === 'manual').length !== 1 ? 'them' : 'it'} after
                  this scan?
                </PreScanQuestion>
                <ModalActions>
                  <SecondaryButton onClick={handlePreScanNo} disabled={isPending}>
                    No, remove{' '}
                    {items.filter((i) => i.source === 'manual').length !== 1 ? 'them' : 'it'}
                  </SecondaryButton>
                  <PrimaryButton onClick={() => setPreScanShowList(true)}>
                    Yes, show me the list
                  </PrimaryButton>
                </ModalActions>
              </>
            ) : (
              <>
                <PreScanQuestion>
                  Remove any items you don&apos;t want to keep, then proceed to scan:
                </PreScanQuestion>
                <PreScanItemList>
                  {items
                    .filter((i) => i.source === 'manual')
                    .map((item) => (
                      <PreScanItemRow key={item.id}>
                        <PreScanItemName>{item.ingredient_name}</PreScanItemName>
                        <DangerIconButton
                          title="Remove"
                          onClick={() => handlePreScanDeleteItem(item.id)}
                          disabled={isPending}
                        >
                          {'\u2715'}
                        </DangerIconButton>
                      </PreScanItemRow>
                    ))}
                  {items.filter((i) => i.source === 'manual').length === 0 && (
                    <PreScanQuestion style={{ marginBottom: 0 }}>
                      All manual items removed.
                    </PreScanQuestion>
                  )}
                </PreScanItemList>
                <ModalActions>
                  <SecondaryButton onClick={() => setPreScanOpen(false)}>Cancel</SecondaryButton>
                  <PrimaryButton onClick={handlePreScanProceed} disabled={isPending}>
                    Scan now
                  </PrimaryButton>
                </ModalActions>
              </>
            )}
          </ModalBox>
        </ModalOverlay>
      )}

      {modalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingItem ? 'Edit item' : 'Add pantry item'}</ModalTitle>

            <FormGroup>
              <Label htmlFor="ingredient_name">Ingredient *</Label>
              <Input
                id="ingredient_name"
                value={form.ingredient_name}
                onChange={(e) => setField('ingredient_name', e.target.value)}
                placeholder="e.g. Chicken Breast"
                autoFocus
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  placeholder="e.g. 1.5"
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="unit">Unit</Label>
                <Select
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                >
                  <option value="">— none —</option>
                  {PANTRY_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                {PANTRY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="purchase_date">Purchase date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setField('purchase_date', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="expiry_date">Expiry date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setField('expiry_date', e.target.value)}
                />
              </FormGroup>
            </FormRow>

            {formError && <ErrorText role="alert">{formError}</ErrorText>}

            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={isPending}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSave} disabled={isPending}>
                {isPending ? 'Saving\u2026' : editingItem ? 'Save changes' : 'Add item'}
              </PrimaryButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
