'use client';

import { useState, useTransition } from 'react';
import styled, { keyframes } from 'styled-components';
import { repeatMealAction, swapMeal, getWeekMealsAction } from '@/app/(app)/meals/actions';

const mealColors = {
  breakfast: { bg: 'amberLight', accent: 'amber', text: 'amberDark' },
  lunch: { bg: 'tealLight', accent: 'teal', text: 'tealDark' },
  dinner: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides2: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides3: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides4: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  breakfast_side: { bg: 'amberLight', accent: 'amber', text: 'amberDark' },
  lunch_side: { bg: 'tealLight', accent: 'teal', text: 'tealDark' },
  dinner_dessert: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
};

const slideDown = keyframes`
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch;
    return theme.colors[c.accent];
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing.xs};
  animation: ${slideDown} 0.2s ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`;

const MealName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const DayLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Description = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $variant, theme }) => {
    if ($variant === 'time') return theme.colors.borderLight;
    return theme.colors.borderLight;
  }};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const TagChip = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch;
    return theme.colors[c.bg];
  }};
  color: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch;
    return theme.colors[c.text];
  }};
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 6px;
`;

const IngredientList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IngredientItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};

  &::before {
    content: '·';
    color: ${({ theme }) => theme.colors.textMuted};
    flex-shrink: 0;
  }
`;

const Instructions = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

// ── Repeat sub-panel ──────────────────────────────────────────────────────────

const RepeatPanel = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RepeatTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RepeatTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const RepeatCancelLink = styled.button`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  padding: 0;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ModeToggleRow = styled.div`
  display: flex;
  gap: 4px;
`;

const ModeToggleButton = styled.button`
  flex: 1;
  padding: 5px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $active, theme }) => ($active ? theme.colors.surface : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.textPrimary : theme.colors.textMuted)};
  border: ${({ $active, theme }) => ($active ? `1px solid ${theme.colors.border}` : '1px solid transparent')};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.card : 'none')};
`;

const DaysRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const DayPill = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 500;
  cursor: ${({ $isSource }) => ($isSource ? 'default' : 'pointer')};
  transition: all 0.15s ease;
  opacity: ${({ $isSource }) => ($isSource ? 0.4 : 1)};

  background: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return theme.colors.borderLight;
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return theme.colors[c.bg];
    }
    return theme.colors.surface;
  }};
  color: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return theme.colors.textMuted;
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return theme.colors[c.text];
    }
    return theme.colors.textSecondary;
  }};
  border: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return `1px solid ${theme.colors.borderLight}`;
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return `1px solid ${theme.colors[c.accent]}`;
    }
    return `1px solid ${theme.colors.border}`;
  }};
`;

const NextXRow = styled.div`
  display: flex;
  gap: 4px;
`;

const NextXButton = styled.button`
  width: 36px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return theme.colors[c.bg];
    }
    return theme.colors.surface;
  }};
  color: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return theme.colors[c.text];
    }
    return theme.colors.textSecondary;
  }};
  border: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch;
      return `1px solid ${theme.colors[c.accent]}`;
    }
    return `1px solid ${theme.colors.border}`;
  }};
`;

const RepeatConfirmButton = styled.button`
  padding: 7px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: all 0.15s ease;
  width: 100%;
  min-height: 32px;

  background: ${({ $type, disabled, theme }) => {
    if (disabled) return theme.colors.borderLight;
    const c = mealColors[$type] || mealColors.lunch;
    return theme.colors[c.bg];
  }};
  color: ${({ $type, disabled, theme }) => {
    if (disabled) return theme.colors.textMuted;
    const c = mealColors[$type] || mealColors.lunch;
    return theme.colors[c.text];
  }};
  border: ${({ $type, disabled, theme }) => {
    if (disabled) return `0.5px solid ${theme.colors.border}`;
    const c = mealColors[$type] || mealColors.lunch;
    return `1px solid ${theme.colors[c.accent]}`;
  }};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

const SideOptionsRow = styled.div`
  display: flex;
  gap: 4px;
`;

const SideOptionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`;

const SideInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  min-height: 36px;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  background: ${({ $variant, theme }) => {
    if ($variant === 'danger') return theme.colors.coralLight;
    return theme.colors.borderLight;
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'danger') return theme.colors.coral;
    return theme.colors.textPrimary;
  }};
  border: ${({ $variant, theme }) => {
    if ($variant === 'danger') return 'none';
    return `0.5px solid ${theme.colors.border}`;
  }};

  &:hover {
    opacity: 0.9;
  }
