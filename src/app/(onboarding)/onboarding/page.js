import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingProfile, getHouseholdMembers } from '@/lib/dal/onboarding'
import { getDietaryRestrictions } from '@/lib/dal/cooking-preferences'
import { getTasteProfile } from '@/lib/dal/taste-profile'
import OnboardingPageClient from './OnboardingPageClient'

export default async function OnboardingPage() {
  const user = await requireUser()

  const [profile, householdMembers, dietaryRestrictions, tasteProfile] =
    await Promise.all([
      getOnboardingProfile(user.id).catch(() => ({})),
      getHouseholdMembers(user.id).catch(() => []),
      getDietaryRestrictions(user.id).catch(() => []),
      getTasteProfile(user.id).catch(() => null),
    ])

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || ''
  const firstName = displayName.split(' ')[0]

  return (
    <OnboardingPageClient
      initialData={{
        ...profile,
        householdMembers,
        dietaryRestrictions,
        cuisines: tasteProfile?.cuisine_types || [],
        userName: firstName,
        onboarding_conversation_history: profile.onboarding_conversation_history || [],
      }}
    />
  )
}
