'use client'

import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import RecipeForm from '@/components/recipes/RecipeForm'
import Modal from '@/components/recipes/Modal'
import { createRecipeAction, generateRecipeAction, scanRecipeAction, importRecipeFromUrlAction } from './actions'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'first', label: 'First added' },
  { value: 'name_asc', label: 'Name (A\u2013Z)' },
  { value: 'name_desc', label: 'Name (Z\u2013A)' },
  { value: 'quickest', label: 'Quickest first' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All recipes' },
  { value: 'manual', label: 'Added manually' },
  { value: 'gemini', label: 'Added by Gemini' },
]

const TIME_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: '0-30', label: '0\u201330 min' },
  { value: '30-60', label: '30\u201360 min' },
  { value: '60+', label: '60+ min' },
]

const MEAL_TYPE_OPTIONS = [
  { value: 'all', label: 'Any meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'desserts', label: 'Desserts' },
]

const MEAL_TYPE_ALIASES = {
  snacks: ['snack', 'snacks'],
  desserts: ['dessert', 'desserts'],
}

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const TitleBlock = styled.div``

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.purpleLight};
  color: ${({ theme }) => theme.colors.purpleDark};
  border: 0.5px solid ${({ theme }) => theme.colors.purpleMid};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleMid};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const PromptTextarea = styled.textarea`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const PromptHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`

const PromptActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const PromptPrimary = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.purple};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PromptSecondary = styled.button`
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
`

const PromptError = styled.p`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SearchInput = styled.input`
  padding: 10px 14px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  max-width: 420px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const PopoverWrap = styled.div`
  position: relative;
`

const ControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.tealDark : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.textPrimary};
  cursor: pointer;
  min-height: 36px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.tealDark};
  }
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.tealDark};
  color: white;
`

const Caret = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  max-width: 320px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: ${({ theme }) => theme.spacing.md};
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const PopoverSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const PopoverLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const ScrollChipRow = styled(ChipRow)`
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
`

const Chip = styled.button`
  padding: 5px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.tealDark : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.surface};
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.textSecondary)};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    border-color: ${({ theme }) => theme.colors.tealDark};
  }
`

const SortOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.textPrimary};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const Check = styled.span`
  color: ${({ theme }) => theme.colors.tealDark};
`

const ClearButton = styled.button`
  padding: 8px 12px;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  min-height: 36px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const ResultCount = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  text-decoration: none;
  color: inherit;
  transition: all 0.15s ease;
  box-shadow: ${({ theme }) => theme.shadows.card};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.elevated};
    border-color: ${({ theme }) => theme.colors.tealMid};
  }
`

const CardName = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`

const CardDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Meta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
`

const Tag = styled.span`
  padding: 3px 10px;
  font-size: 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const EmptyTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`

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
`

const ScanDropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ScanDropIcon = styled.div`
  font-size: 32px;
`

const ScanDropText = styled.p`
  font-size: 14px;
  margin: 0;
`

const ScanDropHint = styled.p`
  font-size: 12px;
  margin: 0;
`

const ScanPreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const ScanPreviewItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const ScanPreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ScanRemoveBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
`

const ScanAddMore = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }
`

function totalTime(recipe) {
  const p = Number(recipe.prep_time_minutes) || 0
  const c = Number(recipe.cook_time_minutes) || 0
  const total = p + c
  return total > 0 ? `${total} min` : null
}

