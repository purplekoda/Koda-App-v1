'use client';

import styled from 'styled-components';
import MealCard from './MealCard';
import MealDetailInline from './MealDetailInline';

const Wrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    background: ${({ theme }) => theme.colors.surface};
    border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const DayHeader = styled.div`
  font-size: 14px;
  font-weight: ${({ $isToday }) => ($isToday ? 600 : 500)};
  color: ${({ $isToday, theme }) => ($isToday ? theme.colors.teal : theme.colors.textPrimary)};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid ${({ $isToday, theme }) =>
    $isToday ? theme.colors.teal : theme.colors.borderLight};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TodayDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`;

const DayDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 400;
  margin-left: auto;
`;

const SIDES_TYPES = ['sides', 'sides2', 'sides3', 'sides4'];

// Small pill shown below breakfast/lunch when an optional side has been added
const MealSidePill = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.purpleLight : theme.colors.borderLight};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.purpleLight : theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`;

const SidePillLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
`;

const SidePillName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// --- Combined dinner + sides card ---

const CombinedCard = styled.div`
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  cursor: pointer;
  border: ${({ $anySelected, $anyFilled, $accentColor, $accentLight, theme }) => {
    if ($anySelected) return `2px solid ${theme.colors[$accentColor || 'purpleDark']}`;
    if ($anyFilled) return `1.5px solid ${theme.colors[$accentLight || 'purpleLight']}`;
    return `1.5px dashed ${theme.colors.border}`;
  }};
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`;

const CombinedHalf = styled.div`
  padding: 10px 12px;
  min-height: 56px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: ${({ $fillBg, $fillBgToday, $isToday, $isEmpty, theme }) => {
    if ($isEmpty) return theme.colors.surface;
    return theme.colors[$isToday ? $fillBgToday || 'purpleMid' : $fillBg || 'purpleLight'];
  }};

  &:hover {
    filter: brightness(0.97);
  }
`;

const HalfDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
`;

const HalfText = styled.div`
  flex: 1;
  min-width: 0;
`;

const HalfLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  opacity: 0.8;
  margin-bottom: 2px;
  color: ${({ $fillText, $isEmpty, theme }) => {
    if ($isEmpty) return theme.colors.textMuted;
    return theme.colors[$fillText || 'purpleDark'];
  }};
`;

const HalfName = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isEmpty, theme }) => ($isEmpty ? theme.colors.textMuted : theme.colors.textPrimary)};
  opacity: ${({ $isEmpty }) => ($isEmpty ? 0.4 : 1)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HalfRecipeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.tealDark};
  background: ${({ theme }) => theme.colors.tealMid};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.pill};
  margin-top: 4px;
  line-height: 1;
  white-space: nowrap;
`;

const HalfThumbnail = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  flex-shrink: 0;
  align-self: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

