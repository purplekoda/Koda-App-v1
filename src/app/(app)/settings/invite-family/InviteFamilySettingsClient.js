'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import InviteFamilyStep from '@/components/onboarding/steps/InviteFamilyStep'
import { createInviteAction } from '@/app/(onboarding)/onboarding/actions'
import { PERMISSION_GROUPS } from '@/data/onboarding-options'

export default function InviteFamilySettingsClient({ members }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [invite, setInvite] = useState(null)

  const defaultPerms = {}
  PERMISSION_GROUPS.forEach(g =>
    g.permissions.forEach(p => { defaultPerms[p.key] = p.defaultValue })
  )
  const [permissions, setPermissions] = useState(defaultPerms)

  function handleCreateInvite() {
    startTransition(async () => {
      const result = await createInviteAction()
      if (result.success) setInvite(result.data)
      else setError(result.error)
    })
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
