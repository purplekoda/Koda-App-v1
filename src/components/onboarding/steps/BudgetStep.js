'use client'

import styled from 'styled-components'
import StepShell from '../shared/StepShell'
import ChipSelector from '../shared/ChipSelector'
import SingleSelectCards from '../shared/SingleSelectCards'
import { BUDGET_PRESETS, MONTHLY_BUDGET_PRESETS, BUDGET_PRIORITY_OPTIONS, SHOPPING_STYLE_OPTIONS, DELIVERY_SERVICE_OPTIONS } from '@/data/onboarding-options'

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const BudgetDisplay = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Dollar = styled.span`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AmountInput = styled.input`
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  border: none;
  background: none;
  width: 140px;
  text-align: center;
  outline: none;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 4px;

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.teal};
  }

  /* Hide number spinners */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

const PerWeek = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const PresetRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  flex-wrap: wrap;
`

const PresetBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '30' : theme.colors.surface};
  color: ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.textPrimary};
  font-size: 14px;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`

const Tip = styled.div`
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const MonthlyRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MonthlyInput = styled.input`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  border: none;
  background: none;
  width: 120px;
  text-align: center;
  outline: none;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 4px;

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.teal};
  }

  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

const PerMonth = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const SplitToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight + '18' : theme.colors.surface};
  transition: all 0.15s;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const SplitCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${({ theme }) => theme.colors.teal};
  flex-shrink: 0;
  cursor: pointer;
`

const SplitText = styled.div`
  flex: 1;
`

const SplitLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SplitHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
`

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SectionSubtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  line-height: 1.4;
`

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`

const DeliveryServiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.md};
`

const DeliveryChip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '30' : theme.colors.surface};
  color: ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.textSecondary};
  font-size: 13px;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`

function calcWeeklyFromMonthly(monthly) {
  return Math.round(monthly * 12 / 52)
}

export default function BudgetStep({ budget, monthlyBudget, splitMonthly, priorities, shoppingStyle, deliveryService, onChangeBudget, onChangeMonthlyBudget, onChangeSplitMonthly, onChangePriorities, onChangeShoppingStyle, onChangeDeliveryService, onNext, onBack, onSkip, isPending, voiceMode = false }) {
  function handleMonthlyChange(value) {
    onChangeMonthlyBudget(value)
    if (splitMonthly && value > 0) {
      onChangeBudget(calcWeeklyFromMonthly(value))
    }
  }

  function handleSplitToggle(checked) {
    onChangeSplitMonthly(checked)
    if (checked && monthlyBudget > 0) {
      onChangeBudget(calcWeeklyFromMonthly(monthlyBudget))
    }
  }

  const calculatedWeekly = monthlyBudget > 0 ? calcWeeklyFromMonthly(monthlyBudget) : null

  return (
    <StepShell
      title="What's your grocery budget?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      showSkip
      onSkip={onSkip}
      skipLabel="Skip -- I'll set this later"
      voiceMode={voiceMode}
    >
      <Section>
        <SectionLabel>Weekly budget</SectionLabel>
        <BudgetDisplay>
          <Dollar>$</Dollar>
          <AmountInput
            type="number"
            value={budget || ''}
            onChange={e => onChangeBudget(parseInt(e.target.value, 10) || 0)}
            min={0}
            max={5000}
            placeholder="150"
            readOnly={splitMonthly && monthlyBudget > 0}
          />
          <PerWeek>per week</PerWeek>
        </BudgetDisplay>

        <PresetRow>
          {BUDGET_PRESETS.map(amount => (
            <PresetBtn
              key={amount}
              type="button"
              $selected={budget === amount}
              onClick={() => !splitMonthly && onChangeBudget(amount)}
              style={{ opacity: splitMonthly && monthlyBudget > 0 ? 0.4 : 1 }}
            >
              ${amount}{amount === 300 ? '+' : ''}
            </PresetBtn>
          ))}
        </PresetRow>

        <Tip>You can change this anytime and override it each week.</Tip>
      </Section>

      <SectionDivider />

      <Section>
        <SectionLabel>Monthly budget <span style={{ fontWeight: 400, color: 'inherit', opacity: 0.6 }}>(optional)</span></SectionLabel>
        <SectionSubtitle>Set a monthly cap so Koda can help you stay on track for the whole month.</SectionSubtitle>

        <MonthlyRow>
          <Dollar>$</Dollar>
          <MonthlyInput
            type="number"
            value={monthlyBudget || ''}
            onChange={e => handleMonthlyChange(parseInt(e.target.value, 10) || 0)}
            min={0}
            max={20000}
            placeholder="500"
          />
          <PerMonth>per month</PerMonth>
        </MonthlyRow>

        <PresetRow>
          {MONTHLY_BUDGET_PRESETS.map(amount => (
            <PresetBtn
              key={amount}
              type="button"
              $selected={monthlyBudget === amount}
              onClick={() => handleMonthlyChange(amount)}
            >
              ${amount}{amount === 800 ? '+' : ''}
            </PresetBtn>
          ))}
        </PresetRow>

        {monthlyBudget > 0 && (
          <SplitToggleRow $active={splitMonthly} htmlFor="split-monthly">
            <SplitCheckbox
              id="split-monthly"
              type="checkbox"
              checked={!!splitMonthly}
              onChange={e => handleSplitToggle(e.target.checked)}
            />
            <SplitText>
              <SplitLabel>Calculate my weekly budget from monthly</SplitLabel>
              <SplitHint>
                {splitMonthly && calculatedWeekly
                  ? `Your weekly budget will be set to $${calculatedWeekly}/week`
                  : `Koda will divide your monthly total into ~$${calculatedWeekly}/week`}
              </SplitHint>
            </SplitText>
          </SplitToggleRow>
        )}
      </Section>

      <Section>
        <SectionLabel>What matters most when staying on budget?</SectionLabel>
        <ChipSelector
          options={BUDGET_PRIORITY_OPTIONS}
          selected={priorities}
          onChange={onChangePriorities}
        />
      </Section>

      <SectionDivider />

      <Section>
        <SectionLabel>How do you prefer to shop?</SectionLabel>
        <SectionSubtitle>This helps Koda organize your grocery lists the way that works best for you.</SectionSubtitle>
        <SingleSelectCards
          options={SHOPPING_STYLE_OPTIONS.map(o => ({
            value: o.value,
            label: `${o.icon} ${o.label}`,
            subtitle: o.subtitle,
          }))}
          selected={shoppingStyle}
          onChange={onChangeShoppingStyle}
        />
        {shoppingStyle === 'delivery_preferred' && (
          <DeliveryServiceRow>
            {DELIVERY_SERVICE_OPTIONS.map(svc => (
              <DeliveryChip
                key={svc.value}
                type="button"
                $selected={deliveryService === svc.value}
                onClick={() => onChangeDeliveryService(svc.value)}
              >
                {svc.label}
              </DeliveryChip>
            ))}
          </DeliveryServiceRow>
        )}
      </Section>
    </StepShell>
  )
}