function DinnerSidesCard({
  dinner,
  sidesSlots,
  dessertSlot,
  day,
  isToday,
  selectedMeal,
  onHalfClick,
}) {
  const dinnerSelected = selectedMeal && selectedMeal.day === day && selectedMeal.type === 'dinner';
  const anySidesSelected =
    selectedMeal && selectedMeal.day === day && SIDES_TYPES.includes(selectedMeal.type);
  const dessertSelected =
    selectedMeal && selectedMeal.day === day && selectedMeal.type === 'dinner_dessert';
  const anySelected = dinnerSelected || anySidesSelected || dessertSelected;
  const anyFilled = !!(dinner.name || sidesSlots.some((s) => s.name) || dessertSlot?.name);

  return (
    <CombinedCard $anySelected={anySelected} $anyFilled={anyFilled}>
      {/* Dinner half */}
      <CombinedHalf
        $isToday={isToday}
        $isEmpty={!dinner.name}
        $fillBg="purpleLight"
        $fillBgToday="purpleMid"
        onClick={() => onHalfClick(dinner, day)}
      >
        <HalfText>
          <HalfLabel $fillText="purpleDark" $isEmpty={!dinner.name}>
            dinner
          </HalfLabel>
          <HalfName $isEmpty={!dinner.name}>{dinner.name || '—'}</HalfName>
          {dinner.recipeId && <HalfRecipeBadge>recipe linked</HalfRecipeBadge>}
        </HalfText>
        {dinner.recipeId && dinner.imageUrl && (
          <HalfThumbnail>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dinner.imageUrl} alt={dinner.name} />
          </HalfThumbnail>
        )}
      </CombinedHalf>

      {/* Sides halves — one per slot (up to 4), with dividers */}
      {sidesSlots.map((sides) => (
        <div key={sides.type} style={{ display: 'contents' }}>
          <HalfDivider />
          <CombinedHalf
            $isToday={isToday}
            $isEmpty={!sides.name}
            $fillBg="purpleLight"
            $fillBgToday="purpleMid"
            onClick={() => onHalfClick(sides, day)}
          >
            <HalfText>
              <HalfLabel $fillText="purpleDark" $isEmpty={!sides.name}>
                sides
              </HalfLabel>
              <HalfName $isEmpty={!sides.name}>{sides.name || '—'}</HalfName>
              {sides.recipeId && <HalfRecipeBadge>recipe linked</HalfRecipeBadge>}
            </HalfText>
            {sides.recipeId && sides.imageUrl && (
              <HalfThumbnail>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sides.imageUrl} alt={sides.name} />
              </HalfThumbnail>
            )}
          </CombinedHalf>
        </div>
      ))}

      {/* Dessert half */}
      {dessertSlot && (
        <div style={{ display: 'contents' }}>
          <HalfDivider />
          <CombinedHalf
            $isToday={isToday}
            $isEmpty={!dessertSlot.name}
            $fillBg="purpleLight"
            $fillBgToday="purpleMid"
            onClick={() => onHalfClick(dessertSlot, day)}
          >
            <HalfText>
              <HalfLabel $fillText="purpleDark" $isEmpty={!dessertSlot.name}>
                dessert
              </HalfLabel>
              <HalfName $isEmpty={!dessertSlot.name}>{dessertSlot.name || '—'}</HalfName>
              {dessertSlot.recipeId && <HalfRecipeBadge>recipe linked</HalfRecipeBadge>}
            </HalfText>
            {dessertSlot.recipeId && dessertSlot.imageUrl && (
              <HalfThumbnail>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dessertSlot.imageUrl} alt={dessertSlot.name} />
              </HalfThumbnail>
            )}
          </CombinedHalf>
        </div>
      )}
    </CombinedCard>
  );
}

// ─── Generic meal + side combined card (breakfast / lunch) ────────────────────

const MEAL_HALF_COLORS = {
  breakfast: {
    bg: 'amberLight',
    bgToday: 'amberMid',
    text: 'amberDark',
    accent: 'amber',
    accentLight: 'amberMid',
  },
  lunch: {
    bg: 'tealLight',
    bgToday: 'tealMid',
    text: 'tealDark',
    accent: 'teal',
    accentLight: 'tealMid',
  },
};

function MealWithSideCard({ mainMeal, sideSlot, day, isToday, selectedMeal, onHalfClick }) {
  const c = MEAL_HALF_COLORS[mainMeal.type] || {
    bg: 'purpleLight',
    bgToday: 'purpleMid',
    text: 'purpleDark',
    accent: 'purpleDark',
    accentLight: 'purpleLight',
  };
  const mainSelected = selectedMeal?.day === day && selectedMeal?.type === mainMeal.type;
  const sideSelected = selectedMeal?.day === day && selectedMeal?.type === sideSlot.type;
  const anySelected = mainSelected || sideSelected;
  const anyFilled = !!(mainMeal.name || sideSlot.name);

  return (
    <CombinedCard
      $anySelected={anySelected}
      $anyFilled={anyFilled}
      $accentColor={c.accent}
      $accentLight={c.accentLight}
    >
      {/* Main meal half */}
      <CombinedHalf
        $isToday={isToday}
        $isEmpty={!mainMeal.name}
        $fillBg={c.bg}
        $fillBgToday={c.bgToday}
        onClick={() => onHalfClick(mainMeal, day)}
      >
        <HalfText>
          <HalfLabel $fillText={c.text} $isEmpty={!mainMeal.name}>
            {mainMeal.type}
          </HalfLabel>
          <HalfName $isEmpty={!mainMeal.name}>{mainMeal.name || '—'}</HalfName>
          {mainMeal.recipeId && <HalfRecipeBadge>recipe linked</HalfRecipeBadge>}
        </HalfText>
        {mainMeal.recipeId && mainMeal.imageUrl && (
          <HalfThumbnail>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainMeal.imageUrl} alt={mainMeal.name} />
          </HalfThumbnail>
        )}
      </CombinedHalf>

      <HalfDivider />

      {/* Side half */}
      <CombinedHalf
        $isToday={isToday}
        $isEmpty={!sideSlot.name}
        $fillBg={c.bg}
        $fillBgToday={c.bgToday}
        onClick={() => onHalfClick(sideSlot, day)}
      >
        <HalfText>
          <HalfLabel $fillText={c.text} $isEmpty={!sideSlot.name}>
            side
          </HalfLabel>
          <HalfName $isEmpty={!sideSlot.name}>{sideSlot.name || '—'}</HalfName>
          {sideSlot.recipeId && <HalfRecipeBadge>recipe linked</HalfRecipeBadge>}
        </HalfText>
        {sideSlot.recipeId && sideSlot.imageUrl && (
          <HalfThumbnail>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sideSlot.imageUrl} alt={sideSlot.name} />
          </HalfThumbnail>
        )}
      </CombinedHalf>
    </CombinedCard>
  );
}

