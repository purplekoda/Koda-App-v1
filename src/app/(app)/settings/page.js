import { requireUser } from '@/lib/dal/require-user'
import { getProfile, getGroceryPreferences, getRecipeCardSettings } from '@/lib/dal/profile'
import { getCookingPreferences, getDietaryRestrictions } from '@/lib/dal/cooking-preferences'
import { getTasteProfile } from '@/lib/dal/taste-profile'
import { getHouseholdFaithPractices } from '@/lib/dal/faith-practices'
import { getOnboardingProfile, getHouseholdMembers } from '@/lib/dal/onboarding'
import { getVoiceSettings } from '@/lib/dal/voice-settings'
import SettingsPageClient from './SettingsPageClient'

export default async function SettingsPage() {
  const user = await requireUser()

  const [
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
  ] = await Promise.all([
    getProfile(user.id).catch(() => ({})),
    getOnboardingProfile(user.id).catch(() => ({})),
    getHouseholdMembers(user.id).catch(() => []),
    getCookingPreferences(user.id).catch(() => null),
    getDietaryRestrictions(user.id).catch(() => []),
    getGroceryPreferences(user.id).catch(() => ({})),
    getTasteProfile(user.id).catch(() => null),
    getHouseholdFaithPractices(user.id).catch(() => ({ follows_faith_based_diet: false })),
    getRecipeCardSettings(user.id).catch(() => null),
    getVoiceSettings(user.id).catch(() => ({ voice_responses_enabled: false })),
  ])

  return (
    <SettingsPageClient
      user={{
        email: user.email,
        id: user.id,
        displayName: user.user_metadata?.display_name || profile?.display_name || '',
      }}
      profile={profile}
      onboardingProfile={onboardingProfile}
      householdMembers={householdMembers}
      cookingPreferences={cookingPreferences}
      dietaryRestrictions={dietaryRestrictions}
      groceryPreferences={groceryPreferences}
      tasteProfile={tasteProfile}
      faithPractices={faithPractices}
      recipeCardSettings={recipeCardSettings}
      voiceSettings={voiceSettings}
    />
  )
}
