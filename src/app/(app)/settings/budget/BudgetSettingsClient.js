'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import BudgetStep from '@/components/onboarding/steps/BudgetStep'
import { saveBudgetSettingsAction } from '../step-actions'

export default function BudgetSettingsClient({
  budget: initBudget,
  monthlyBudget: initMonthlyBudget,
  splitMonthly: initSplitMonthly,
  priorities: initPriorities,
  shoppingStyle: initStyle,
  deliveryService: initService,
}) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [budget, setBudget] = useState(initBudget)
  const [monthlyBudget, setMonthlyBudget] = useState(initMonthlyBudget)
  const [splitMonthly, setSplitMonthly] = useState(initSplitMonthly)
  const [priorities, setPriorities] = useState(initPriorities)
  const [shoppingStyle, setShoppingStyle] = useState(initStyle)
  const [deliveryService, setDeliveryService] = useState(initService)

  function handleSave() {
    save(() => saveBudgetSettingsAction({
      weekly_budget: budget,
      monthly_budget: monthlyBudget || undefined,
      split_monthly_to_weekly: splitMonthly,
      budget_priorities: priorities,
      shopping_style: shoppingStyle,
      preferred_delivery_service: shoppingStyle === 'delivery_preferred' ? deliveryService : undefined,
    }))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <BudgetStep
        budget={budget}
        monthlyBudget={monthlyBudget}
        splitMonthly={splitMonthly}
        priorities={priorities}
        shoppingStyle={shoppingStyle}
        deliveryService={deliveryService}
        onChangeBudget={setBudget}
        onChangeMonthlyBudget={setMonthlyBudget}
        onChangeSplitMonthly={setSplitMonthly}
        onChangePriorities={setPriorities}
        onChangeShoppingStyle={setShoppingStyle}
        onChangeDeliveryService={setDeliveryService}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
