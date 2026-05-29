'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { formatGroceryListByStore, formatSingleStore } from '@/lib/grocery-formatter'

// ─── Existing styled components (unchanged) ───────────────────────────────────

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $color, theme }) => theme.colors[$color] || theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CountBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $color, theme }) => theme.colors[$color] || theme.colors.grayLight};
  color: ${({ $textColor, theme }) => theme.colors[$textColor] || theme.colors.textSecondary};
  font-weight: 600;
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const Checkbox = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid ${({ $checked, $color, theme }) =>
    $checked ? theme.colors[$color] || theme.colors.teal : theme.colors.border};
  background: ${({ $checked, $color, theme }) =>
    $checked ? theme.colors[$color] || theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 12px;
  transition: all 0.15s ease;
`

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ $checked, theme }) => $checked ? theme.colors.textMuted : theme.colors.textPrimary};
  text-decoration: ${({ $checked }) => $checked ? 'line-through' : 'none'};
`

const ItemCategory = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const ItemMeal = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const StorePill = styled.button`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $color }) => $color ? $color + '20' : 'transparent'};
  color: ${({ $color, theme }) => $color || theme.colors.textSecondary};
  border: 1px solid ${({ $color, theme }) => $color || theme.colors.border};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
`

const StoreDropdown = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  padding-left: 38px;
  animation: fadeIn 0.15s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

const StoreOption = styled.button`
  font-size: 12px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $selected, $color }) =>
    $selected ? ($color || '#ccc') + '25' : 'transparent'};
  color: ${({ $color, theme }) => $color || theme.colors.textPrimary};
  border: 1.5px solid ${({ $selected, $color, theme }) =>
    $selected ? $color || theme.colors.teal : theme.colors.border};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $color, theme }) => $color || theme.colors.teal};
  }
`

const RescanButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

// ─── New styled components ────────────────────────────────────────────────────

const CardHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.md};
`

const ViewToggleGroup = styled.div`
  display: flex;
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const ViewTogglePill = styled.button`
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.borderLight};
  color: ${({ $active, theme }) =>
    $active ? '#FFFFFF' : theme.colors.textSecondary};

  &:hover {
    opacity: 0.9;
  }
`

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const StoreSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background 0.1s ease;
  user-select: none;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const StoreDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color, theme }) => $color || theme.colors.grayMid};
  flex-shrink: 0;
`

const StoreSectionName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`

const StoreSectionCount = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StoreChevron = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: 2px;
`

const StoreShareButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const StoreSectionBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

// ─── Share action sheet ───────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
`

const ActionSheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px 16px 0 0;
  padding: 20px;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

const ActionSheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const ActionSheetTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionSheetClose = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const ActionSheetOption = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: 15px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
  }
`

const OptionIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
`

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  white-space: nowrap;
  pointer-events: none;
