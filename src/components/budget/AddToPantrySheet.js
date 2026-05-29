'use client'

import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { classifyReceiptItemsAction } from '@/lib/actions/ai'
import { addReceiptItemsToPantryAction } from '@/app/(app)/budget/actions'

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`

// ─── Overlay / Sheet ──────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: center;
  }
`

const Sheet = styled.div`
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  animation: ${slideUp} 0.25s ease;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.xl};
  }
`

const Handle = styled.div`
  width: 36px;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
`

const SheetHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
`

const SheetTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SheetSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: ${({ theme }) => theme.colors.border}; }
`

// ─── Loading ──────────────────────────────────────────────────────────────────

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.borderLight};
  border-top-color: ${({ theme }) => theme.colors.teal};
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`

// ─── Quick actions ────────────────────────────────────────────────────────────

const QuickActionsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
`

const QuickBtn = styled.button`
  font-size: 12px;
  padding: 6px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`

// ─── Item list ────────────────────────────────────────────────────────────────

const ItemList = styled.div`
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:last-child { border-bottom: none; }
`

const Checkbox = styled.input`
  accent-color: ${({ theme }) => theme.colors.teal};
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;

  &:disabled { cursor: not-allowed; }
`

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ItemName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
`

const AlreadyAddedBadge = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
`

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const PantryTypeBadge = styled.button`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  cursor: pointer;
  border: none;
  background: ${({ $type, theme }) =>
    $type === 'fresh'
      ? `${theme.colors.teal}26`
      : `${theme.colors.blue}26`};
  color: ${({ $type, theme }) =>
    $type === 'fresh' ? theme.colors.teal : theme.colors.blue};
  transition: opacity 0.15s;

  &:hover { opacity: 0.75; }
`

const ExpiryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const ExpiryLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ExpiryBtn = styled.button`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: underline dashed;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const ExpiryInput = styled.input`
  font-size: 11px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 2px 4px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;

  &:focus { border-color: ${({ theme }) => theme.colors.teal}; }
