'use client'

import { useEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

// ─── Keyframes ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`
const slideUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}`
const chipIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`
const logoPulse = keyframes`0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.94);opacity:.75}`
const scanBeam = keyframes`0%{top:0%;opacity:0}8%{opacity:1}92%{opacity:1}100%{top:100%;opacity:0}`
const chipPop  = keyframes`from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}`
const bubbleIn = keyframes`from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}`
const dotBlink = keyframes`0%,60%,100%{opacity:.3}30%{opacity:1}`
const btnGlow = keyframes`0%,100%{box-shadow:0 0 0 0 rgba(127,119,221,.5),0 2px 8px rgba(127,119,221,.25)}50%{box-shadow:0 0 0 8px rgba(127,119,221,0),0 2px 8px rgba(127,119,221,.25)}`
const clickAnim = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(.8)}`

// ─── Browser Frame ────────────────────────────────────────────────────────────

const BrowserFrame = styled.div`
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.12);
  overflow: hidden;
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`

const ChromeBar = styled.div`
  height: 36px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #E5E7EB;
  gap: 0;
`

const Dots = styled.div`display:flex;gap:6px;align-items:center;`
const Dot = styled.div`
  width: 12px; height: 12px; border-radius: 50%;
  background: ${({ $c }) => $c};
`

const URLBar = styled.div`
  flex: 1;
  text-align: center;
`
const URLInner = styled.span`
  display: inline-flex;
  align-items: center;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 2px 14px;
  font-size: 11px;
  color: #6B7280;
  height: 22px;
`

// ─── App Viewport ─────────────────────────────────────────────────────────────

const AppViewport = styled.div`
  height: 480px;
  display: flex;
  overflow: hidden;
  background: #FAFAF8;
  position: relative;
  transition: opacity .5s ease;
  opacity: ${({ $fading }) => $fading ? 0 : 1};

  @media (max-width: 640px) { height: 400px; }
`

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SidebarWrap = styled.aside`
  width: 168px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 560px) { width: 40px; }
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #F3F4F6;
`

const KIcon = styled.img`
  width: 28px; height: 28px;
  object-fit: contain;
  flex-shrink: 0;
`

const KodaText = styled.span`
  font-size: 15px; font-weight: 700; color: #1D9E75;
  @media (max-width: 560px) { display: none; }
`

const NavSec = styled.div`padding: 8px 0 4px;`

const NavLabel = styled.div`
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: #9CA3AF; padding: 4px 14px 2px;
  @media (max-width: 560px) { display: none; }
`

const NavItem = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px; font-size: 12px; cursor: default;
  color: ${({ $a }) => $a ? '#1D9E75' : '#6B7280'};
  background: ${({ $a }) => $a ? '#E1F5EE' : 'transparent'};
  font-weight: ${({ $a }) => $a ? 600 : 400};
  .lbl { @media (max-width: 560px) { display: none; } }
`

function SidebarUI({ active }) {
  const plan = [
    { icon: '⊞', label: 'Dashboard' },
    { icon: '📅', label: 'Meal planner' },
    { icon: '🛒', label: 'Grocery list' },
    { icon: '💰', label: 'Budget' },
    { icon: '📊', label: 'Macros' },
  ]
  const kitchen = [
    { icon: '🥦', label: 'Pantry' },
    { icon: '📖', label: 'Recipe Box' },
  ]
  return (
    <SidebarWrap>
      <SidebarTop>
        <KIcon src="/koda-logo.png" alt="" />
        <KodaText>Koda</KodaText>
      </SidebarTop>
      <NavSec>
        <NavLabel>Plan</NavLabel>
        {plan.map(n => (
          <NavItem key={n.label} $a={n.label === active}>
            <span>{n.icon}</span>
            <span className="lbl">{n.label}</span>
          </NavItem>
        ))}
      </NavSec>
      <NavSec>
        <NavLabel>Kitchen</NavLabel>
        {kitchen.map(n => (
          <NavItem key={n.label} $a={n.label === active}>
            <span>{n.icon}</span>
            <span className="lbl">{n.label}</span>
          </NavItem>
        ))}
      </NavSec>
    </SidebarWrap>
  )
}

// ─── Stage 1: Pantry Scan ─────────────────────────────────────────────────────

const PANTRY_ITEMS = ['Spinach', 'Chickpeas', 'Brown rice', 'Tofu', 'Apples', 'Rolled oats']

const PantryWrap = styled.div`height:100%;padding:16px;display:flex;flex-direction:column;gap:12px;`
const PantryTitle = styled.h1`font-size:18px;font-weight:700;color:#1F2937;margin:0;`
const PantrySub = styled.p`font-size:12px;color:#6B7280;margin:2px 0 0;`
const ScanFrame = styled.div`
  position:relative;flex:1;min-height:0;border-radius:14px;overflow:hidden;
  border:1px solid #E5E7EB;background:#EAEAE6;
`
const ScanImg = styled.img`width:100%;height:100%;object-fit:cover;display:block;`
const ScanTint = styled.div`position:absolute;inset:0;background:rgba(29,158,117,.06);`
const ScanBeamEl = styled.div`
  position:absolute;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,#1D9E75 35%,#1D9E75 65%,transparent);
  box-shadow:0 0 14px 3px rgba(29,158,117,.55);
  animation:${scanBeam} 2.6s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce){ display:none; }
`
const ChipCloud = styled.div`position:absolute;left:12px;right:12px;bottom:12px;display:flex;flex-wrap:wrap;gap:6px;`
const DetectChip = styled.div`
  display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.95);
  border:1px solid #1D9E75;color:#085041;font-size:12px;font-weight:600;
  padding:5px 10px;border-radius:999px;animation:${chipPop} .4s ease both;
  @media (prefers-reduced-motion: reduce){ animation:none; }
`

