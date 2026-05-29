'use client'

import { startTransition, useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { migrateRecipePhotosAction } from './actions'
import {
  COOK_TIME_OPTIONS,
  DAY_OPTIONS,
  ADVENTUROUSNESS_OPTIONS,
  MEAL_PREP_STYLE_OPTIONS,
  FRUSTRATION_OPTIONS,
  SHOPPING_STYLE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
} from '@/data/onboarding-options'

// ── Layout ─────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

// ── Section ────────────────────────────────────────────

const SectionBlock = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SectionLabel = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.xs};
`

const CardGroup = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  overflow: hidden;
`

// ── Card ───────────────────────────────────────────────

const CardLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 60px;
  text-decoration: none;
  transition: background 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const CardButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 60px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.12s ease;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const CardIcon = styled.span`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $bg }) => $bg || '#F3F4F6'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
`

const CardSummary = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $empty, theme }) => $empty ? theme.colors.textMuted : theme.colors.textSecondary};
  font-style: ${({ $empty }) => $empty ? 'italic' : 'normal'};
  line-height: 1.4;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Chevron = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
`

const MigrateRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 60px;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const MigrateBtn = styled.button`
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const MigrateStatus = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $ok, theme }) => $ok ? theme.colors.success || '#16a34a' : theme.colors.error || '#dc2626'};
  margin-top: 2px;