`

// ─── SVG icons ────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepPantryCheck({ items, onUpdateItems, stores = [], onAssignStore }) {
  const [localItems, setLocalItems] = useState(items)
  const [expandedItem, setExpandedItem] = useState(null)
  const [viewMode, setViewMode] = useState('flat')
  const [collapsedStores, setCollapsedStores] = useState(new Set())
  const [shareTarget, setShareTarget] = useState(null) // null | 'all' | storeId
  const [toastMsg, setToastMsg] = useState(null)
  const toastTimerRef = useRef(null)
  const [, startTransition] = useTransition()

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const needItems = localItems.filter(i => i.status === 'need')
  const lowItems = localItems.filter(i => i.status === 'low')
  const haveItems = localItems.filter(i => i.status === 'have')

  const hasShareableItems = needItems.length > 0 || lowItems.length > 0

  function showToast(msg) {
    clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2500)
  }

  function toggleItem(id) {
    setLocalItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (item.status === 'need') return { ...item, status: 'have' }
      if (item.status === 'have') return { ...item, status: 'need' }
      if (item.status === 'low') return { ...item, status: 'have' }
      return item
    }))
  }

  function assignStore(itemId, storeId) {
    const updated = localItems.map(item =>
      item.id === itemId ? { ...item, store_assignment: storeId } : item
    )
    setLocalItems(updated)
    setExpandedItem(null)
    if (onUpdateItems) {
      onUpdateItems(updated)
    }
    if (onAssignStore) {
      startTransition(() => {
        onAssignStore(itemId, storeId)
      })
    }
  }

  function getStoreForItem(item) {
    if (!item.store_assignment || stores.length === 0) return null
    return stores.find(s => s.id === item.store_assignment) || null
  }

  function toggleStoreCollapse(storeId) {
    setCollapsedStores(prev => {
      const next = new Set(prev)
      if (next.has(storeId)) {
        next.delete(storeId)
      } else {
        next.add(storeId)
      }
      return next
    })
  }

  // ─── Share helpers ──────────────────────────────────────────────────────────

  function getShareText() {
    if (shareTarget === 'all') {
      return formatGroceryListByStore(localItems)
    }
    const store = stores.find(s => s.id === shareTarget)
    const storeName = store ? store.name : 'No store'
    const storeItems = localItems.filter(
      i => i.store_assignment === shareTarget && (i.status === 'need' || i.status === 'low')
    )
    return formatSingleStore(storeName, storeItems)
  }

  function getShareTitle() {
    if (shareTarget === 'all') return 'Grocery list'
    const store = stores.find(s => s.id === shareTarget)
    return store ? `Grocery list — ${store.name}` : 'Grocery list'
  }

  async function doShare(text, title) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text })
      } catch (e) {
        if (e.name !== 'AbortError') {
          await navigator.clipboard.writeText(text)
          showToast('Copied to clipboard!')
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!')
    }
  }

  function doDownload(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShareList() {
    const text = getShareText()
    const title = getShareTitle()
    setShareTarget(null)
    await doShare(text, title)
  }

  async function handleCopyClipboard() {
    const text = getShareText()
    setShareTarget(null)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!')
    }
  }

  function handleDownload() {
    const text = getShareText()
    const title = getShareTitle()
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt'
    setShareTarget(null)
    doDownload(text, filename)
  }

  // ─── Item row renderer (shared between flat + grouped views) ────────────────

  function renderItemRow(item) {
    const assignedStore = getStoreForItem(item)
    return (
      <div key={item.id}>
        <ItemRow>
          <Checkbox
            $checked={item.status === 'have'}
            $color={item.status === 'low' ? 'amber' : 'coral'}
            onClick={() => toggleItem(item.id)}
          >
            {item.status === 'have' && '✓'}
          </Checkbox>
          <ItemName
            $checked={item.status === 'have'}
            onClick={() => toggleItem(item.id)}
          >
            {item.name}
          </ItemName>
          <ItemCategory>{item.category}</ItemCategory>
          {stores.length > 0 && item.status !== 'have' && (
            <StorePill
              $color={assignedStore?.color}
              onClick={(e) => {
                e.stopPropagation()
                setExpandedItem(expandedItem === item.id ? null : item.id)
              }}
            >
              {assignedStore?.name || 'Assign store'}
            </StorePill>
          )}
          <ItemMeal>{item.meal}</ItemMeal>
        </ItemRow>
        {expandedItem === item.id && stores.length > 0 && (
          <StoreDropdown>
            <StoreOption
              $selected={!item.store_assignment}
              $color={null}
              onClick={() => assignStore(item.id, null)}
            >
              No store
            </StoreOption>
            {stores.map(store => (
              <StoreOption
                key={store.id}
                $selected={item.store_assignment === store.id}
                $color={store.color}
                onClick={() => assignStore(item.id, store.id)}
              >
                {store.icon} {store.name}
              </StoreOption>
            ))}
          </StoreDropdown>
        )}
      </div>
    )
  }

  // ─── Flat view section ──────────────────────────────────────────────────────

  function renderSection(title, sectionItems, color, textColor, checkColor) {
    if (sectionItems.length === 0) return null
    return (
      <>
        <SectionTitle $color={textColor}>
          {title}
          <CountBadge $color={color} $textColor={textColor}>{sectionItems.length}</CountBadge>
        </SectionTitle>
        <ItemList>
          {sectionItems.map(item => {
            const assignedStore = getStoreForItem(item)
            return (
              <div key={item.id}>
                <ItemRow>
                  <Checkbox
                    $checked={item.status === 'have'}
                    $color={checkColor}
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.status === 'have' && '✓'}
                  </Checkbox>
                  <ItemName
                    $checked={item.status === 'have'}
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.name}
                  </ItemName>
                  <ItemCategory>{item.category}</ItemCategory>
                  {stores.length > 0 && item.status !== 'have' && (
                    <StorePill
                      $color={assignedStore?.color}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedItem(expandedItem === item.id ? null : item.id)
                      }}
                    >
                      {assignedStore?.name || 'Assign store'}
                    </StorePill>
                  )}
                  <ItemMeal>{item.meal}</ItemMeal>
                </ItemRow>
                {expandedItem === item.id && stores.length > 0 && (
                  <StoreDropdown>
                    <StoreOption
                      $selected={!item.store_assignment}
                      $color={null}
                      onClick={() => assignStore(item.id, null)}
                    >
                      No store
                    </StoreOption>
                    {stores.map(store => (
                      <StoreOption
                        key={store.id}
                        $selected={item.store_assignment === store.id}
                        $color={store.color}
                        onClick={() => assignStore(item.id, store.id)}
                      >
                        {store.icon} {store.name}
                      </StoreOption>
                    ))}
                  </StoreDropdown>
                )}
              </div>
            )
          })}
        </ItemList>
      </>
    )
  }

  // ─── Grouped view ──────────────────────────────────────────────────────────

  function renderGroupedView() {
    const activeItems = localItems.filter(i => i.status === 'need' || i.status === 'low')

    // Build a map: storeId (or '__none__') -> items[]
    const groups = new Map()
    for (const item of activeItems) {
      const key = item.store_assignment || '__none__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(item)
    }

    // Sort store groups alphabetically by name; put __none__ at end
    const sortedKeys = [...groups.keys()].sort((a, b) => {
      if (a === '__none__') return 1
      if (b === '__none__') return -1
      const nameA = stores.find(s => s.id === a)?.name || a
      const nameB = stores.find(s => s.id === b)?.name || b
      return nameA.localeCompare(nameB)
    })

    if (sortedKeys.length === 0) {
      return (
        <SectionTitle $color="textMuted">
          No items to shop for.
        </SectionTitle>
      )
    }

    return sortedKeys.map(storeKey => {
      const storeItems = groups.get(storeKey)
      const isNone = storeKey === '__none__'
      const store = isNone ? null : stores.find(s => s.id === storeKey)
      const storeName = isNone ? 'No store assigned' : (store?.name || storeKey)
      const storeColor = isNone ? null : store?.color
      const isCollapsed = collapsedStores.has(storeKey)

      return (
        <StoreSectionBlock key={storeKey}>
          <StoreSectionHeader
            onClick={() => toggleStoreCollapse(storeKey)}
          >
            <StoreDot $color={storeColor} />
            <StoreSectionName>{storeName}</StoreSectionName>
            <StoreSectionCount>({storeItems.length} item{storeItems.length !== 1 ? 's' : ''})</StoreSectionCount>
            <StoreChevron>{isCollapsed ? '▶' : '▼'}</StoreChevron>
            {!isNone && (
              <StoreShareButton
                onClick={(e) => {
                  e.stopPropagation()
                  setShareTarget(storeKey)
                }}
                title={`Share ${storeName} list`}
              >
                <ShareIcon />
              </StoreShareButton>
            )}
          </StoreSectionHeader>
          {!isCollapsed && (
            <ItemList>
              {storeItems.map(item => renderItemRow(item))}
            </ItemList>
          )}
        </StoreSectionBlock>
      )
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeaderRow>
          <ViewToggleGroup>
            <ViewTogglePill
              $active={viewMode === 'flat'}
              onClick={() => setViewMode('flat')}
            >
              All items
            </ViewTogglePill>
            <ViewTogglePill
              $active={viewMode === 'grouped'}
              onClick={() => setViewMode('grouped')}
            >
              By store
            </ViewTogglePill>
          </ViewToggleGroup>

          {hasShareableItems && (
            <ShareButton onClick={() => setShareTarget('all')}>
              <ShareIcon />
              Share
            </ShareButton>
          )}
        </CardHeaderRow>

        {viewMode === 'flat' ? (
          <>
            {renderSection('Need to buy', needItems, 'coralLight', 'coral', 'coral')}
            {needItems.length > 0 && lowItems.length > 0 && (
              <div style={{ height: 16 }} />
            )}
            {renderSection('Running low', lowItems, 'amberLight', 'amber', 'amber')}
            {(needItems.length > 0 || lowItems.length > 0) && haveItems.length > 0 && (
              <div style={{ height: 16 }} />
            )}
            {renderSection('Already have', haveItems, 'tealLight', 'teal', 'teal')}
          </>
        ) : (
          renderGroupedView()
        )}

        <RescanButton>
          {'📷'} Rescan pantry
        </RescanButton>
      </Card>

      {shareTarget !== null && (
        <>
          <Backdrop onClick={() => setShareTarget(null)} />
          <ActionSheet>
            <ActionSheetHeader>
              <ActionSheetTitle>
                {shareTarget === 'all'
                  ? 'Share grocery list'
                  : `Share ${stores.find(s => s.id === shareTarget)?.name || ''} list`}
              </ActionSheetTitle>
              <ActionSheetClose onClick={() => setShareTarget(null)}>
                &times;
              </ActionSheetClose>
            </ActionSheetHeader>

            <ActionSheetOption onClick={handleShareList}>
              <OptionIcon>
                <ShareIcon />
              </OptionIcon>
              Share list
            </ActionSheetOption>

            <ActionSheetOption onClick={handleCopyClipboard}>
              <OptionIcon>📋</OptionIcon>
              Copy to clipboard
            </ActionSheetOption>

            <ActionSheetOption onClick={handleDownload}>
              <OptionIcon>⬇️</OptionIcon>
              Download .txt file
            </ActionSheetOption>
          </ActionSheet>
        </>
      )}

      {toastMsg && <Toast>{toastMsg}</Toast>}
    </>
  )
}