`;

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function MealDetailInline({
  meal,
  onClose,
  onSwap,
  onAddToGrocery,
  onRemove,
  onRepeat,
  weekOffset = 0,
  onSidePickerOpen,
  onDessertPickerOpen,
  sideType: propSideType,
  dessertType,
}) {
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [repeatMode, setRepeatMode] = useState('pick'); // 'pick' | 'next'
  const [selectedDays, setSelectedDays] = useState([]);
  const [nextX, setNextX] = useState(null);
  const [isRepeating, startRepeatTransition] = useTransition();

  // 'side' | 'dessert' | null
  const [extraOpen, setExtraOpen] = useState(null);
  const [sideName, setSideName] = useState('');
  const [isSavingSide, startSideTransition] = useTransition();

  if (!meal) return null;

  const recipe = meal.recipe ?? null;
  const recipeIngredients = recipe?.ingredients ?? [];
  const tags = recipe?.tags ?? [];
  const prepTime = recipe?.prep_time_minutes;
  const cookTime = recipe?.cook_time_minutes;
  const servings = recipe?.servings;

  // Fallback for non-recipe meals (manual name, no recipe object)
  const slotIngredients = meal.ingredients || [];
  const needCount = slotIngredients.filter((i) => !i.have).length;

  function openRepeat(e) {
    e.stopPropagation();
    setRepeatOpen(true);
    setRepeatMode('pick');
    setSelectedDays([]);
    setNextX(null);
  }

  function closeRepeat(e) {
    e?.stopPropagation();
    setRepeatOpen(false);
  }

  function toggleDay(day) {
    if (day === meal.day) return;
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  // Compute target days for "next X days" mode
  function getNextXDays(x) {
    const sourceIdx = ALL_DAYS.indexOf(meal.day);
    const targets = [];
    for (let i = 1; i <= x; i++) {
      const idx = sourceIdx + i;
      if (idx < ALL_DAYS.length) targets.push(ALL_DAYS[idx]);
    }
    return targets;
  }

  const confirmTargetDays =
    repeatMode === 'pick' ? selectedDays : nextX != null ? getNextXDays(nextX) : [];

  const canConfirm = confirmTargetDays.length > 0 && !isRepeating;

  function handleRepeatConfirm(e) {
    e.stopPropagation();
    if (!canConfirm) return;
    startRepeatTransition(async () => {
      const result = await repeatMealAction(meal.day, meal.type, confirmTargetDays, weekOffset);
      if (result.success) {
        setRepeatOpen(false);
        if (onRepeat && result.data?.meals) onRepeat(result.data.meals);
        onClose();
      }
    });
  }

  // Side dish slot — explicitly passed (e.g. dinner's next empty sides slot)
  // or derived from meal type for breakfast / lunch.
  const sideType =
    propSideType !== undefined
      ? propSideType
      : meal.type === 'breakfast'
        ? 'breakfast_side'
        : meal.type === 'lunch'
          ? 'lunch_side'
          : null;

  function openExtra(which, e) {
    e.stopPropagation();
    setExtraOpen(which);
    setSideName('');
    setRepeatOpen(false);
  }

  function closeExtra(e) {
    e?.stopPropagation();
    setExtraOpen(null);
    setSideName('');
  }

  const activeExtraType =
    extraOpen === 'side' ? sideType : extraOpen === 'dessert' ? dessertType : null;
  const activePickerOpen =
    extraOpen === 'side' ? onSidePickerOpen : extraOpen === 'dessert' ? onDessertPickerOpen : null;

  function handleExtraConfirm(e) {
    e?.stopPropagation();
    const name = sideName.trim();
    if (!name || isSavingSide || !activeExtraType) return;
    startSideTransition(async () => {
      const result = await swapMeal(meal.day, activeExtraType, name);
      if (result.success) {
        setExtraOpen(null);
        onClose();
        if (onRepeat) {
          if (result.data?.meals) {
            onRepeat(result.data.meals);
          } else {
            const weekResult = await getWeekMealsAction(weekOffset);
            if (weekResult.success && weekResult.data?.meals) onRepeat(weekResult.data.meals);
          }
        }
      }
    });
  }

  return (
    <Panel $type={meal.type}>
      <Header>
        <div>
          <MealName>{meal.name}</MealName>
          <DayLabel>
            {meal.day}
            {meal.time && ` · ${meal.time}`}
          </DayLabel>
        </div>
        <CloseButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          {'\u2715'}
        </CloseButton>
      </Header>

      {recipe?.image_url && <RecipeImage src={recipe.image_url} alt={meal.name} />}

      <Body>
        {recipe?.description && <Description>{recipe.description}</Description>}

        {(prepTime || cookTime || servings) && (
          <ChipRow>
            {prepTime && <Chip>Prep {prepTime} min</Chip>}
            {cookTime && <Chip>Cook {cookTime} min</Chip>}
            {servings && <Chip>{servings} servings</Chip>}
          </ChipRow>
        )}

        {tags.length > 0 && (
          <ChipRow>
            {tags.map((tag) => (
              <TagChip key={tag} $type={meal.type}>
                {tag}
              </TagChip>
            ))}
          </ChipRow>
        )}

        {recipeIngredients.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionTitle>Ingredients</SectionTitle>
              <IngredientList>
                {recipeIngredients.map((ing, i) => (
                  <IngredientItem key={i}>
                    {typeof ing === 'string' ? ing : ing.name}
                    {ing.quantity ? ` — ${ing.quantity}` : ''}
                  </IngredientItem>
                ))}
              </IngredientList>
            </div>
          </>
        )}

        {recipe?.instructions && (
          <>
            <Divider />
            <div>
              <SectionTitle>Instructions</SectionTitle>
              <Instructions>{recipe.instructions}</Instructions>
            </div>
          </>
        )}

        {/* Non-recipe slot: show grocery action if needed */}
        {!recipe && needCount > 0 && (
          <ActionButton
            $variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onAddToGrocery();
            }}
          >
            + Add {needCount} to grocery
          </ActionButton>
        )}

        <Divider />

        {extraOpen ? (
          <RepeatPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>
                {extraOpen === 'dessert' ? 'Add a dessert' : 'Add a side dish'}
              </RepeatTitle>
              <RepeatCancelLink onClick={closeExtra}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>
            <SideInput
              type="text"
              placeholder={
                extraOpen === 'dessert'
                  ? 'e.g. Ice cream, fruit, cookies...'
                  : 'e.g. Fruit salad, toast, yogurt...'
              }
              value={sideName}
              onChange={(e) => setSideName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtraConfirm(e)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              disabled={isSavingSide}
            />
            {activePickerOpen && (
              <SideOptionsRow onClick={(e) => e.stopPropagation()}>
                <SideOptionButton onClick={() => activePickerOpen('library')}>
                  📖 Recipes
                </SideOptionButton>
                <SideOptionButton onClick={() => activePickerOpen('url')}>🔗 URL</SideOptionButton>
                <SideOptionButton onClick={() => activePickerOpen('ai')}>✨ Koda</SideOptionButton>
              </SideOptionsRow>
            )}
            <RepeatConfirmButton
              $type={meal.type}
              disabled={!sideName.trim() || isSavingSide}
              onClick={handleExtraConfirm}
            >
              {isSavingSide ? 'Saving...' : extraOpen === 'dessert' ? 'Add dessert' : 'Add side'}
            </RepeatConfirmButton>
          </RepeatPanel>
        ) : repeatOpen ? (
          <RepeatPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>Repeat this meal</RepeatTitle>
              <RepeatCancelLink onClick={closeRepeat}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>

            <ModeToggleRow>
              <ModeToggleButton
                $active={repeatMode === 'pick'}
                onClick={(e) => {
                  e.stopPropagation();
                  setRepeatMode('pick');
                  setSelectedDays([]);
                  setNextX(null);
                }}
              >
                Pick days
              </ModeToggleButton>
              <ModeToggleButton
                $active={repeatMode === 'next'}
                onClick={(e) => {
                  e.stopPropagation();
                  setRepeatMode('next');
                  setSelectedDays([]);
                  setNextX(null);
                }}
              >
                Next X days
              </ModeToggleButton>
            </ModeToggleRow>

            {repeatMode === 'pick' ? (
              <DaysRow>
                {ALL_DAYS.map((day) => {
                  const isSource = day === meal.day;
                  const isActive = selectedDays.includes(day);
                  return (
                    <DayPill
                      key={day}
                      $active={isActive}
                      $type={meal.type}
                      $isSource={isSource}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDay(day);
                      }}
                      disabled={isSource}
                    >
                      {day}
                    </DayPill>
                  );
                })}
              </DaysRow>
            ) : (
              <NextXRow>
                {[1, 2, 3, 4].map((n) => {
                  const sourceIdx = ALL_DAYS.indexOf(meal.day);
                  const available = ALL_DAYS.length - 1 - sourceIdx;
                  const isDisabled = n > available;
                  return (
                    <NextXButton
                      key={n}
                      $active={nextX === n}
                      $type={meal.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) setNextX(n);
                      }}
                      disabled={isDisabled}
                      style={{
                        opacity: isDisabled ? 0.35 : 1,
                        cursor: isDisabled ? 'default' : 'pointer',
                      }}
                    >
                      {n}
                    </NextXButton>
                  );
                })}
              </NextXRow>
            )}

            <RepeatConfirmButton
              $type={meal.type}
              disabled={!canConfirm}
              onClick={handleRepeatConfirm}
            >
              {isRepeating ? 'Repeating...' : 'Repeat'}
            </RepeatConfirmButton>
          </RepeatPanel>
        ) : (
          <Actions>
            <ActionButton onClick={(e) => openRepeat(e)}>{'\u21BB'} Repeat</ActionButton>
            <ActionButton
              onClick={(e) => {
                e.stopPropagation();
                onSwap();
              }}
            >
              {'\u21C4'} Swap
            </ActionButton>
            <ActionButton
              $variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              {'\u2715'} Remove
            </ActionButton>
            {(sideType || dessertType) && <Divider />}
            {sideType && (
              <ActionButton onClick={(e) => openExtra('side', e)}>+ Add a side</ActionButton>
            )}
            {dessertType && (
              <ActionButton onClick={(e) => openExtra('dessert', e)}>+ Add a dessert</ActionButton>
            )}
          </Actions>
        )}
      </Body>
    </Panel>
  );
}
