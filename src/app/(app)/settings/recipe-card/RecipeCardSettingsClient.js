'use client'

import { useState, useTransition, startTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styled from 'styled-components'
import { saveRecipeCardSettingsAction, resetRecipeCardSettingsAction } from '../actions'

// ── Defaults ──────────────────────────────────────────

const DEFAULTS = {
  show_photo: true,
  show_description: true,
  show_cook_time: true,
  show_servings: true,
  show_categories: true,
  show_macros: false,
  show_rating: true,
  show_review_count: false,
  show_difficulty: false,
  show_source: false,
  show_calories: true,
  show_protein: true,
  show_carbs: true,
  show_fat: true,
  card_layout: 'grid',
  photo_position: 'right',
}

// ── Sample recipe for preview ─────────────────────────

const PREVIEW_RECIPE = {
  name: 'Quick Ground Beef Tacos',
  description: 'Seasoned beef in warm tortillas with fresh toppings.',
  prep_time_minutes: 5,
  cook_time_minutes: 15,
  servings: 4,
  tags: ['dinner', 'mexican', 'quick'],
  source: 'family recipe',
  image_url: null,
  nutrition: { calories: 420, protein_g: 28, carbs_g: 32, fat_g: 18 },
  nutrition_is_estimated: true,
  rating: 4.5,
  review_count: 12,
  difficulty: 'easy',
}

// ── Styled components ─────────────────────────────────

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  line-height: 1.4;
`

// ── Layout options ────────────────────────────────────

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`

const LayoutOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.tealLight : theme.colors.surface};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const LayoutPreview = styled.div`
  width: 80px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  gap: 4px;
  padding: 6px;
  align-items: flex-start;
`

const GridPreviewCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const GridPreviewCard = styled.div`
  height: 18px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.border};
`

const ListPreviewCard = styled.div`
  height: 12px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.border};
  width: 100%;
`

const LayoutLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.textSecondary};
`

// ── Toggle rows ───────────────────────────────────────

const ToggleRow = styled.label`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  cursor: pointer;

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const ToggleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ToggleDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.3;
`

const Switch = styled.div`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;
  margin-top: 2px;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '20px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: left 0.15s ease;
  }
`

const SubToggles = styled.div`
  padding-left: ${({ theme }) => theme.spacing.xl};
  border-left: 2px solid ${({ theme }) => theme.colors.borderLight};
  margin-left: ${({ theme }) => theme.spacing.sm};
`

// ── Photo position chips ──────────────────────────────

const ChipRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-left: 0;
`

const Chip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.tealLight : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.textSecondary};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }
`

// ── Preview card ──────────────────────────────────────

const PreviewLabel = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`

const PreviewCard = styled.div`
  display: flex;
  flex-direction: ${({ $photoTop }) => ($photoTop ? 'column' : 'row')};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.card};
`

const PreviewPhoto = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 28px;

  ${({ $position }) =>
    $position === 'top'
      ? 'width: 100%; height: 100px;'
      : 'width: 100px; align-self: stretch; flex-shrink: 0;'}
`

const PreviewBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.xs};
`

const PreviewName = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const PreviewDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`

const PreviewMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PreviewTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`

const PreviewTag = styled.span`
  padding: 3px 10px;
  font-size: 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const PreviewRating = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.amber};
`

const PreviewDifficulty = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
  font-weight: 500;
  text-transform: capitalize;
`

const PreviewSource = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const MacroRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-top: 2px;
`

const MacroItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MacroDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const EstBadge = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

// ── Reset button ──────────────────────────────────────

const ResetButton = styled.button`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: underline;
  }
`