`

// ── Helpers ────────────────────────────────────────────

function summarizeArray(arr, max = 2) {
  if (!arr || arr.length === 0) return null
  const shown = arr.slice(0, max).join(', ')
  const extra = arr.length - max
  return extra > 0 ? `${shown} +${extra} more` : shown
}

function labelFor(value, options) {
  const opt = options.find(o => o.value === value)
  return opt ? opt.label.replace(/^[^\w]*/, '').trim() : value
}

// ── Component ──────────────────────────────────────────

export default function SettingsPageClient({
  user,
  profile,
  onboardingProfile,
  householdMembers,
  cookingPreferences,
  dietaryRestrictions,
  groceryPreferences,
  tasteProfile,
  faithPractices,
  recipeCardSettings,
  voiceSettings,
}) {
  const op = onboardingProfile || {}

  // ── Summary line generators ────────────────────────

  const membersSummary = (() => {
    if (!householdMembers || householdMembers.length === 0) return null
    const picky = householdMembers.find(m => m.is_picky_eater)
    const base = `${householdMembers.length} member${householdMembers.length !== 1 ? 's' : ''}`
    return picky ? `${base} · ${picky.name} is a picky eater` : base
  })()

  const faithSummary = (() => {
    if (!faithPractices?.follows_faith_based_diet) return null
    const practices = faithPractices.practices || []
    return summarizeArray(practices) || 'Faith-based diet active'
  })()

  const memberCount = householdMembers?.length || 0
  const inviteSummary = `${memberCount} member${memberCount !== 1 ? 's' : ''} in your household`

  const cookTimeSummary = op.cook_time_preference
    ? labelFor(op.cook_time_preference, COOK_TIME_OPTIONS)
    : null

  const mealPlanDaysSummary = (() => {
    const days = op.meal_plan_days
    if (!days || days.length === 0) return null
    return days.map(d => {
      const opt = DAY_OPTIONS.find(o => o.value === d)
      return opt ? opt.label : ''
    }).filter(Boolean).join(', ')
  })()

  const dietarySummary = summarizeArray(
    (dietaryRestrictions || []).map(r =>
      r.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    )
  )

  const cuisineSummary = summarizeArray(tasteProfile?.cuisine_types)

  const dislikedIngredientsSummary = (() => {
    const list = tasteProfile?.disliked_ingredients || []
    if (list.length === 0) return null
    return `${list.length} ingredient${list.length !== 1 ? 's' : ''}`
  })()

  const adventureSummary = op.adventurousness
    ? labelFor(op.adventurousness, ADVENTUROUSNESS_OPTIONS)
    : null

  const mealPrepSummary = op.meal_prep_style
    ? labelFor(op.meal_prep_style, MEAL_PREP_STYLE_OPTIONS)
    : null

  const frustrationSummary = summarizeArray(
    (op.cooking_frustrations || []).map(f => labelFor(f, FRUSTRATION_OPTIONS))
  )

  const budgetSummary = (() => {
    const budget = cookingPreferences?.weekly_budget || op.cooking_preferences?.weekly_budget
    const style = op.shopping_style
    const parts = []
    if (budget) parts.push(`$${budget} per week`)
    if (style) parts.push(labelFor(style, SHOPPING_STYLE_OPTIONS))
    return parts.length > 0 ? parts.join(' · ') : null
  })()

  const storesList = op.preferred_stores || groceryPreferences?.stores || []
  const storeSummary = summarizeArray(storesList)

  const healthSummary = (() => {
    const goals = op.health_goals || []
    if (goals.length === 0) return null
    const labels = goals.slice(0, 2).map(g => labelFor(g, HEALTH_GOAL_OPTIONS))
    let text = labels.join(', ')
    if (goals.length > 2) text += ` +${goals.length - 2} more`
    if (op.track_macros) text += ' · Tracking macros'
    return text
  })()

  const recipeCardSummary = (() => {
    if (!recipeCardSettings) return null
    const layout = recipeCardSettings.card_layout === 'list' ? 'List' : 'Grid'
    const photos = recipeCardSettings.show_photo ? 'Photos on' : 'Photos off'
    const macros = recipeCardSettings.show_macros ? 'Macros on' : 'Macros off'
    return `${layout} · ${photos} · ${macros}`
  })()

  const voiceSummary = voiceSettings?.voice_responses_enabled
    ? 'Voice responses on'
    : 'Voice responses off'

  const profileSummary = [profile?.display_name, user.email].filter(Boolean).join(' · ')

  function handleSignOut() {
    if (!window.confirm('Sign out of your account?')) return
    startTransition(() => { logout() })
  }

  const [migrateStatus, setMigrateStatus] = useState(null)
  const [migrating, setMigrating] = useState(false)

  async function handleMigratePhotos() {
    if (!window.confirm('Download all external recipe photos into your private storage? This may take a minute.')) return
    setMigrating(true)
    setMigrateStatus(null)
    try {
      const result = await migrateRecipePhotosAction()
      if (result.success) {
        const { migrated, failed, skipped } = result.data
        setMigrateStatus({ ok: true, message: `Done: ${migrated} migrated, ${failed} failed, ${skipped} skipped.` })
      } else {
        setMigrateStatus({ ok: false, message: result.error || 'Migration failed.' })
      }
    } catch {
      setMigrateStatus({ ok: false, message: 'Migration failed.' })
    } finally {
      setMigrating(false)
    }
  }

  // ── Render ─────────────────────────────────────────

  return (
    <PageWrapper>
      <PageTitle>Settings</PageTitle>

      {/* ── Household ── */}
      <SectionBlock>
        <SectionLabel>Household</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/household-members" icon="&#x1F464;" bg="#E1F5EE" title="Household members" summary={membersSummary} />
          <SettingsCard href="/settings/faith-practices" icon="&#x1F54A;&#xFE0F;" bg="#EDE9FE" title="Faith-based and cultural practices" summary={faithSummary} />
          <SettingsCard href="/settings/invite-family" icon="&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;" bg="#E1F5EE" title="Invite family" summary={inviteSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── My Schedule ── */}
      <SectionBlock>
        <SectionLabel>My Schedule</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/cook-time" icon="&#x23F1;&#xFE0F;" bg="#FEF3C7" title="Weeknight cooking time" summary={cookTimeSummary} />
          <SettingsCard href="/settings/meal-plan-days" icon="&#x1F4C5;" bg="#DBEAFE" title="Meal planning days" summary={mealPlanDaysSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── Food Preferences ── */}
      <SectionBlock>
        <SectionLabel>Food Preferences</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/dietary-restrictions" icon="&#x1F957;" bg="#E1F5EE" title="Dietary restrictions" summary={dietarySummary} />
          <SettingsCard href="/settings/cuisines" icon="&#x1F30D;" bg="#DBEAFE" title="Favorite cuisines" summary={cuisineSummary} />
          <SettingsCard href="/settings/disliked-ingredients" icon="&#x1F6AB;" bg="#FEE2E2" title="Ingredients I don't like" summary={dislikedIngredientsSummary} />
          <SettingsCard href="/settings/recipe-style" icon="&#x1F680;" bg="#EDE9FE" title="Recipe style" summary={adventureSummary} />
          <SettingsCard href="/settings/meal-prep-style" icon="&#x1F4E6;" bg="#FEF3C7" title="Meal prep style" summary={mealPrepSummary} />
          <SettingsCard href="/settings/frustrations" icon="&#x1F3AF;" bg="#FEE2E2" title="Biggest frustrations" summary={frustrationSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── Budget & Shopping ── */}
      <SectionBlock>
        <SectionLabel>Budget & Shopping</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/budget" icon="&#x1F4B0;" bg="#FEF3C7" title="Weekly grocery budget" summary={budgetSummary} />
          <SettingsCard href="/settings/favorite-stores" icon="&#x1F6D2;" bg="#E1F5EE" title="Favorite grocery stores" summary={storeSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── Health & Nutrition ── */}
      <SectionBlock>
        <SectionLabel>Health & Nutrition</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/health-goals" icon="&#x1F4AA;" bg="#EDE9FE" title="Health goals and macros" summary={healthSummary} />
          <SettingsCard href="/settings/macro-logging" icon="&#x1F4F7;" bg="#E1F5EE" title="Photo macro logging" summary="Per-member photo logging controls" />
          <SettingsCard href="/settings/macro-targets" icon="&#x1F3AF;" bg="#E1F5EE" title="Macro targets" summary="Daily calorie and macro goals per member" />
        </CardGroup>
      </SectionBlock>

      {/* ── Recipes ── */}
      <SectionBlock>
        <SectionLabel>Recipes</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/recipe-card" icon="&#x1F0CF;" bg="#EDE9FE" title="Recipe card display" summary={recipeCardSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── Koda Assistant ── */}
      <SectionBlock>
        <SectionLabel>Koda Assistant</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/voice" icon="&#x1F3A4;" bg="#EEEDFE" title="Voice" summary={voiceSummary} />
        </CardGroup>
      </SectionBlock>

      {/* ── Account ── */}
      <SectionBlock>
        <SectionLabel>Account</SectionLabel>
        <CardGroup>
          <SettingsCard href="/settings/profile" icon="&#x1F464;" bg="#E1F5EE" title="Profile" summary={profileSummary} />
          <SettingsCard href="/settings/notifications" icon="&#x1F514;" bg="#DBEAFE" title="Notifications" summary="Manage notification preferences" />
          <CardButton type="button" onClick={handleSignOut}>
            <CardIcon $bg="#FEE2E2">&#x1F6AA;</CardIcon>
            <CardBody>
              <CardTitle style={{ color: '#D85A30' }}>Sign out</CardTitle>
              <CardSummary>Sign out of your account</CardSummary>
            </CardBody>
          </CardButton>
        </CardGroup>
      </SectionBlock>

      {/* ── Developer ── */}
      <SectionBlock>
        <SectionLabel>Developer</SectionLabel>
        <CardGroup>
          <MigrateRow>
            <CardIcon $bg="#F3F4F6">&#x1F5BC;&#xFE0F;</CardIcon>
            <CardBody>
              <CardTitle>Migrate recipe photos to secure storage</CardTitle>
              <CardSummary>Downloads external recipe photos into your private storage so they never break.</CardSummary>
              {migrateStatus && (
                <MigrateStatus $ok={migrateStatus.ok}>{migrateStatus.message}</MigrateStatus>
              )}
            </CardBody>
            <MigrateBtn type="button" onClick={handleMigratePhotos} disabled={migrating}>
              {migrating ? 'Running…' : 'Run'}
            </MigrateBtn>
          </MigrateRow>
        </CardGroup>
      </SectionBlock>
    </PageWrapper>
  )
}

// ── Reusable card ──────────────────────────────────────

function SettingsCard({ href, icon, bg, title, summary }) {
  const empty = !summary
  return (
    <CardLink href={href}>
      <CardIcon $bg={bg}>{icon}</CardIcon>
      <CardBody>
        <CardTitle>{title}</CardTitle>
        <CardSummary $empty={empty}>{empty ? 'Not set' : summary}</CardSummary>
      </CardBody>
      <Chevron>&rsaquo;</Chevron>
    </CardLink>
  )
}