function PantryScanView() {
  return (
    <PantryWrap>
      <div>
        <PantryTitle>Scanning your pantry</PantryTitle>
        <PantrySub>Snap a photo — Koda spots what you already have</PantrySub>
      </div>
      <ScanFrame>
        <ScanImg src="/demo/pantry1.png" alt="Your pantry" />
        <ScanTint />
        <ScanBeamEl />
        <ChipCloud>
          {PANTRY_ITEMS.map((item, i) => (
            <DetectChip key={item} style={{ animationDelay: `${0.5 + i * 0.32}s` }}>
              {item} <span style={{ color: '#1D9E75' }}>✓</span>
            </DetectChip>
          ))}
        </ChipCloud>
      </ScanFrame>
    </PantryWrap>
  )
}

// ─── Stage 2: Pantry List ─────────────────────────────────────────────────────

const PANTRY_LIST_ITEMS = [
  { name: 'Spinach', cat: 'Produce' },
  { name: 'Apples', cat: 'Produce' },
  { name: 'Chickpeas', cat: 'Canned' },
  { name: 'Brown rice', cat: 'Grains' },
  { name: 'Rolled oats', cat: 'Grains' },
  { name: 'Tofu', cat: 'Proteins' },
]

const PListWrap = styled.div`height:100%;padding:16px;display:flex;flex-direction:column;gap:12px;`
const PListTitle = styled.h1`font-size:18px;font-weight:700;color:#1F2937;margin:0;`
const PListSub = styled.p`font-size:12px;color:#6B7280;margin:2px 0 0;`
const PListBanner = styled.div`
  background:#E1F5EE;color:#085041;border-radius:8px;padding:8px 12px;
  font-size:12px;font-weight:500;
`
const PListGrid = styled.div`flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start;`
const PListItem = styled.div`
  display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #EFEFEC;
  border-radius:10px;padding:8px 10px;box-shadow:0 1px 2px rgba(0,0,0,.04);
  animation:${chipIn} .35s ease both;animation-delay:${({ $d }) => $d}ms;
  @media (prefers-reduced-motion: reduce){ animation:none; }
`
const PListCheck = styled.span`
  width:18px;height:18px;border-radius:50%;background:#1D9E75;color:#fff;
  font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
`
const PListName = styled.span`font-size:13px;font-weight:600;color:#1F2937;flex:1;min-width:0;`
const PListCat = styled.span`font-size:10px;color:#9CA3AF;`

function PantryListView() {
  return (
    <PListWrap>
      <div>
        <PListTitle>Your pantry</PListTitle>
        <PListSub>Updated from your scan</PListSub>
      </div>
      <PListBanner>✓ 6 items added — Koda will plan your week around what you already have</PListBanner>
      <PListGrid>
        {PANTRY_LIST_ITEMS.map((it, i) => (
          <PListItem key={it.name} $d={i * 110}>
            <PListCheck>✓</PListCheck>
            <PListName>{it.name}</PListName>
            <PListCat>{it.cat}</PListCat>
          </PListItem>
        ))}
      </PListGrid>
    </PListWrap>
  )
}

// ─── Stage 3–5: Meal Planner ──────────────────────────────────────────────────

const PlannerWrap = styled.div`
  flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;
`

const PlannerHead = styled.div`
  padding: 12px 16px 8px; border-bottom: 1px solid #F3F4F6; flex-shrink: 0;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
`

const PlannerTitleGroup = styled.div`flex: 1; min-width: 0;`

const PlannerH1 = styled.h1`
  font-size: 16px; font-weight: 700; color: #1F2937; margin: 0 0 2px;
`

const PlannerSub = styled.p`
  font-size: 11px; color: #6B7280; margin: 0 0 6px;
`

const Pills = styled.div`display: flex; gap: 5px; flex-wrap: wrap;`

const Pill = styled.span`
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 99px;
  background: ${({ $bg }) => $bg}; color: ${({ $c }) => $c};
`

const PlanBtn = styled.button`
  background: #7F77DD; color: #fff; border: none; border-radius: 99px;
  padding: 7px 12px; font-size: 11px; font-weight: 600; cursor: default;
  white-space: nowrap; flex-shrink: 0; font-family: inherit;
  animation: ${btnGlow} 2s ease-in-out infinite;
`

const WeekNav = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 7px 16px;
  border-bottom: 1px solid #F3F4F6; flex-shrink: 0;
`

const WeekArrow = styled.div`
  width: 22px; height: 22px; border: 1px solid #E5E7EB; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #9CA3AF;
`

const WeekLabel = styled.span`font-size: 12px; font-weight: 600; color: #1F2937;`

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr);
  flex: 1; min-height: 0; overflow: hidden;
`

const DayCol = styled.div`
  border-right: 1px solid #F3F4F6; display: flex; flex-direction: column;
  &:last-child { border-right: none; }
`

const DayHead = styled.div`
  padding: 6px 10px; font-size: 10px; font-weight: 700; color: #6B7280;
  text-transform: uppercase; letter-spacing: .3px;
  border-bottom: 1px solid #F3F4F6; background: #FAFAF8; flex-shrink: 0;
`

const Slot = styled.div`
  flex: 1; min-height: 0; padding: 6px; border-bottom: 1px solid #F3F4F6;
  &:last-child { border-bottom: none; }