const StatusText = styled.span`
  font-size: 12px;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.error : theme.colors.success};
  text-align: center;
  display: block;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

// ── Macro colors ──────────────────────────────────────

const MACRO_COLORS = {
  calories: '#EF9F27',
  protein: '#1D9E75',
  carbs: '#185FA5',
  fat: '#D85A30',
}

// ── Component ─────────────────────────────────────────

export default function RecipeCardSettingsClient({ initialSettings }) {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = from === 'recipes' ? '/recipes' : '/settings'
  const backLabel = from === 'recipes' ? 'Recipes' : 'Settings'

  const merged = { ...DEFAULTS, ...initialSettings }
  const [settings, setSettings] = useState(merged)
  const [status, setStatus] = useState(null)
  const [isPending, startSaveTransition] = useTransition()

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    save(next)
  }

  function set(key, value) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    save(next)
  }

  function save(data) {
    setStatus(null)
    startSaveTransition(async () => {
      const result = await saveRecipeCardSettingsAction(data)
      if (!result.success) {
        setStatus({ ok: false, msg: result.error })
      }
    })
  }

  function handleReset() {
    if (!confirm('Reset all recipe card settings to their defaults? This cannot be undone.')) return
    setStatus(null)
    startTransition(async () => {
      const result = await resetRecipeCardSettingsAction()
      if (result.success) {
        setSettings({ ...DEFAULTS })
        setStatus({ ok: true, msg: 'Reset to defaults' })
      } else {
        setStatus({ ok: false, msg: result.error })
      }
    })
  }

  const totalTime = PREVIEW_RECIPE.prep_time_minutes + PREVIEW_RECIPE.cook_time_minutes
  const n = PREVIEW_RECIPE.nutrition

  return (
    <PageWrapper>
      <BackLink href={backHref}>{'\u2190'} {backLabel}</BackLink>
      <PageTitle>Recipe card display</PageTitle>

      {/* ── Live preview ── */}
      <Section>
        <PreviewLabel>Preview</PreviewLabel>
        <PreviewCard $photoTop={settings.show_photo && settings.photo_position === 'top'}>
          {settings.show_photo && settings.photo_position === 'top' && (
            <PreviewPhoto $position="top">{'\uD83C\uDF2E'}</PreviewPhoto>
          )}
          <PreviewBody>
            <PreviewName>{PREVIEW_RECIPE.name}</PreviewName>
            {settings.show_description && (
              <PreviewDesc>{PREVIEW_RECIPE.description}</PreviewDesc>
            )}
            <PreviewMeta>
              {settings.show_cook_time && <span>{'\u23F1'} {totalTime} min</span>}
              {settings.show_servings && <span>{'\uD83D\uDC65'} {PREVIEW_RECIPE.servings}</span>}
              {settings.show_rating && (
                <PreviewRating>{'\u2605'} {PREVIEW_RECIPE.rating}</PreviewRating>
              )}
              {settings.show_review_count && (
                <span>{PREVIEW_RECIPE.review_count} reviews</span>
              )}
            </PreviewMeta>
            {settings.show_difficulty && (
              <div><PreviewDifficulty>{PREVIEW_RECIPE.difficulty}</PreviewDifficulty></div>
            )}
            {settings.show_categories && PREVIEW_RECIPE.tags.length > 0 && (
              <PreviewTags>
                {PREVIEW_RECIPE.tags.map(tag => <PreviewTag key={tag}>{tag}</PreviewTag>)}
              </PreviewTags>
            )}
            {settings.show_source && PREVIEW_RECIPE.source && (
              <PreviewSource>Source: {PREVIEW_RECIPE.source}</PreviewSource>
            )}
            {settings.show_macros && (
              <MacroRow>
                {settings.show_calories && (
                  <MacroItem>
                    <MacroDot $color={MACRO_COLORS.calories} />
                    {n.calories} cal
                  </MacroItem>
                )}
                {settings.show_protein && (
                  <MacroItem>
                    <MacroDot $color={MACRO_COLORS.protein} />
                    {n.protein_g}g Protein
                  </MacroItem>
                )}
                {settings.show_carbs && (
                  <MacroItem>
                    <MacroDot $color={MACRO_COLORS.carbs} />
                    {n.carbs_g}g Carbs
                  </MacroItem>
                )}
                {settings.show_fat && (
                  <MacroItem>
                    <MacroDot $color={MACRO_COLORS.fat} />
                    {n.fat_g}g Fat
                  </MacroItem>
                )}
                {PREVIEW_RECIPE.nutrition_is_estimated && <EstBadge>Est.</EstBadge>}
              </MacroRow>
            )}
          </PreviewBody>
          {settings.show_photo && settings.photo_position === 'right' && (
            <PreviewPhoto $position="right">{'\uD83C\uDF2E'}</PreviewPhoto>
          )}
        </PreviewCard>
      </Section>

      {/* ── Card layout ── */}
      <Section>
        <SectionTitle>Card layout</SectionTitle>
        <LayoutGrid>
          <LayoutOption
            type="button"
            $active={settings.card_layout === 'grid'}
            onClick={() => set('card_layout', 'grid')}
          >
            <LayoutPreview>
              <GridPreviewCol>
                <GridPreviewCard />
                <GridPreviewCard />
              </GridPreviewCol>
              <GridPreviewCol>
                <GridPreviewCard />
                <GridPreviewCard />
              </GridPreviewCol>
            </LayoutPreview>
            <LayoutLabel $active={settings.card_layout === 'grid'}>Grid</LayoutLabel>
          </LayoutOption>
          <LayoutOption
            type="button"
            $active={settings.card_layout === 'list'}
            onClick={() => set('card_layout', 'list')}
          >
            <LayoutPreview style={{ flexDirection: 'column' }}>
              <ListPreviewCard />
              <ListPreviewCard />
              <ListPreviewCard />
            </LayoutPreview>
            <LayoutLabel $active={settings.card_layout === 'list'}>List</LayoutLabel>
          </LayoutOption>
        </LayoutGrid>
      </Section>

      {/* ── Photo settings ── */}
      <Section>
        <SectionTitle>Recipe photo</SectionTitle>
        <ToggleRow onClick={() => toggle('show_photo')}>
          <ToggleInfo>
            <ToggleLabel>Show photo</ToggleLabel>
          </ToggleInfo>
          <Switch $on={settings.show_photo} />
        </ToggleRow>
        {settings.show_photo && (
          <div style={{ paddingTop: 8 }}>
            <ToggleLabel style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Photo position</ToggleLabel>
            <ChipRow>
              <Chip
                type="button"
                $active={settings.photo_position === 'right'}
                onClick={() => set('photo_position', 'right')}
              >
                Right
              </Chip>
              <Chip
                type="button"
                $active={settings.photo_position === 'top'}
                onClick={() => set('photo_position', 'top')}
              >
                Top
              </Chip>
            </ChipRow>
          </div>
        )}
      </Section>

      {/* ── Recipe details ── */}
      <Section>
        <SectionTitle>What to show on each card</SectionTitle>
        <ToggleRow onClick={() => toggle('show_description')}>
          <ToggleInfo>
            <ToggleLabel>Show description</ToggleLabel>
            <ToggleDesc>The short recipe summary below the title.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_description} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_cook_time')}>
          <ToggleInfo>
            <ToggleLabel>Show cook time</ToggleLabel>
            <ToggleDesc>How long the recipe takes to prepare.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_cook_time} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_servings')}>
          <ToggleInfo>
            <ToggleLabel>Show servings</ToggleLabel>
            <ToggleDesc>How many people the recipe serves.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_servings} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_categories')}>
          <ToggleInfo>
            <ToggleLabel>Show categories and tags</ToggleLabel>
            <ToggleDesc>Tags like Chicken, Salad, Italian, Vegetarian.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_categories} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_rating')}>
          <ToggleInfo>
            <ToggleLabel>Show star rating</ToggleLabel>
            <ToggleDesc>The recipe's average rating out of 5.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_rating} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_review_count')}>
          <ToggleInfo>
            <ToggleLabel>Show review count</ToggleLabel>
            <ToggleDesc>How many reviews the recipe has.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_review_count} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_difficulty')}>
          <ToggleInfo>
            <ToggleLabel>Show difficulty</ToggleLabel>
            <ToggleDesc>Easy, medium, or hard difficulty badge.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_difficulty} />
        </ToggleRow>
        <ToggleRow onClick={() => toggle('show_source')}>
          <ToggleInfo>
            <ToggleLabel>Show source</ToggleLabel>
            <ToggleDesc>Where the recipe was imported from.</ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.show_source} />
        </ToggleRow>
      </Section>

      {/* ── Macros ── */}
      <Section>
        <SectionTitle>Nutrition and macros</SectionTitle>
        <ToggleRow onClick={() => toggle('show_macros')}>
          <ToggleInfo>
            <ToggleLabel>Show macros on card</ToggleLabel>
          </ToggleInfo>
          <Switch $on={settings.show_macros} />
        </ToggleRow>
        {settings.show_macros && (
          <SubToggles>
            <ToggleRow onClick={() => toggle('show_calories')}>
              <ToggleInfo><ToggleLabel>Show calories</ToggleLabel></ToggleInfo>
              <Switch $on={settings.show_calories} />
            </ToggleRow>
            <ToggleRow onClick={() => toggle('show_protein')}>
              <ToggleInfo><ToggleLabel>Show protein</ToggleLabel></ToggleInfo>
              <Switch $on={settings.show_protein} />
            </ToggleRow>
            <ToggleRow onClick={() => toggle('show_carbs')}>
              <ToggleInfo><ToggleLabel>Show carbs</ToggleLabel></ToggleInfo>
              <Switch $on={settings.show_carbs} />
            </ToggleRow>
            <ToggleRow onClick={() => toggle('show_fat')}>
              <ToggleInfo><ToggleLabel>Show fat</ToggleLabel></ToggleInfo>
              <Switch $on={settings.show_fat} />
            </ToggleRow>
          </SubToggles>
        )}
        <SectionNote>
          Macro data must be available for the recipe. Recipes without nutrition data will show an estimate badge.
        </SectionNote>
      </Section>

      {/* ── Reset ── */}
      <ResetButton type="button" onClick={handleReset}>
        Reset to defaults
      </ResetButton>

      {status && (
        <StatusText $error={!status.ok}>{status.msg}</StatusText>
      )}
    </PageWrapper>
  )
}