export default function MealPlannerGrid({
  meals,
  selectedMeal,
  onSelectMeal,
  onSwap,
  onAddToGrocery,
  onRemove,
  onSlotClick,
  onSidePickerOpen,
  onRepeat,
  weekOffset = 0,
}) {
  function handleCardClick(meal, day) {
    if (meal.name) {
      // Meal exists (linked recipe or manual) — expand inline detail
      if (selectedMeal && selectedMeal.day === day && selectedMeal.type === meal.type) {
        onSelectMeal(null);
      } else {
        onSelectMeal({ ...meal, day });
      }
      return;
    }

    // Empty slot — open the picker modal
    if (onSlotClick) {
      onSlotClick(day, meal.type, null);
      return;
    }

    // Fallback: toggle inline detail when no picker is wired
    if (selectedMeal && selectedMeal.day === day && selectedMeal.type === meal.type) {
      onSelectMeal(null);
    } else {
      onSelectMeal({ ...meal, day });
    }
  }

  return (
    <Wrapper>
      <Grid>
        {meals.map((day) => {
          const dinnerMeal = day.meals.find((m) => m.type === 'dinner') ?? { type: 'dinner' };

          // Only show filled sides — no blank placeholder slot
          const allSidesSlots = SIDES_TYPES.map(
            (t) => day.meals.find((m) => m.type === t) ?? { type: t },
          );
          const filledSides = allSidesSlots.filter((s) => s.name);
          const dessertSlot = day.meals.find((m) => m.type === 'dinner_dessert') ?? null;

          const dinnerOrSidesSelected =
            selectedMeal &&
            selectedMeal.day === day.day &&
            (selectedMeal.type === 'dinner' ||
              SIDES_TYPES.includes(selectedMeal.type) ||
              selectedMeal.type === 'dinner_dessert');

          return (
            <DayColumn key={day.day}>
              <DayHeader $isToday={day.isToday}>
                {day.day}
                {day.isToday && <TodayDot />}
                {day.isToday && <DayDate>Today</DayDate>}
              </DayHeader>

              {/* Breakfast and lunch render individually */}
              {day.meals
                .filter(
                  (meal) =>
                    meal.type !== 'dinner' &&
                    !SIDES_TYPES.includes(meal.type) &&
                    meal.type !== 'breakfast_side' &&
                    meal.type !== 'lunch_side' &&
                    meal.type !== 'dinner_dessert',
                )
                .map((meal) => {
                  const isSelected =
                    selectedMeal && selectedMeal.day === day.day && selectedMeal.type === meal.type;

                  // Optional side pill (only for breakfast / lunch)
                  const sideSlotType =
                    meal.type === 'breakfast'
                      ? 'breakfast_side'
                      : meal.type === 'lunch'
                        ? 'lunch_side'
                        : null;
                  const sideSlot = sideSlotType
                    ? day.meals.find((m) => m.type === sideSlotType)
                    : null;
                  const sideIsSelected =
                    sideSlot?.name &&
                    selectedMeal &&
                    selectedMeal.day === day.day &&
                    selectedMeal.type === sideSlotType;

                  const showCombined = !!sideSlot?.name;

                  return (
                    <div key={meal.type}>
                      {showCombined ? (
                        <>
                          <MealWithSideCard
                            mainMeal={meal}
                            sideSlot={sideSlot}
                            day={day.day}
                            isToday={day.isToday}
                            selectedMeal={selectedMeal}
                            onHalfClick={handleCardClick}
                          />
                          {(isSelected || sideIsSelected) && (
                            <MealDetailInline
                              meal={selectedMeal}
                              onClose={() => onSelectMeal(null)}
                              onSwap={() => onSwap && onSwap(selectedMeal)}
                              onAddToGrocery={() => onAddToGrocery && onAddToGrocery(selectedMeal)}
                              onRemove={() => onRemove && onRemove(selectedMeal)}
                              onRepeat={onRepeat}
                              weekOffset={weekOffset}
                              onSidePickerOpen={
                                sideSlotType && onSidePickerOpen
                                  ? (mode) => onSidePickerOpen(day.day, sideSlotType, mode)
                                  : undefined
                              }
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <MealCard
                            type={meal.type}
                            name={meal.name}
                            isToday={day.isToday}
                            isSelected={isSelected}
                            recipeId={meal.recipeId ?? null}
                            slotId={meal.slotId ?? null}
                            imageUrl={meal.imageUrl ?? null}
                            day={day.day}
                            onClick={() => handleCardClick(meal, day.day)}
                            onSlotClick={undefined}
                          />
                          {isSelected && (
                            <MealDetailInline
                              meal={selectedMeal}
                              onClose={() => onSelectMeal(null)}
                              onSwap={() => onSwap && onSwap(selectedMeal)}
                              onAddToGrocery={() => onAddToGrocery && onAddToGrocery(selectedMeal)}
                              onRemove={() => onRemove && onRemove(selectedMeal)}
                              onRepeat={onRepeat}
                              weekOffset={weekOffset}
                              onSidePickerOpen={
                                sideSlotType && onSidePickerOpen
                                  ? (mode) => onSidePickerOpen(day.day, sideSlotType, mode)
                                  : undefined
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

              {/* Dinner — plain card when no sides/dessert, combined card otherwise */}
              {(() => {
                const dinnerIsSelected =
                  selectedMeal?.day === day.day && selectedMeal?.type === 'dinner';
                const showCombined = filledSides.length > 0 || !!dessertSlot?.name;
                const nextDinnerSideType =
                  SIDES_TYPES.find((t) => {
                    const s = day.meals.find((m) => m.type === t);
                    return !s || !s.name;
                  }) ?? null;
                const dinnerDessertType = dessertSlot?.name ? null : 'dinner_dessert';

                const detailPanel = dinnerOrSidesSelected && (
                  <MealDetailInline
                    meal={selectedMeal}
                    onClose={() => onSelectMeal(null)}
                    onSwap={() => onSwap && onSwap(selectedMeal)}
                    onAddToGrocery={() => onAddToGrocery && onAddToGrocery(selectedMeal)}
                    onRemove={() => onRemove && onRemove(selectedMeal)}
                    onRepeat={onRepeat}
                    weekOffset={weekOffset}
                    sideType={selectedMeal?.type === 'dinner' ? nextDinnerSideType : undefined}
                    dessertType={selectedMeal?.type === 'dinner' ? dinnerDessertType : undefined}
                    onSidePickerOpen={
                      selectedMeal?.type === 'dinner' && nextDinnerSideType && onSidePickerOpen
                        ? (mode) => onSidePickerOpen(day.day, nextDinnerSideType, mode)
                        : undefined
                    }
                    onDessertPickerOpen={
                      selectedMeal?.type === 'dinner' && dinnerDessertType && onSidePickerOpen
                        ? (mode) => onSidePickerOpen(day.day, 'dinner_dessert', mode)
                        : undefined
                    }
                  />
                );

                return (
                  <div>
                    {showCombined ? (
                      <DinnerSidesCard
                        dinner={dinnerMeal}
                        sidesSlots={filledSides}
                        dessertSlot={dessertSlot?.name ? dessertSlot : null}
                        day={day.day}
                        isToday={day.isToday}
                        selectedMeal={selectedMeal}
                        onHalfClick={handleCardClick}
                      />
                    ) : (
                      <MealCard
                        type="dinner"
                        name={dinnerMeal.name}
                        isToday={day.isToday}
                        isSelected={dinnerIsSelected}
                        recipeId={dinnerMeal.recipeId ?? null}
                        slotId={dinnerMeal.slotId ?? null}
                        imageUrl={dinnerMeal.imageUrl ?? null}
                        day={day.day}
                        onClick={() => handleCardClick(dinnerMeal, day.day)}
                        onSlotClick={undefined}
                      />
                    )}
                    {detailPanel}
                  </div>
                );
              })()}
            </DayColumn>
          );
        })}
      </Grid>
    </Wrapper>
  );
}
