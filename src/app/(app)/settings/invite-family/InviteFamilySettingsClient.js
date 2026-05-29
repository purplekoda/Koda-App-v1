'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import InviteFamilyStep from '@/components/onboarding/steps/InviteFamilyStep'
import { createInviteAction } from '@/app/(onboarding)/onboarding/actions'
import { PERMISSION_GROUPS } from '@/data/onboarding-options'

export default function InviteFamilySettingsClient({ members }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const [invite, setInvite] = useState(null)

  const defaultPerms = {}
  PERMISSION_GROUPS.forEach(g =>
    g.permissions.forEach(p => { defaultPerms[p.key] = p.defaultValue })
  )
  const [permissions, setPermissions] = useState(defaultPerms)

  async function handleCreateInvite() {
    setIsPending(true)
    setError(null)
    try {
      const result = await createInviteAction()
      if (result.success) setInvite(result.data)
      else setError(result.error)
    } catch {
      setError('Could not create invite. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <SettingsStepLayout error={error}>
      <InviteFamilyStep
        members={members}
        invite={invite}
        permissions={permissions}
        onCreateInvite={handleCreateInvite}
        onChangePermissions={setPermissions}
        onNext={() => router.push('/settings')}
        onBack={() => router.push('/settings')}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