`

const MCard = styled.div`
  background: ${({ $bg }) => $bg}; border-radius: 8px; padding: 7px 9px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); height: 100%;
  display: flex; flex-direction: column; gap: 3px; box-sizing: border-box;
`

const MType = styled.span`
  font-size: 9px; font-weight: 700; color: ${({ $c }) => $c};
  text-transform: uppercase; letter-spacing: .3px;
`

const MName = styled.span`
  font-size: 10px; color: ${({ $c }) => $c}; font-weight: 500; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
`

const RecipeBadge = styled.span`
  font-size: 9px; background: #E1F5EE; color: #085041;
  padding: 1px 5px; border-radius: 99px; align-self: flex-start; font-weight: 500;
`

const EmptySlot = styled.div`
  height:100%;border:1.5px dashed #E5E7EB;border-radius:8px;
  display:flex;align-items:center;justify-content:center;box-sizing:border-box;
`
const EmptyLabel = styled.span`
  font-size:9px;font-weight:600;color:#C4C8CF;text-transform:uppercase;letter-spacing:.3px;
`
const FillMCard = styled(MCard)`
  animation:${chipIn} .4s ease both;
  animation-delay:${({ $d }) => $d}ms;
  @media (prefers-reduced-motion: reduce){ animation:none; }
`

const PLANNER_DAYS = [
  {
    day: 'Mon',
    meals: [
      { type: 'Breakfast', name: 'Vegan Berry Smoothie', recipe: true, bg: '#FAEEDA', c: '#BA7517' },
      { type: 'Lunch', name: 'Lentil Soup with Crusty Bread', recipe: true, bg: '#E1F5EE', c: '#085041' },
      { type: 'Dinner', name: 'Sweet and Savory Coconut Rice', recipe: true, bg: '#EEF2FF', c: '#534AB7' },
    ],
  },
  {
    day: 'Tue',
    meals: [
      { type: 'Breakfast', name: 'Oatmeal with Sliced Apples', recipe: false, bg: '#FAEEDA', c: '#BA7517' },
      { type: 'Lunch', name: 'Leftover Lentil Soup', recipe: false, bg: '#E1F5EE', c: '#085041' },
      { type: 'Dinner', name: 'Chickpea and Vegetable Curry', recipe: false, bg: '#EEF2FF', c: '#534AB7' },
    ],
  },
  {
    day: 'Wed',
    meals: [
      { type: 'Breakfast', name: 'Tofu Scramble with Spinach', recipe: false, bg: '#FAEEDA', c: '#BA7517' },
      { type: 'Lunch', name: 'Kale Crunch Salad', recipe: false, bg: '#E1F5EE', c: '#085041' },
      { type: 'Dinner', name: 'Black Bean Burgers', recipe: false, bg: '#EEF2FF', c: '#534AB7' },
    ],
  },
]

function MealPlannerView({ stage, filled }) {
  return (
    <PlannerWrap>
      <PlannerHead>
        <PlannerTitleGroup>
          <PlannerH1>Meal planner</PlannerH1>
          <PlannerSub>{filled ? 'Here\'s your week ✨' : '0 of 28 meals planned this week'}</PlannerSub>
          <Pills>
            {filled
              ? <Pill $bg="#E1F5EE" $c="#085041">Week planned ✓</Pill>
              : <>
                  <Pill $bg="#F3F4F6" $c="#6B7280">0 planned</Pill>
                  <Pill $bg="#FAEEDA" $c="#BA7517">28 to fill</Pill>
                </>}
          </Pills>
        </PlannerTitleGroup>
        <PlanBtn>✦ Koda, plan my week</PlanBtn>
      </PlannerHead>
      <WeekNav>
        <WeekArrow>‹</WeekArrow>
        <WeekLabel>This week</WeekLabel>
        <WeekArrow>›</WeekArrow>
      </WeekNav>
      <Grid>
        {PLANNER_DAYS.map((day, di) => (
          <DayCol key={day.day}>
            <DayHead>{day.day}</DayHead>
            {day.meals.map((m, mi) => (
              <Slot key={m.type}>
                {filled ? (
                  <FillMCard $bg={m.bg} $d={(di * 3 + mi) * 180}>
                    <MType $c={m.c}>{m.type}</MType>
                    <MName $c={m.c}>{m.name}</MName>
                    {m.recipe && <RecipeBadge>recipe linked</RecipeBadge>}
                  </FillMCard>
                ) : (
                  <EmptySlot><EmptyLabel>{m.type}</EmptyLabel></EmptySlot>
                )}
              </Slot>
            ))}
          </DayCol>
        ))}
      </Grid>

      {/* Stage 3: planning modal */}
      {stage === 3 && (
        <ModalOverlay>
          <PlanModal>
            <PlanModalTitle>How would you like to plan your week?</PlanModalTitle>
            <TypeChips>
              <TypeChip $bg="#FAEEDA" $c="#BA7517">Breakfast</TypeChip>
              <TypeChip $bg="#E1F5EE" $c="#085041">Lunch</TypeChip>
              <TypeChip $bg="#EEF2FF" $c="#534AB7">Dinner</TypeChip>
            </TypeChips>
            <OptionRow><CBox $checked />Use My Recipes</OptionRow>
            <OptionRow><CBox />Find Recipes Online</OptionRow>
            <OptionRow $border="#185FA5"><CBox $checked $color="#185FA5" />Fill My Week for Me</OptionRow>
            <OptionRow $border="#D85A30"><CBox />Surprise Me</OptionRow>
            <FilterRow>
              <FilterChip>Budget</FilterChip>
              <FilterChip>Macros</FilterChip>
              <FilterChip>Time</FilterChip>
            </FilterRow>
            <TextHint>Instructions (optional)</TextHint>
            <PlanModalBtn>Plan my week</PlanModalBtn>
          </PlanModal>
        </ModalOverlay>
      )}
    </PlannerWrap>
  )
}

// ─── Stage 2/3 Modal Components ───────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: absolute; inset: 0; background: rgba(0,0,0,.2);
  display: flex; align-items: center; justify-content: center; z-index: 10;
  animation: ${fadeIn} .3s ease;
`