`

// ─── Footer ───────────────────────────────────────────────────────────────────

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.border}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddToPantrySheet({ receiptId, items, onDone, onClose }) {
  const [classified, setClassified] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [pantryTypeOverrides, setPantryTypeOverrides] = useState({})
  const [expiryOverrides, setExpiryOverrides] = useState({})
  const [editingExpiryId, setEditingExpiryId] = useState(null)
  const [saving, setSaving] = useState(false)

  // Run classification once on mount
  useEffect(() => {
    if (!items?.length) { setLoading(false); return }
    classifyReceiptItemsAction(receiptId, items)
      .then(result => {
        if (result.success) {
          setClassified(result.data)
          const preChecked = new Set(
            items
              .filter(i => !i.added_to_pantry_at)
              .filter(i => {
                const cls = result.data.find(c => c.item_name === i.item_name)
                return cls?.is_food !== false
              })
              .map(i => i.id)
          )
          setCheckedIds(preChecked)
        }
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getPantryType(itemId, itemName) {
    if (pantryTypeOverrides[itemId] != null) return pantryTypeOverrides[itemId]
    const cls = classified?.find(c => c.item_name === itemName)
    return cls?.pantry_type ?? 'staple'
  }

  function getExpiryDate(itemId, itemName) {
    if (expiryOverrides[itemId]) return expiryOverrides[itemId]
    const cls = classified?.find(c => c.item_name === itemName)
    const days = cls?.suggested_shelf_life_days ?? 7
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  function toggleItem(itemId) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function togglePantryType(itemId, current) {
    setPantryTypeOverrides(prev => ({
      ...prev,
      [itemId]: current === 'staple' ? 'fresh' : 'staple',
    }))
  }

  function selectAll() {
    const allFoodIds = foodItems.map(i => i.id)
    setCheckedIds(new Set(allFoodIds))
  }

  function deselectAll() {
    setCheckedIds(new Set())
  }

  // ── Add to pantry ─────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (saving || checkedIds.size === 0) return
    setSaving(true)

    const selections = [...checkedIds].map(itemId => {
      const item = items.find(i => i.id === itemId)
      if (!item) return null
      const cls = classified?.find(c => c.item_name === item.item_name)
      const pantryType = pantryTypeOverrides[itemId] ?? cls?.pantry_type ?? 'staple'
      const shelfLife = cls?.suggested_shelf_life_days ?? 7
      const d = new Date()
      d.setDate(d.getDate() + shelfLife)
      const defaultExpiry = d.toISOString().slice(0, 10)
      return {
        receiptItemId: itemId,
        item_name: item.item_name,
        category: cls?.category ?? item.category ?? 'Other',
        pantry_type: pantryType,
        suggested_shelf_life_days: shelfLife,
        expires_at: pantryType === 'fresh' ? (expiryOverrides[itemId] ?? defaultExpiry) : null,
      }
    }).filter(Boolean)

    const result = await addReceiptItemsToPantryAction(receiptId, selections)
    setSaving(false)
    if (result.success) onDone(result.data)
    // On error, stay open so user can retry
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  // Show all items that are food (is_food !== false). If not yet classified, show all items.
  const foodItems = classified
    ? items.filter(item => {
        const cls = classified.find(c => c.item_name === item.item_name)
        return cls?.is_food !== false
      })
    : items

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Overlay>
      <Sheet>
        <Handle />
        <SheetHeader>
          <div>
            <SheetTitle>Add items to your pantry?</SheetTitle>
            <SheetSubtitle>Tap any item to add it to your pantry.</SheetSubtitle>
          </div>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </SheetHeader>

        {loading ? (
          <LoadingRow>
            <Spinner />
            Classifying items…
          </LoadingRow>
        ) : (
          <>
            <QuickActionsRow>
              <QuickBtn onClick={selectAll}>Select all</QuickBtn>
              <QuickBtn onClick={deselectAll}>Deselect all</QuickBtn>
            </QuickActionsRow>

            <ItemList>
              {foodItems.map(item => {
                const isAdded = !!item.added_to_pantry_at
                const isChecked = checkedIds.has(item.id)
                const pantryType = getPantryType(item.id, item.item_name)
                return (
                  <ItemRow key={item.id} $disabled={isAdded}>
                    <Checkbox
                      type="checkbox"
                      checked={isChecked}
                      disabled={isAdded}
                      onChange={() => toggleItem(item.id)}
                    />
                    <ItemContent>
                      <ItemName>{item.item_name}</ItemName>
                      {isAdded ? (
                        <AlreadyAddedBadge>Already added ✓</AlreadyAddedBadge>
                      ) : (
                        <ItemMeta>
                          <PantryTypeBadge
                            $type={pantryType}
                            onClick={() => togglePantryType(item.id, pantryType)}
                            title="Tap to switch between Staple and Fresh"
                          >
                            {pantryType === 'staple' ? 'Staple' : 'Fresh'}
                          </PantryTypeBadge>
                          {pantryType === 'fresh' && (
                            <ExpiryRow>
                              <ExpiryLabel>Use by</ExpiryLabel>
                              {editingExpiryId === item.id ? (
                                <ExpiryInput
                                  type="date"
                                  value={getExpiryDate(item.id, item.item_name)}
                                  onChange={e => {
                                    setExpiryOverrides(p => ({ ...p, [item.id]: e.target.value }))
                                    setEditingExpiryId(null)
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <ExpiryBtn onClick={() => setEditingExpiryId(item.id)}>
                                  {getExpiryDate(item.id, item.item_name)}
                                </ExpiryBtn>
                              )}
                            </ExpiryRow>
                          )}
                        </ItemMeta>
                      )}
                    </ItemContent>
                  </ItemRow>
                )
              })}
            </ItemList>

            <FooterRow>
              <SecondaryButton onClick={onClose} disabled={saving}>Skip</SecondaryButton>
              <PrimaryButton
                onClick={handleAdd}
                disabled={saving || checkedIds.size === 0}
              >
                {saving ? 'Adding…' : `Add to pantry${checkedIds.size > 0 ? ` (${checkedIds.size})` : ''}`}
              </PrimaryButton>
            </FooterRow>
          </>
        )}
      </Sheet>
    </Overlay>
  )
}
