'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import StepShell from '../shared/StepShell'
import { GROCERY_STORES, GROCERY_CATEGORIES, storeColor } from '@/data/grocery-stores'

// ── Styled components ──────────────────────────────────

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const SectionHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const StoreGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const StoreCard = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '20' : theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  width: 100%;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const StoreIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $color }) => $color + '18'};
  border: 1px solid ${({ $color }) => $color + '30'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const StoreInitial = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`

const StoreInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const StoreName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`

const StoreDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
`

const NearYouBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: #DCFCE7;
  color: #166534;
  white-space: nowrap;
`

const Checkbox = styled.div`
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 2px solid ${({ $checked, theme }) => $checked ? theme.colors.teal : theme.colors.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;

  &::after {
    content: '${({ $checked }) => $checked ? '\\2713' : ''}';
    color: white;
    font-size: 13px;
    font-weight: 700;
  }
`

const SelectedCount = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const OtherInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

// ── Category assignment (collapsed) ───────────────────

const ExpandSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

const ExpandHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Chevron = styled.span`
  font-size: 16px;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ExpandBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const CategoryStoreRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:last-child { margin-bottom: 0; }
`

const CategoryStoreName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const CatChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const CatChip = styled.button`
  font-size: 12px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ $active, theme }) =>
    $active ? '#85B7EB' : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blueLight : theme.colors.background};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
  }
`

// ── Component ──────────────────────────────────────────

export default function FavoriteStoresStep({
  selectedStores,
  otherStoreName,
  categoryAssignments,
  onChangeStores,
  onChangeOtherName,
  onChangeCategoryAssignments,
  onNext,
  onBack,
  onSkip,
  isPending,
  voiceMode = false,
}) {
  const [search, setSearch] = useState('')
  const [nearYouStores, setNearYouStores] = useState([])
  const [locationState, setLocationState] = useState(null)
  const [expanded, setExpanded] = useState(false)

  // ── Location detection ─────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function detectLocation() {
      try {
        // Step 1: Browser geolocation
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 300000,
          })
        })

        if (cancelled) return

        const { latitude, longitude } = position.coords

        // Step 2: Reverse geocode with Nominatim
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'User-Agent': 'KodaApp/1.0' } }
        )
        if (!geoRes.ok) return

        const geoData = await geoRes.json()
        if (cancelled) return

        const state = geoData.address?.state || ''
        const city = geoData.address?.city || geoData.address?.town || ''
        if (state) setLocationState(state)

        // Step 3: Ask Gemini for regional store recommendations
        const region = city ? `${city}, ${state}` : state
        if (!region) return

        const storeNames = GROCERY_STORES.filter(s => s.value !== 'other').map(s => s.label)
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `List the top grocery store chains most commonly available in ${region}. Only include stores from this list: ${storeNames.join(', ')}. Return ONLY a JSON array of store names, ordered by prevalence. Example: ["Walmart","Kroger","Target"]`,
            context: 'grocery',
          }),
        })

        if (!res.ok || cancelled) return
        const aiData = await res.json()
        if (cancelled) return

        // Parse the AI response — it should be a JSON array
        let recommended = []
        try {
          const text = aiData.message || aiData.response || ''
          const match = text.match(/\[[\s\S]*\]/)
          if (match) recommended = JSON.parse(match[0])
        } catch {
          // AI response wasn't parseable, skip
        }

        if (cancelled || !Array.isArray(recommended)) return

        // Map store names to values
        const nearValues = recommended
          .map(name => GROCERY_STORES.find(
            s => s.label.toLowerCase() === name.toLowerCase() || s.value === name.toLowerCase()
          ))
          .filter(Boolean)
          .map(s => s.value)

        setNearYouStores(nearValues)
      } catch {
        // Location denied or failed — silently fall back to full list
      }
    }

    detectLocation()
    return () => { cancelled = true }
  }, [])

  // ── Helpers ────────────────────────────────────────

  const allStores = GROCERY_STORES.filter(s => s.value !== 'other')
  const searchLower = search.toLowerCase()
  const filteredStores = searchLower
    ? allStores.filter(s => s.label.toLowerCase().includes(searchLower))
    : allStores

  const nearYouFiltered = filteredStores.filter(s => nearYouStores.includes(s.value))
  const allOthers = filteredStores.filter(s => !nearYouStores.includes(s.value))

  function toggleStore(value) {
    onChangeStores(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value)
      return [...prev, value]
    })
  }

  function toggleCategory(storeValue, cat) {
    onChangeCategoryAssignments(prev => {
      const current = prev[storeValue] || []
      const next = current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat]
      return { ...prev, [storeValue]: next }
    })
  }

  const storeLabel = (value) => GROCERY_STORES.find(s => s.value === value)?.label || value

  function renderStoreCard(store, isNearYou = false) {
    const color = storeColor(store.value)
    const checked = selectedStores.includes(store.value)
    return (
      <StoreCard
        key={store.value}
        type="button"
        $selected={checked}
        onClick={() => toggleStore(store.value)}
      >
        <StoreIcon $color={color}>
          <StoreInitial $color={color}>{store.label.charAt(0)}</StoreInitial>
        </StoreIcon>
        <StoreInfo>
          <StoreName>
            {store.label}
            {isNearYou && <NearYouBadge>Near you</NearYouBadge>}
          </StoreName>
          <StoreDesc>{store.description}</StoreDesc>
        </StoreInfo>
        <Checkbox $checked={checked} />
      </StoreCard>
    )
  }

  return (
    <StepShell
      title="Where do you usually shop?"
      subtitle="Select your favorite stores. Koda will use these to split your grocery list automatically and tailor Koda suggestions to what each store carries."
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      showSkip
      onSkip={onSkip}
      skipLabel="Skip — I'll set this in settings"
      voiceMode={voiceMode}
    >
      <SearchInput
        type="text"
        placeholder="Search stores..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {selectedStores.length > 0 && (
        <SelectedCount>{selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected</SelectedCount>
      )}

      {nearYouFiltered.length > 0 && (
        <>
          <SectionHeader>Near you</SectionHeader>
          <StoreGrid>
            {nearYouFiltered.map(s => renderStoreCard(s, true))}
          </StoreGrid>
        </>
      )}

      <SectionHeader>{nearYouFiltered.length > 0 ? 'All stores' : 'Select your stores'}</SectionHeader>
      <StoreGrid>
        {allOthers.map(s => renderStoreCard(s))}
      </StoreGrid>

      {/* Other store with custom name */}
      <StoreCard
        type="button"
        $selected={selectedStores.includes('other')}
        onClick={() => toggleStore('other')}
      >
        <StoreIcon $color="#888888">
          <StoreInitial $color="#888888">+</StoreInitial>
        </StoreIcon>
        <StoreInfo>
          <StoreName>Other</StoreName>
          <StoreDesc>A store not in the list</StoreDesc>
          {selectedStores.includes('other') && (
            <OtherInput
              value={otherStoreName}
              onChange={e => onChangeOtherName(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Enter store name"
              maxLength={100}
            />
          )}
        </StoreInfo>
        <Checkbox $checked={selectedStores.includes('other')} />
      </StoreCard>

      {/* Category assignment (optional, collapsed) */}
      {selectedStores.length > 0 && (
        <ExpandSection>
          <ExpandHeader type="button" onClick={() => setExpanded(v => !v)}>
            Assign food categories to each store
            <Chevron $open={expanded}>{'\u25BE'}</Chevron>
          </ExpandHeader>
          {expanded && (
            <ExpandBody>
              {selectedStores.filter(v => v !== 'other' || otherStoreName).map(storeValue => (
                <CategoryStoreRow key={storeValue}>
                  <CategoryStoreName>
                    {storeValue === 'other' ? (otherStoreName || 'Other') : storeLabel(storeValue)}
                  </CategoryStoreName>
                  <CatChipRow>
                    {GROCERY_CATEGORIES.map(cat => (
                      <CatChip
                        key={cat}
                        type="button"
                        $active={(categoryAssignments[storeValue] || []).includes(cat)}
                        onClick={() => toggleCategory(storeValue, cat)}
                      >
                        {cat}
                      </CatChip>
                    ))}
                  </CatChipRow>
                </CategoryStoreRow>
              ))}
            </ExpandBody>
          )}
        </ExpandSection>
      )}
    </StepShell>
  )
}