const CheckModal = styled.div`
  background: #fff; border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  padding: 20px; width: 240px;
  animation: ${slideUp} .3s ease;
`

const ModalTitle = styled.h3`font-size:13px;font-weight:700;color:#1F2937;margin:0 0 4px;`
const ModalSub = styled.p`font-size:11px;color:#6B7280;margin:0 0 14px;`
const ModalBtns = styled.div`display:flex;flex-direction:column;gap:7px;`

const OutlineBtn = styled.button`
  background: none; border: 1.5px solid #E5E7EB; border-radius: 8px;
  padding: 7px 12px; font-size: 12px; color: #1F2937;
  cursor: default; text-align: left; font-family: inherit; font-weight: 500;
`

const SolidPurpleBtn = styled.button`
  background: #7F77DD; border: none; border-radius: 8px;
  padding: 7px 12px; font-size: 12px; color: #fff;
  cursor: default; font-family: inherit; font-weight: 600;
`

const PlanModal = styled.div`
  background: #fff; border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  padding: 18px; width: 280px; max-height: 400px; overflow-y: auto;
  animation: ${slideUp} .4s ease;
  &::-webkit-scrollbar { display: none; }
`

const PlanModalTitle = styled.h3`font-size:13px;font-weight:700;color:#1F2937;margin:0 0 12px;`

const TypeChips = styled.div`display:flex;gap:5px;margin-bottom:12px;`

const TypeChip = styled.span`
  padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
  background: ${({ $bg }) => $bg}; color: ${({ $c }) => $c};
`

const OptionRow = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 7px 9px;
  border-radius: 7px; border: 1.5px solid ${({ $border }) => $border || '#E5E7EB'};
  margin-bottom: 6px; font-size: 12px; color: #1F2937; font-weight: 500;
`

const CBox = styled.div`
  width: 15px; height: 15px; border-radius: 3px; flex-shrink: 0;
  background: ${({ $checked, $color }) => $checked ? ($color || '#1D9E75') : 'transparent'};
  border: 1.5px solid ${({ $checked, $color }) => $checked ? ($color || '#1D9E75') : '#D1D5DB'};
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 9px;
  &::after { content: ${({ $checked }) => $checked ? '"✓"' : '""'}; }
`

const FilterRow = styled.div`display:flex;gap:5px;margin:10px 0;`

const FilterChip = styled.span`
  padding: 3px 9px; border-radius: 99px; font-size: 10px;
  background: #F3F4F6; color: #6B7280; font-weight: 500;
`

const TextHint = styled.div`
  border: 1px solid #E5E7EB; border-radius: 7px; padding: 7px 9px;
  font-size: 11px; color: #9CA3AF; height: 40px; margin-bottom: 10px;
`

const PlanModalBtn = styled.button`
  background: #7F77DD; color: #fff; border: none; border-radius: 8px;
  padding: 9px; width: 100%; font-size: 13px; font-weight: 600;
  cursor: default; font-family: inherit;
`

// ─── Stage 4: Loading ────────────────────────────────────────────────────────

const LoadingWrap = styled.div`
  position: absolute; inset: 0; background: #fff; z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; animation: ${fadeIn} .4s ease;
`

const BigK = styled.img`
  width: 52px; height: 52px;
  object-fit: contain;
`

const LogoLockup = styled.div`
  display: flex; align-items: center; gap: 12px;
  animation: ${logoPulse} 1.4s ease-in-out infinite;
`

const BigKodaText = styled.span`
  font-size: 30px; font-weight: 800; color: #1D9E75; letter-spacing: -0.5px;
`

const LoadTitle = styled.p`font-size:17px;font-weight:600;color:#1F2937;margin:0;`
const LoadSub = styled.p`font-size:12px;color:#6B7280;margin:0;text-align:center;max-width:300px;min-height:18px;`

function LoadingView({ typingText }) {
  return (
    <LoadingWrap>
      <LogoLockup>
        <BigK src="/koda-logo.png" alt="" />
        <BigKodaText>Koda</BigKodaText>
      </LogoLockup>
      <LoadTitle>Building your week...</LoadTitle>
      <LoadSub>{typingText}</LoadSub>
    </LoadingWrap>
  )
}

// ─── Stage 5: Review ────────────────────────────────────────────────────────

const ReviewWrap = styled.div`
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  animation: ${slideUp} .4s ease;
`

const ReviewHead = styled.div`padding: 12px 16px 8px; flex-shrink: 0;`
const ReviewH2 = styled.h2`font-size:15px;font-weight:700;color:#1F2937;margin:0 0 6px;`

const InfoChip = styled.div`
  background: #E6F1FB; color: #185FA5; border-radius: 7px;
  padding: 5px 9px; font-size: 10px; font-weight: 500; margin-bottom: 8px;
`