export default function RecipesPageClient({ initialRecipes }) {
  const [recipes, setRecipes] = useState(initialRecipes || [])
  const [modalOpen, setModalOpen] = useState(false)
  const [formInitial, setFormInitial] = useState(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [promptError, setPromptError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanFiles, setScanFiles] = useState([])
  const [scanPreviews, setScanPreviews] = useState([])
  const [scanError, setScanError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [urlError, setUrlError] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [activeIngredients, setActiveIngredients] = useState([])
  const [timeFilter, setTimeFilter] = useState('all')
  const [mealTypeFilter, setMealTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [openPopover, setOpenPopover] = useState(null)

  const filtersRef = useRef(null)
  const sortRef = useRef(null)

  useEffect(() => {
    if (!openPopover) return
    function handleClick(e) {
      const ref = openPopover === 'filters' ? filtersRef : sortRef
      if (ref.current && !ref.current.contains(e.target)) setOpenPopover(null)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpenPopover(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [openPopover])

  const allTags = useMemo(() => {
    const set = new Set()
    for (const r of recipes) {
      if (Array.isArray(r.tags)) r.tags.forEach(t => t && set.add(t))
    }
    return Array.from(set).sort()
  }, [recipes])

  const allIngredients = useMemo(() => {
    const set = new Set()
    for (const r of recipes) {
      if (Array.isArray(r.ingredients)) {
        r.ingredients.forEach(ing => {
          const name = typeof ing === 'string' ? ing : ing?.name
          if (name) set.add(name.trim().toLowerCase())
        })
      }
    }
    return Array.from(set).sort()
  }, [recipes])

  const hasGeminiRecipe = useMemo(
    () => recipes.some(r => r.source === 'gemini'),
    [recipes]
  )

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = recipes.filter(r => {
      if (activeTags.length > 0) {
        const tags = Array.isArray(r.tags) ? r.tags : []
        if (!activeTags.every(t => tags.includes(t))) return false
      }
      if (activeIngredients.length > 0) {
        const names = Array.isArray(r.ingredients)
          ? r.ingredients
              .map(ing => (typeof ing === 'string' ? ing : ing?.name))
              .filter(Boolean)
              .map(n => n.trim().toLowerCase())
          : []
        if (!activeIngredients.every(i => names.includes(i))) return false
      }
      if (timeFilter !== 'all') {
        const t = (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0)
        if (timeFilter === '0-30' && !(t >= 0 && t <= 30)) return false
        if (timeFilter === '30-60' && !(t > 30 && t <= 60)) return false
        if (timeFilter === '60+' && !(t > 60)) return false
      }
      if (mealTypeFilter !== 'all') {
        const tags = (Array.isArray(r.tags) ? r.tags : []).map(t =>
          String(t).toLowerCase()
        )
        const aliases = MEAL_TYPE_ALIASES[mealTypeFilter] || [mealTypeFilter]
        if (!aliases.some(a => tags.includes(a))) return false
      }
      if (sourceFilter === 'gemini' && r.source !== 'gemini') return false
      if (sourceFilter === 'manual' && r.source === 'gemini') return false
      if (q) {
        const haystack = [r.name, r.description, ...(r.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const sorted = [...list]
    const timeOf = r => (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0)
    const dateOf = r => new Date(r.created_at || 0).getTime()
    switch (sortBy) {
      case 'first':
        sorted.sort((a, b) => dateOf(a) - dateOf(b))
        break
      case 'name_asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'name_desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
        break
      case 'quickest':
        sorted.sort((a, b) => timeOf(a) - timeOf(b))
        break
      case 'recent':
      default:
        sorted.sort((a, b) => dateOf(b) - dateOf(a))
    }
    return sorted
  }, [recipes, search, activeTags, activeIngredients, timeFilter, mealTypeFilter, sourceFilter, sortBy])

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function toggleIngredient(ingredient) {
    setActiveIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    )
  }

  function clearFilters() {
    setSearch('')
    setActiveTags([])
    setActiveIngredients([])
    setTimeFilter('all')
    setMealTypeFilter('all')
    setSourceFilter('all')
  }

  const activeFilterCount =
    activeTags.length +
    activeIngredients.length +
    (timeFilter !== 'all' ? 1 : 0) +
    (mealTypeFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0)
  const isFiltering = search.trim() !== '' || activeFilterCount > 0
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function openBlankForm() {
    setFormInitial(null)
    setModalOpen(true)
  }

  function closeForm() {
    setModalOpen(false)
    setFormInitial(null)
  }

  async function handleCreate(payload) {
    return new Promise(resolve => {
      startTransition(async () => {
        const result = await createRecipeAction(payload)
        if (result.success && result.data) {
          setRecipes(prev => [result.data, ...prev])
          closeForm()
          showToast('Recipe added')
        }
        resolve(result)
      })
    })
  }

  function handleScanFiles(e) {
    const incoming = Array.from(e.target.files || [])
    if (!incoming.length) return
    const combined = [...scanFiles, ...incoming].slice(0, 6)
    setScanFiles(combined)
    setScanPreviews(combined.map(f => URL.createObjectURL(f)))
    setScanError(null)
    e.target.value = ''
  }

  function removeScanFile(index) {
    URL.revokeObjectURL(scanPreviews[index])
    const nextFiles = scanFiles.filter((_, i) => i !== index)
    const nextPreviews = scanPreviews.filter((_, i) => i !== index)
    setScanFiles(nextFiles)
    setScanPreviews(nextPreviews)
  }

  function closeScan() {
    scanPreviews.forEach(url => URL.revokeObjectURL(url))
    setScanOpen(false)
    setScanFiles([])
    setScanPreviews([])
    setScanError(null)
  }

  async function handleScan() {
    if (scanFiles.length === 0) {
      setScanError('Add at least one photo.')
      return
    }
    setScanError(null)
    setIsScanning(true)
    const fd = new FormData()
    scanFiles.forEach(f => fd.append('images', f))
    const result = await scanRecipeAction(fd)
    setIsScanning(false)
    if (result.success && result.data) {
      setFormInitial(result.data)
      closeScan()
      setModalOpen(true)
    } else {
      setScanError(result.error || 'Could not extract recipe.')
    }
  }

  async function handleImportUrl() {
    const trimmed = urlText.trim()
    if (!trimmed) {
      setUrlError('Paste a recipe URL.')
      return
    }
    setUrlError(null)
    setIsImporting(true)
    const result = await importRecipeFromUrlAction(trimmed)
    setIsImporting(false)
    if (result.success && result.data) {
      setFormInitial(result.data)
      setUrlOpen(false)
      setUrlText('')
      setModalOpen(true)
    } else {
      setUrlError(result.error || 'Could not import recipe.')
    }
  }

  async function handleGenerate() {
    const trimmed = promptText.trim()
    if (!trimmed) {
      setPromptError('Describe the recipe you want.')
      return
    }
    setPromptError(null)
    setIsGenerating(true)
    const result = await generateRecipeAction(trimmed)
    setIsGenerating(false)
    if (result.success && result.data) {
      setFormInitial(result.data)
      setPromptOpen(false)
      setPromptText('')
      setModalOpen(true)
    } else {
      setPromptError(result.error || 'Could not generate recipe.')
    }
  }

  return (
    <>
      <PageHeader>
        <TitleBlock>
          <Title>Recipes</Title>
          <Subtitle>Save and organize your favorite dishes.</Subtitle>
        </TitleBlock>
        <HeaderActions>
          <GenerateButton onClick={() => setUrlOpen(true)} disabled={isImporting}>
            {'\uD83D\uDD17 Import URL'}
          </GenerateButton>
          <GenerateButton onClick={() => setScanOpen(true)} disabled={isScanning}>
            {'\uD83D\uDCF7 Scan recipe'}
          </GenerateButton>
          <GenerateButton onClick={() => setPromptOpen(true)} disabled={isGenerating}>
            {'\u2728 Generate with AI'}
          </GenerateButton>
          <AddButton onClick={openBlankForm}>+ New recipe</AddButton>
        </HeaderActions>
      </PageHeader>

      {recipes.length > 0 && (
        <FilterBar>
          <SearchInput
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes by name, description, or tag"
            aria-label="Search recipes"
          />
          <ControlRow>
            <PopoverWrap ref={filtersRef}>
              <ControlButton
                type="button"
                $active={activeFilterCount > 0 || openPopover === 'filters'}
                onClick={() => setOpenPopover(openPopover === 'filters' ? null : 'filters')}
                aria-haspopup="true"
                aria-expanded={openPopover === 'filters'}
              >
                Filters
                {activeFilterCount > 0 && <Badge>{activeFilterCount}</Badge>}
                <Caret>{'\u25BE'}</Caret>
              </ControlButton>
              {openPopover === 'filters' && (
                <Popover role="dialog" aria-label="Filter recipes">
                  <PopoverSection>
                    <PopoverLabel>Time</PopoverLabel>
                    <ChipRow>
                      {TIME_OPTIONS.map(opt => (
                        <Chip
                          key={opt.value}
                          type="button"
                          $active={timeFilter === opt.value}
                          onClick={() => setTimeFilter(opt.value)}
                          aria-pressed={timeFilter === opt.value}
                        >
                          {opt.label}
                        </Chip>
                      ))}
                    </ChipRow>
                  </PopoverSection>
                  <PopoverSection>
                    <PopoverLabel>Meal type</PopoverLabel>
                    <ChipRow>
                      {MEAL_TYPE_OPTIONS.map(opt => (
                        <Chip
                          key={opt.value}
                          type="button"
                          $active={mealTypeFilter === opt.value}
                          onClick={() => setMealTypeFilter(opt.value)}
                          aria-pressed={mealTypeFilter === opt.value}
                        >
                          {opt.label}
                        </Chip>
                      ))}
                    </ChipRow>
                  </PopoverSection>
                  {allIngredients.length > 0 && (
                    <PopoverSection>
                      <PopoverLabel>Ingredients</PopoverLabel>
                      <ScrollChipRow>
                        {allIngredients.map(ing => (
                          <Chip
                            key={ing}
                            type="button"
                            $active={activeIngredients.includes(ing)}
                            onClick={() => toggleIngredient(ing)}
                            aria-pressed={activeIngredients.includes(ing)}
                          >
                            {ing}
                          </Chip>
                        ))}
                      </ScrollChipRow>
                    </PopoverSection>
                  )}
                  {allTags.length > 0 && (
                    <PopoverSection>
                      <PopoverLabel>Tags</PopoverLabel>
                      <ChipRow>
                        {allTags.map(tag => (
                          <Chip
                            key={tag}
                            type="button"
                            $active={activeTags.includes(tag)}
                            onClick={() => toggleTag(tag)}
                            aria-pressed={activeTags.includes(tag)}
                          >
                            {tag}
                          </Chip>
                        ))}
                      </ChipRow>
                    </PopoverSection>
                  )}
                  {hasGeminiRecipe && (
                    <PopoverSection>
                      <PopoverLabel>Source</PopoverLabel>
                      <ChipRow>
                        {SOURCE_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={sourceFilter === opt.value}
                            onClick={() => setSourceFilter(opt.value)}
                            aria-pressed={sourceFilter === opt.value}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                    </PopoverSection>
                  )}
                </Popover>
              )}
            </PopoverWrap>

            <PopoverWrap ref={sortRef}>
              <ControlButton
                type="button"
                $active={openPopover === 'sort'}
                onClick={() => setOpenPopover(openPopover === 'sort' ? null : 'sort')}
                aria-haspopup="true"
                aria-expanded={openPopover === 'sort'}
              >
                {`Sort: ${sortLabel}`}
                <Caret>{'\u25BE'}</Caret>
              </ControlButton>
              {openPopover === 'sort' && (
                <Popover role="menu" aria-label="Sort recipes">
                  {SORT_OPTIONS.map(opt => (
                    <SortOption
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortBy === opt.value}
                      $active={sortBy === opt.value}
                      onClick={() => {
                        setSortBy(opt.value)
                        setOpenPopover(null)
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check>{'\u2713'}</Check>}
                    </SortOption>
                  ))}
                </Popover>
              )}
            </PopoverWrap>

            {isFiltering && (
              <ClearButton type="button" onClick={clearFilters}>
                Clear
              </ClearButton>
            )}
          </ControlRow>
          {isFiltering && (
            <ResultCount>
              {filteredRecipes.length === 1
                ? '1 recipe'
                : `${filteredRecipes.length} recipes`}
            </ResultCount>
          )}
        </FilterBar>
      )}

      {recipes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>{'\uD83D\uDCD6'}</EmptyIcon>
          <EmptyTitle>No recipes yet</EmptyTitle>
          <p>Add your first recipe to get started.</p>
        </EmptyState>
      ) : filteredRecipes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>{'\uD83D\uDD0D'}</EmptyIcon>
          <EmptyTitle>No matches</EmptyTitle>
          <p>Try a different search or clear your filters.</p>
        </EmptyState>
      ) : (
        <Grid>
          {filteredRecipes.map(recipe => {
            const time = totalTime(recipe)
            return (
              <Card key={recipe.id} href={`/recipes/${recipe.id}`}>
                <CardName>{recipe.name}</CardName>
                {recipe.description && <CardDescription>{recipe.description}</CardDescription>}
                <Meta>
                  {time && <span>{'\u23F1 '}{time}</span>}
                  {recipe.servings && <span>{'\uD83D\uDC65 '}{recipe.servings}</span>}
                </Meta>
                {recipe.tags && recipe.tags.length > 0 && (
                  <TagRow>
                    {recipe.tags.slice(0, 3).map(tag => <Tag key={tag}>{tag}</Tag>)}
                  </TagRow>
                )}
              </Card>
            )
          })}
        </Grid>
      )}

      {modalOpen && (
        <Modal title={formInitial ? 'Review & save recipe' : 'New recipe'} onClose={closeForm}>
          <RecipeForm
            initial={formInitial}
            onSubmit={handleCreate}
            onCancel={closeForm}
            isPending={isPending}
            submitLabel="Create recipe"
          />
        </Modal>
      )}

      {promptOpen && (
        <Modal title="Generate a recipe with AI" onClose={() => setPromptOpen(false)}>
          <PromptHint>
            Describe what you want — ingredients, cuisine, dietary needs, servings, etc.
          </PromptHint>
          <PromptTextarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="e.g. A quick weeknight dinner using chicken, rice, and broccoli for 4 people"
            maxLength={500}
            disabled={isGenerating}
            autoFocus
          />
          {promptError && <PromptError role="alert">{promptError}</PromptError>}
          <PromptActions>
            <PromptSecondary onClick={() => setPromptOpen(false)} disabled={isGenerating}>
              Cancel
            </PromptSecondary>
            <PromptPrimary onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating\u2026' : 'Generate'}
            </PromptPrimary>
          </PromptActions>
        </Modal>
      )}

      {scanOpen && (
        <Modal title="Scan a recipe" onClose={closeScan}>
          <PromptHint>
            Take photos of a recipe — from a cookbook, handwritten card, or screen. Add up to 6 images.
          </PromptHint>
          {scanFiles.length === 0 ? (
            <ScanDropZone>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleScanFiles}
                style={{ display: 'none' }}
              />
              <ScanDropIcon>{'\uD83D\uDCF7'}</ScanDropIcon>
              <ScanDropText>Tap to take a photo or choose from gallery</ScanDropText>
              <ScanDropHint>JPEG, PNG, WebP, HEIC</ScanDropHint>
            </ScanDropZone>
          ) : (
            <ScanPreviewGrid>
              {scanPreviews.map((url, i) => (
                <ScanPreviewItem key={i}>
                  <ScanPreviewImg src={url} alt={`Recipe photo ${i + 1}`} />
                  <ScanRemoveBtn
                    type="button"
                    onClick={() => removeScanFile(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    disabled={isScanning}
                  >
                    {'\u2715'}
                  </ScanRemoveBtn>
                </ScanPreviewItem>
              ))}
              {scanFiles.length < 6 && (
                <ScanAddMore>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleScanFiles}
                    style={{ display: 'none' }}
                  />
                  +
                </ScanAddMore>
              )}
            </ScanPreviewGrid>
          )}
          {scanError && <PromptError role="alert">{scanError}</PromptError>}
          <PromptActions>
            <PromptSecondary onClick={closeScan} disabled={isScanning}>
              Cancel
            </PromptSecondary>
            <PromptPrimary onClick={handleScan} disabled={isScanning || scanFiles.length === 0}>
              {isScanning ? 'Scanning\u2026' : `Scan ${scanFiles.length > 0 ? `(${scanFiles.length} photo${scanFiles.length !== 1 ? 's' : ''})` : ''}`}
            </PromptPrimary>
          </PromptActions>
        </Modal>
      )}

      {urlOpen && (
        <Modal title="Import recipe from URL" onClose={() => setUrlOpen(false)}>
          <PromptHint>
            Paste a link to a recipe page and Koda will extract it for you.
          </PromptHint>
          <SearchInput
            type="url"
            value={urlText}
            onChange={e => setUrlText(e.target.value)}
            placeholder="https://example.com/my-favorite-recipe"
            disabled={isImporting}
            autoFocus
            style={{ maxWidth: '100%' }}
          />
          {urlError && <PromptError role="alert">{urlError}</PromptError>}
          <PromptActions>
            <PromptSecondary onClick={() => setUrlOpen(false)} disabled={isImporting}>
              Cancel
            </PromptSecondary>
            <PromptPrimary onClick={handleImportUrl} disabled={isImporting || !urlText.trim()}>
              {isImporting ? 'Importing\u2026' : 'Import'}
            </PromptPrimary>
          </PromptActions>
        </Modal>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