const ReviewScroll = styled.div`
  flex: 1; overflow-y: auto; padding: 0 14px 12px;
  display: flex; flex-direction: column; gap: 7px;
  &::-webkit-scrollbar { display: none; }
`

const DayCard = styled.div`
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
  background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
  padding: 7px 11px; overflow: hidden;
`

const DayCardHead = styled.div`
  flex-shrink: 0; width: 78px;
  display: flex; flex-direction: column; line-height: 1.2;
  font-size: 11px; font-weight: 700; color: #1F2937;
`

const DayCardDate = styled.span`font-size: 9px; color: #9CA3AF; font-weight: 400;`

const ChipsRow = styled.div`flex: 1; min-width: 0; display: flex; gap: 5px;`

const MChip = styled.span`
  flex: 1 1 0; min-width: 0; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding: 3px 8px; border-radius: 99px; font-size: 10px; font-weight: 500;
  background: ${({ $bg }) => $bg}; color: ${({ $c }) => $c};
  opacity: 0; animation: ${chipIn} .3s ease forwards; animation-delay: ${({ $d }) => $d}ms;
`

const ReviewFoot = styled.div`
  padding: 10px 16px; border-top: 1px solid #F3F4F6;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; background: #fff;
`

const GrayBtn = styled.button`
  background: none; border: 1.5px solid #E5E7EB; border-radius: 8px;
  padding: 7px 14px; font-size: 12px; color: #6B7280;
  cursor: default; font-family: inherit; font-weight: 500;
`

const GreenBtn = styled.button`
  background: #1D9E75; color: #fff; border: none; border-radius: 8px;
  padding: 7px 16px; font-size: 12px; font-weight: 600;
  cursor: default; font-family: inherit;
`

const REVIEW_DAYS = [
  { day: 'Monday', meals: [
    { name: 'Vegan Berry Smoothie', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Lentil Soup with Crusty Bread', bg: '#E1F5EE', c: '#085041' },
    { name: 'Sweet and Savory Coconut Rice', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Tuesday', meals: [
    { name: 'Oatmeal with Sliced Apples', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Leftover Lentil Soup', bg: '#E1F5EE', c: '#085041' },
    { name: 'Chickpea and Vegetable Curry', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Wednesday', meals: [
    { name: 'Tofu Scramble with Spinach', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Kale Crunch Salad', bg: '#E1F5EE', c: '#085041' },
    { name: 'Black Bean Burgers', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Thursday', meals: [
    { name: 'Banana Oat Pancakes', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Greek Grain Bowl', bg: '#E1F5EE', c: '#085041' },
    { name: 'Veggie Stir Fry', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Friday', meals: [
    { name: 'Yogurt Parfait', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Caprese Wrap', bg: '#E1F5EE', c: '#085041' },
    { name: 'Mushroom Pasta', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Saturday', meals: [
    { name: 'Avocado Toast', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Summer Salad', bg: '#E1F5EE', c: '#085041' },
    { name: 'Lemon Herb Salmon', bg: '#EEF2FF', c: '#534AB7' },
  ]},
  { day: 'Sunday', meals: [
    { name: 'French Toast', bg: '#FAEEDA', c: '#BA7517' },
    { name: 'Tomato Bisque', bg: '#E1F5EE', c: '#085041' },
    { name: 'Roasted Veggie Bowl', bg: '#EEF2FF', c: '#534AB7' },
  ]},
]

function ReviewView() {
  return (
    <ReviewWrap>
      <ReviewHead>
        <ReviewH2>Review your week</ReviewH2>
        <InfoChip>ℹ All ingredients added to your grocery list — uncheck any you already have.</InfoChip>
      </ReviewHead>
      <ReviewScroll>
        {REVIEW_DAYS.map((day, di) => (
          <DayCard key={day.day}>
            <DayCardHead>
              {day.day}
            </DayCardHead>
            <ChipsRow>
              {day.meals.map((m, mi) => (
                <MChip key={m.name} $bg={m.bg} $c={m.c} $d={di * 120 + mi * 80}>
                  {m.name}
                </MChip>
              ))}
            </ChipsRow>
          </DayCard>
        ))}
      </ReviewScroll>
      <ReviewFoot>
        <GrayBtn>Start over</GrayBtn>
        <GreenBtn>Save week →</GreenBtn>
      </ReviewFoot>
    </ReviewWrap>
  )
}

// ─── Stage 6: Grocery List ────────────────────────────────────────────────────

const GrocWrap = styled.div`
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  animation: ${slideUp} .4s ease;
`

const GrocHead = styled.div`padding: 12px 16px 8px; flex-shrink: 0;`
const GrocH2 = styled.h2`font-size:15px;font-weight:700;color:#1F2937;margin:0 0 2px;`
const GrocSub = styled.p`font-size:11px;color:#6B7280;margin:0 0 10px;`

const StoreRow = styled.div`display:flex;gap:7px;margin-bottom:10px;`

const StoreChip = styled.div`
  padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
  border: 1.5px solid ${({ $a }) => $a ? '#BA7517' : '#E5E7EB'};
  color: ${({ $a }) => $a ? '#BA7517' : '#6B7280'};
  background: ${({ $a }) => $a ? '#FAEEDA' : 'transparent'};
`

const ProgressOuter = styled.div`
  display: flex; background: #F3F4F6; border-radius: 7px; overflow: hidden; margin-bottom: 12px;
`

const ProgStep = styled.div`
  flex: 1; text-align: center; padding: 5px 3px; font-size: 9px; font-weight: 600;
  background: ${({ $a }) => $a ? '#1D9E75' : '#F3F4F6'};
  color: ${({ $a }) => $a ? '#fff' : '#9CA3AF'};
  transition: background .4s, color .4s;
  overflow: hidden; white-space: nowrap;
`

const StatCards = styled.div`
  display: grid; grid-template-columns: repeat(3,1fr); gap: 7px;
  padding: 0 16px; margin-bottom: 10px;
`

const StatCard = styled.div`
  background: #fff; border-radius: 8px; padding: 9px 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
`

const StatLabel = styled.div`font-size:9px;color:#6B7280;margin-bottom:1px;`
const StatVal = styled.div`font-size:16px;font-weight:700;color:${({ $c }) => $c || '#1F2937'};`

const GrocScroll = styled.div`
  flex: 1; overflow-y: auto; padding: 0 16px;
  &::-webkit-scrollbar { display: none; }
`

const SecTitle = styled.h3`font-size:11px;font-weight:700;color:#1F2937;margin:0 0 6px;`

const MealRow = styled.div`
  display: flex; align-items: center; padding: 6px 0;
  border-bottom: 1px solid #F3F4F6; gap: 6px;
`

const MealDayLabel = styled.span`font-size:11px;font-weight:700;color:#6B7280;min-width:26px;`

const SmallChips = styled.div`display:flex;gap:4px;flex:1;flex-wrap:wrap;`

const SChip = styled.span`
  font-size: 9px; padding: 2px 6px; border-radius: 99px; white-space: nowrap;
  background: ${({ $bg }) => $bg}; color: ${({ $c }) => $c}; font-weight: 500;
`

const NeedLbl = styled.span`font-size:10px;color:#D85A30;font-weight:600;white-space:nowrap;`

const GrocFoot = styled.div`
  padding: 10px 16px; border-top: 1px solid #F3F4F6;
  display: flex; justify-content: flex-end; flex-shrink: 0; background: #fff;
`

const ContBtn = styled.button`
  background: #1D9E75; color: #fff; border: none; border-radius: 8px;
  padding: 7px 16px; font-size: 12px; font-weight: 600;
  cursor: default; font-family: inherit;
`

const PROG_LABELS = ['1 Review meals ✓', '2 Pantry check', '3 Choose store', '4 Sent! ✓']

function GroceryView({ step }) {
  return (
    <GrocWrap>
      <GrocHead>
        <GrocH2>Grocery list</GrocH2>
        <GrocSub>Review your meals and see what ingredients you need</GrocSub>
        <StoreRow>
          <StoreChip $a>Walmart</StoreChip>
          <StoreChip>Target</StoreChip>
          <StoreChip>Kroger</StoreChip>
        </StoreRow>
        <ProgressOuter>
          {PROG_LABELS.map((lbl, i) => (
            <ProgStep key={lbl} $a={i <= step}>{lbl}</ProgStep>
          ))}
        </ProgressOuter>
      </GrocHead>
      <StatCards>
        <StatCard>
          <StatLabel>Total ingredients</StatLabel>
          <StatVal>23</StatVal>
        </StatCard>
        <StatCard>
          <StatLabel>Already have</StatLabel>
          <StatVal $c="#1D9E75">0</StatVal>
        </StatCard>
        <StatCard>
          <StatLabel>Need to buy</StatLabel>
          <StatVal $c="#D85A30">23</StatVal>
        </StatCard>
      </StatCards>
      <GrocScroll>
        <SecTitle>Meals this week</SecTitle>
        <MealRow>
          <MealDayLabel>Mon</MealDayLabel>
          <SmallChips>
            <SChip $bg="#FAEEDA" $c="#BA7517">Vegan Berry Smoothie</SChip>
            <SChip $bg="#E1F5EE" $c="#085041">Lentil Soup</SChip>
            <SChip $bg="#EEF2FF" $c="#534AB7">Coconut Rice</SChip>
          </SmallChips>
          <NeedLbl>12 need</NeedLbl>
        </MealRow>
        <MealRow>
          <MealDayLabel>Tue</MealDayLabel>
          <SmallChips>
            <SChip $bg="#FAEEDA" $c="#BA7517">Oatmeal</SChip>
            <SChip $bg="#E1F5EE" $c="#085041">Lentil Soup</SChip>
            <SChip $bg="#EEF2FF" $c="#534AB7">Chickpea Curry</SChip>
          </SmallChips>
          <NeedLbl>6 need</NeedLbl>
        </MealRow>
        <MealRow>
          <MealDayLabel>Wed</MealDayLabel>
          <SmallChips>
            <SChip $bg="#FAEEDA" $c="#BA7517">Tofu Scramble</SChip>
            <SChip $bg="#E1F5EE" $c="#085041">Kale Salad</SChip>
            <SChip $bg="#EEF2FF" $c="#534AB7">Black Bean Burgers</SChip>
          </SmallChips>
          <NeedLbl>5 need</NeedLbl>
        </MealRow>
      </GrocScroll>
      <GrocFoot>
        <ContBtn>Continue →</ContBtn>
      </GrocFoot>
    </GrocWrap>
  )
}

// ─── Stage 8: Chat ────────────────────────────────────────────────────────────

const ChatWrap = styled.div`height:100%;display:flex;flex-direction:column;background:#FAFAF8;`
const ChatHead = styled.div`display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #F0F0EC;`
const ChatAvatar = styled.div`width:30px;height:30px;border-radius:8px;background:#534AB7;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;`
const ChatBody = styled.div`flex:1;min-height:0;padding:16px;display:flex;flex-direction:column;gap:10px;justify-content:flex-end;`
const Bubble = styled.div`max-width:78%;font-size:13px;line-height:1.45;padding:10px 13px;border-radius:14px;animation:${bubbleIn} .45s ease both;@media (prefers-reduced-motion: reduce){animation:none;}`
const UserBubble = styled(Bubble)`align-self:flex-end;background:#534AB7;color:#fff;border-bottom-right-radius:4px;`
const KodaBubble = styled(Bubble)`align-self:flex-start;background:#fff;color:#1F2937;border:1px solid #ECECEC;border-bottom-left-radius:4px;`
const TypingBubble = styled(KodaBubble)`display:inline-flex;gap:4px;align-items:center;padding:12px 14px;`
const TDot = styled.span`width:6px;height:6px;border-radius:50%;background:#534AB7;animation:${dotBlink} 1.2s infinite;`
const ChatInputBar = styled.div`margin:0 14px 14px;padding:10px 14px;background:#fff;border:1px solid #E5E7EB;border-radius:999px;font-size:12px;color:#9CA3AF;`

function ChatView({ step }) {
  return (
    <ChatWrap>
      <ChatHead>
        <ChatAvatar>K</ChatAvatar>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>Ask Koda</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Here whenever you&apos;re stuck</div>
        </div>
      </ChatHead>
      <ChatBody>
        <UserBubble>I&apos;ve got 20 minutes and barely anything in the fridge 😩</UserBubble>
        {step === 1 && (
          <TypingBubble><TDot /><TDot style={{ animationDelay: '.2s' }} /><TDot style={{ animationDelay: '.4s' }} /></TypingBubble>
        )}
        {step >= 2 && (
          <KodaBubble>You&apos;ve got eggs, spinach, and tortillas — a 15-minute breakfast-for-dinner quesadilla works. Want it added to tonight?</KodaBubble>
        )}
      </ChatBody>
      <ChatInputBar>Ask Koda anything…</ChatInputBar>
    </ChatWrap>
  )
}

// ─── Cursor ───────────────────────────────────────────────────────────────────

const CursorEl = styled.div`
  position: absolute; pointer-events: none; z-index: 50;
  transition: top .9s cubic-bezier(.4,0,.2,1), left .9s cubic-bezier(.4,0,.2,1);
  top: ${({ $t }) => $t}%;
  left: ${({ $l }) => $l}%;
  ${({ $clicking }) => $clicking && css`animation: ${clickAnim} .2s ease;`}
`

// ─── Section Wrapper ──────────────────────────────────────────────────────────

const DemoOuter = styled.section`
  background: linear-gradient(180deg, #ffffff 0%, #E1F5EE 100%);
  padding: 80px 24px 96px;
  display: flex; flex-direction: column; align-items: center;
`

const DemoHeading = styled.h2`
  font-size: 32px; font-weight: 700; color: #1F2937;
  text-align: center; margin: 0 0 10px; letter-spacing: -.5px;
  @media (max-width: 640px) { font-size: 26px; }
`

const DemoSubhead = styled.p`
  font-size: 17px; color: #6B7280; text-align: center; margin: 0 0 44px;
  @media (max-width: 640px) { font-size: 15px; }
`

const DemoLayout = styled.div`
  display: flex; align-items: flex-start; gap: 28px;
  width: 100%; max-width: 980px;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
`

const Steps = styled.div`
  width: 136px; flex-shrink: 0; padding-top: 44px;
  display: flex; flex-direction: column;
  @media (max-width: 768px) { display: none; }
`

const StepItem = styled.div`
  display: flex; align-items: flex-start; gap: 10px; padding-bottom: 24px;
  position: relative;
  &::before {
    content: ''; position: absolute; left: 11px; top: 24px; bottom: 0;
    width: 2px; background: ${({ $done, $active }) => ($done || $active) ? '#1D9E75' : '#E5E7EB'};
    transition: background .4s;
  }
  &:last-child::before { display: none; }
`

const StepDot = styled.div`
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid ${({ $done, $active }) => ($done || $active) ? '#1D9E75' : '#E5E7EB'};
  background: ${({ $done, $active }) => $done ? '#1D9E75' : $active ? '#E1F5EE' : '#fff'};
  color: ${({ $done }) => $done ? '#fff' : '#9CA3AF'};
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; transition: all .4s;
`

const StepLbl = styled.div`
  font-size: 12px; padding-top: 3px; transition: all .4s;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ $done, $active }) => $done ? '#1D9E75' : $active ? '#1F2937' : '#9CA3AF'};
`

// ─── Data ─────────────────────────────────────────────────────────────────────

const STAGE_MS = [3400, 3000, 3200, 2200, 2800, 2800, 3200, 3800, 3800, 4500]

// [top%, left%] relative to AppViewport — stages without cursor entries are skipped
const CURSOR_START = { 3: [50,50], 4: [40,55], 5: [50,50], 8: [40,55], 9: [88,76] }
const CURSOR_END   = { 3: [40,55], 4: [14,86], 5: [55,57], 8: [88,84], 9: [88,84] }

const TYPING_STEPS = [
  'Monday done',
  'Monday done · Tuesday done',
  'Monday done · Tuesday done · Wednesday done',
  'Monday done · Tuesday done · Wednesday done · Thursday done',
  'Monday done · Tuesday done · Wednesday done · Thursday done · Friday done',
  'Monday done · Tuesday done · Wednesday done · Thursday done · Friday done · Working on Saturday...',
]

const DEMO_STEPS = [
  { label: 'Scan your pantry', stages: [1, 2] },
  { label: 'Plan your week', stages: [3, 4, 5] },
  { label: 'Koda builds it', stages: [6, 7] },
  { label: 'Review meals', stages: [8] },
  { label: 'Grocery list', stages: [9] },
  { label: 'Ask Koda', stages: [10] },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDemo() {
  const [stage, setStage] = useState(1)
  const [running, setRunning] = useState(false)
  const [cursor, setCursor] = useState({ t: 50, l: 50 })
  const [clicking, setClicking] = useState(false)
  const [typingIdx, setTypingIdx] = useState(0)
  const [grocStep, setGrocStep] = useState(0)
  const [chatStep, setChatStep] = useState(0)
  const [fading, setFading] = useState(false)
  const [reduced, setReduced] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const h = e => setReduced(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    if (reduced || running) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setRunning(true) },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduced, running])

  // Cursor movement
  useEffect(() => {
    if (!running) return
    if (stage === 1 || stage === 2 || stage === 6 || stage === 7 || stage === 10) return
    const dur = STAGE_MS[stage - 1]
    const [st, sl] = CURSOR_START[stage]
    const [et, el] = CURSOR_END[stage]
    setCursor({ t: st, l: sl })
    const moveT = setTimeout(() => setCursor({ t: et, l: el }), dur * 0.38)
    const clickT = setTimeout(() => {
      setClicking(true)
      setTimeout(() => setClicking(false), 250)
    }, dur * 0.84)
    return () => { clearTimeout(moveT); clearTimeout(clickT) }
  }, [stage, running])

  // Stage advancement
  useEffect(() => {
    if (!running) return
    const dur = STAGE_MS[stage - 1]
    const t = setTimeout(() => {
      if (stage === 10) {
        setFading(true)
        setTimeout(() => { setStage(1); setFading(false) }, 600)
      } else {
        setStage(s => s + 1)
      }
    }, dur)
    return () => clearTimeout(t)
  }, [stage, running])

  // Typing animation stage 4
  useEffect(() => {
    if (stage !== 6 || !running) { setTypingIdx(0); return }
    let i = 0
    const iv = setInterval(() => {
      i++; setTypingIdx(i)
      if (i >= TYPING_STEPS.length - 1) clearInterval(iv)
    }, 620)
    return () => clearInterval(iv)
  }, [stage, running])

  // Grocery sub-steps stage 6
  useEffect(() => {
    if (stage !== 9 || !running) { setGrocStep(0); return }
    const t1 = setTimeout(() => setGrocStep(1), 1500)
    const t2 = setTimeout(() => setGrocStep(2), 2900)
    const t3 = setTimeout(() => setGrocStep(3), 4100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [stage, running])

  // Chat sub-steps stage 8
  useEffect(() => {
    if (stage !== 10 || !running) { setChatStep(0); return }
    const t1 = setTimeout(() => setChatStep(1), 1200)
    const t2 = setTimeout(() => setChatStep(2), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [stage, running])

  const activeIdx = DEMO_STEPS.findIndex(s => s.stages.includes(stage))
  const activeNav =
    (stage === 1 || stage === 2) ? 'Pantry'
    : stage === 9 ? 'Grocery list'
    : stage === 10 ? 'Dashboard'
    : 'Meal planner'

  return (
    <DemoOuter ref={ref}>
      <DemoHeading>See Koda in action</DemoHeading>
      <DemoSubhead>One tap. A full week of meals. Grocery list included.</DemoSubhead>

      <DemoLayout>
        <Steps>
          {DEMO_STEPS.map((s, i) => {
            const done = i < activeIdx
            const active = i === activeIdx
            return (
              <StepItem key={s.label} $done={done} $active={active}>
                <StepDot $done={done} $active={active}>
                  {done ? '✓' : i + 1}
                </StepDot>
                <StepLbl $done={done} $active={active}>{s.label}</StepLbl>
              </StepItem>
            )
          })}
        </Steps>

        <BrowserFrame>
          <ChromeBar>
            <Dots>
              <Dot $c="#FF5F57" />
              <Dot $c="#FEBC2E" />
              <Dot $c="#28C840" />
            </Dots>
            <URLBar><URLInner>app.koda.com</URLInner></URLBar>
          </ChromeBar>

          <AppViewport $fading={fading}>
            <SidebarUI active={activeNav} />

            {/* Stage content */}
            {stage === 1 && <PantryScanView />}
            {stage === 2 && <PantryListView />}
            {stage >= 3 && stage <= 5 && <MealPlannerView stage={reduced ? 1 : stage - 2} />}
            {stage === 6 && <LoadingView typingText={TYPING_STEPS[typingIdx]} />}
            {stage === 7 && <MealPlannerView stage={1} filled />}
            {stage === 8 && <ReviewView />}
            {stage === 9 && <GroceryView step={grocStep} />}
            {stage === 10 && <ChatView step={chatStep} />}

            {/* Animated cursor */}
            {running && !reduced && stage !== 1 && stage !== 2 && stage !== 6 && stage !== 7 && stage !== 10 && (
              <CursorEl $t={cursor.t} $l={cursor.l} $clicking={clicking}>
                <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                  <path
                    d="M1.5 1.5L1.5 13.5L5 10L8 16.5L10 15.5L7 9H12.5L1.5 1.5Z"
                    fill="white" stroke="#333" strokeWidth="1.5" strokeLinejoin="round"
                  />
                </svg>
              </CursorEl>
            )}
          </AppViewport>
        </BrowserFrame>
      </DemoLayout>
    </DemoOuter>
  )
}
