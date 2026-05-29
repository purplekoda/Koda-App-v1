'use client'

import styled from 'styled-components'
import Link from 'next/link'
import ProductDemo from '@/components/landing/ProductDemo'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 ${({ theme }) => theme.spacing.xl};
`

const NavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
`

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.teal};
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
`

const LogoImg = styled.img`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm};
  object-fit: contain;
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    .nav-login {
      display: none;
    }
  }
`

const GhostButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const SolidButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
`

// ─── Section shell ────────────────────────────────────────────────────────────

const Section = styled.section`
  width: 100%;
  padding: ${({ $py }) => $py || '80px'} ${({ theme }) => theme.spacing.xl};
  background: ${({ $bg }) => $bg || 'transparent'};
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const CenteredHeading = styled.h2`
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  color: ${({ $color, theme }) => $color || theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xxl};
  letter-spacing: -0.5px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 28px;
  }
`

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HeroSection = styled.section`
  background: ${({ theme }) => theme.colors.background};
  padding: 96px ${({ theme }) => theme.spacing.xl} 80px;
  text-align: center;
`

const HeroHeadline = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 20px;
  letter-spacing: -1px;
  line-height: 1.1;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 36px;
  }
`

const HeroSubhead = styled.p`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 620px;
  margin: 0 auto 32px;
  line-height: 1.6;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 17px;
  }
`

const HeroCTARow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-bottom: 16px;
`

const HeroCTAPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
`

const HeroCTAGhost = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const TrustLine = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 48px;
`

// Mock app preview card

const MockCard = styled.div`
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: 24px;
  text-align: left;
`

const MockCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const MockCardTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MockCardDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const MockMeals = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const MockMealRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const MockMealChip = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  min-width: 64px;
  text-align: center;
`

const MockMealName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MockDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
  margin: 16px 0;
`

const MockFooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const MockBudgetLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const MockBudgetBar = styled.div`
  flex: 1;
  margin: 0 12px;
  height: 6px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: 99px;
  overflow: hidden;
`

const MockBudgetFill = styled.div`
  height: 100%;
  width: 62%;
  background: ${({ theme }) => theme.colors.teal};
  border-radius: 99px;
`

const MockBudgetAmount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
`

// ─── Social Proof ─────────────────────────────────────────────────────────────

const ProofSection = styled.section`
  background: #ffffff;
  padding: 24px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

const ProofText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

// ─── How It Works ─────────────────────────────────────────────────────────────

const StepsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const StepCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`

const StepNumber = styled.div`
  font-size: 48px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.teal};
  line-height: 1;
  margin-bottom: 12px;
  opacity: 0.25;
`

const StepTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.tealDark};
  margin: 0 0 10px;
`

const StepDesc = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 0;
`

// ─── Feature Grid ─────────────────────────────────────────────────────────────

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const FeatureCard = styled.div`
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 28px 24px;
`

const FeatureEmoji = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`

const FeatureTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 8px;
`

const FeatureDesc = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 0;
`

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PricingRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const PricingCardWrapper = styled.div`
  position: relative;
`

const PopularBadge = styled.div`
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  white-space: nowrap;
`

const PricingCard = styled.div`
  background: #ffffff;
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: 32px 28px;
  border: 2px solid ${({ $featured, theme }) => $featured ? theme.colors.teal : 'transparent'};
  height: 100%;
  box-sizing: border-box;
`

const PricingPlanName = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
`

const PricingPrice = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.teal};
  margin: 12px 0 4px;
  letter-spacing: -1px;
`

const PricingAlt = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 24px;
`

const PricingFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PricingFeature = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  &::before {
    content: '✓';
    color: ${({ theme }) => theme.colors.teal};
    font-weight: 700;
    flex-shrink: 0;
  }
`

const PricingCTA = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 13px 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
`

// ─── Final CTA ────────────────────────────────────────────────────────────────

const FinalCTASection = styled.section`
  background: ${({ theme }) => theme.colors.teal};
  padding: 96px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

const FinalHeading = styled.h2`
  font-size: 44px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 16px;
  letter-spacing: -0.5px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 32px;
  }
`

const FinalSubtext = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 500px;
  margin: 0 auto 32px;
  line-height: 1.6;
`

const FinalButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 14px 32px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: #ffffff;
  color: ${({ theme }) => theme.colors.teal};
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.15s;
  margin-bottom: 16px;

  &:hover {
    opacity: 0.9;
  }
`

const FinalDisclaimer = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
`

// ─── Footer ───────────────────────────────────────────────────────────────────

const FooterOuter = styled.footer`
  background: #ffffff;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 48px ${({ theme }) => theme.spacing.xl} 32px;
`

const FooterGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xxxl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.xxl};
  }
`

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
`

const FooterTagline = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: 1.5;
`

const FooterColTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 14px;
`

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const FooterLink = styled(Link)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.teal};
  }
`

const FooterExternalLink = styled.a`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.teal};
  }
`

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 32px auto 0;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  text-align: center;
`

const FooterCopyright = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* Nav */}
      <Nav>
        <NavInner>
          <Logo href="/">
            <LogoImg src="/koda-logo.png" alt="Koda" />
            Koda
          </Logo>
          <NavActions>
            <GhostButton href="/login" className="nav-login">Log in</GhostButton>
            <SolidButton href="/signup">Start free trial</SolidButton>
          </NavActions>
        </NavInner>
      </Nav>

      {/* Hero */}
      <HeroSection>
        <HeroHeadline>Dinner is figured out.</HeroHeadline>
        <HeroSubhead>
          Koda plans your meals, manages your pantry, tracks your budget, and builds your grocery
          list — so you can stop thinking about it.
        </HeroSubhead>
        <HeroCTARow>
          <HeroCTAPrimary href="/signup">Start your free 14-day trial</HeroCTAPrimary>
          <HeroCTAGhost href="#how-it-works">See how it works</HeroCTAGhost>
        </HeroCTARow>
        <TrustLine>No credit card required · Cancel anytime · Free for 14 days</TrustLine>

        {/* Mock dashboard card */}
        <MockCard>
          <MockCardHeader>
            <MockCardTitle>Today&rsquo;s Meals</MockCardTitle>
            <MockCardDate>Wednesday, May 28</MockCardDate>
          </MockCardHeader>
          <MockMeals>
            <MockMealRow>
              <MockMealChip $bg="#FAEEDA" $color="#BA7517">Breakfast</MockMealChip>
              <MockMealName>Avocado Toast with Eggs</MockMealName>
            </MockMealRow>
            <MockMealRow>
              <MockMealChip $bg="#E1F5EE" $color="#085041">Lunch</MockMealChip>
              <MockMealName>Grilled Chicken Caesar Salad</MockMealName>
            </MockMealRow>
            <MockMealRow>
              <MockMealChip $bg="#EEEDFE" $color="#3C3489">Dinner</MockMealChip>
              <MockMealName>Lemon Herb Salmon with Rice</MockMealName>
            </MockMealRow>
          </MockMeals>
          <MockDivider />
          <MockFooterRow>
            <MockBudgetLabel>Weekly budget</MockBudgetLabel>
            <MockBudgetBar>
              <MockBudgetFill />
            </MockBudgetBar>
            <MockBudgetAmount>$74 of $120</MockBudgetAmount>
          </MockFooterRow>
        </MockCard>
      </HeroSection>

      {/* Social Proof */}
      <ProofSection>
        <ProofText>
          ⭐⭐⭐⭐⭐ &nbsp; Trusted by busy families across the country &nbsp;·&nbsp; 4.9 · 2,400+ families
        </ProofText>
      </ProofSection>

      {/* How It Works */}
      <Section id="how-it-works" $bg="#E1F5EE" $py="80px">
        <Container>
          <CenteredHeading $color="#085041">How Koda works</CenteredHeading>
          <StepsRow>
            <StepCard>
              <StepNumber>1</StepNumber>
              <StepTitle>Tell Koda about your family</StepTitle>
              <StepDesc>
                Set up your household members, dietary needs, and taste preferences in minutes.
                Koda remembers everything so you never have to repeat yourself.
              </StepDesc>
            </StepCard>
            <StepCard>
              <StepNumber>2</StepNumber>
              <StepTitle>Koda plans your week</StepTitle>
              <StepDesc>
                Tap one button and Koda fills your entire week with balanced meals using your
                recipes, pantry ingredients, and budget. Review and swap anything before saving.
              </StepDesc>
            </StepCard>
            <StepCard>
              <StepNumber>3</StepNumber>
              <StepTitle>Shop and cook with confidence</StepTitle>
              <StepDesc>
                Your grocery list builds itself, sorted by store and organized by aisle. Koda
                tracks your spending and makes sure nothing in your pantry goes to waste.
              </StepDesc>
            </StepCard>
          </StepsRow>
        </Container>
      </Section>

      {/* Product Demo */}
      <ProductDemo />

      {/* Feature Grid */}
      <Section $bg="#ffffff" $py="80px">
        <Container>
          <CenteredHeading>Everything your kitchen needs</CenteredHeading>
          <FeatureGrid>
            <FeatureCard>
              <FeatureEmoji>🗓️</FeatureEmoji>
              <FeatureTitle>AI Meal Planning</FeatureTitle>
              <FeatureDesc>
                Tell Koda what you want and it fills your whole week in seconds. Mix your saved
                recipes with new ideas and Surprise Me suggestions.
              </FeatureDesc>
            </FeatureCard>
            <FeatureCard>
              <FeatureEmoji>🛒</FeatureEmoji>
              <FeatureTitle>Smart Grocery Lists</FeatureTitle>
              <FeatureDesc>
                Your list builds automatically from your meal plan. Split by store, sorted by
                category, and ready to send for delivery or pickup.
              </FeatureDesc>
            </FeatureCard>
            <FeatureCard>
              <FeatureEmoji>🥦</FeatureEmoji>
              <FeatureTitle>Pantry Management</FeatureTitle>
              <FeatureDesc>
                Scan your fridge or log what you have. Koda uses expiring ingredients first and
                makes sure nothing goes to waste.
              </FeatureDesc>
            </FeatureCard>
            <FeatureCard>
              <FeatureEmoji>💰</FeatureEmoji>
              <FeatureTitle>Budget Tracking</FeatureTitle>
              <FeatureDesc>
                Set your weekly grocery budget and Koda keeps you on track. Scan receipts, see
                spending trends, and get budget-friendly meal suggestions.
              </FeatureDesc>
            </FeatureCard>
            <FeatureCard>
              <FeatureEmoji>📊</FeatureEmoji>
              <FeatureTitle>Macro Tracking</FeatureTitle>
              <FeatureDesc>
                Set daily nutrition targets for each family member. Koda plans meals that hit your
                goals and tracks your intake throughout the day.
              </FeatureDesc>
            </FeatureCard>
            <FeatureCard>
              <FeatureEmoji>👨‍👩‍👧</FeatureEmoji>
              <FeatureTitle>The Whole Family</FeatureTitle>
              <FeatureDesc>
                Manage dietary restrictions, picky eaters, faith-based practices, and individual
                health goals — all in one household plan.
              </FeatureDesc>
            </FeatureCard>
          </FeatureGrid>
        </Container>
      </Section>

      {/* Pricing */}
      <Section $bg="#FAFAF8" $py="80px">
        <Container>
          <CenteredHeading>Simple pricing</CenteredHeading>
          <PricingRow>
            {/* Solo */}
            <PricingCardWrapper>
              <PricingCard>
                <PricingPlanName>Solo</PricingPlanName>
                <PricingPrice>$4.99<span style={{ fontSize: '18px', fontWeight: 500, opacity: 0.6 }}>/mo</span></PricingPrice>
                <PricingAlt>or $39.99/year — save 33%</PricingAlt>
                <PricingFeatures>
                  <PricingFeature>1 household member</PricingFeature>
                  <PricingFeature>AI meal planning</PricingFeature>
                  <PricingFeature>Smart grocery list</PricingFeature>
                  <PricingFeature>Pantry tracking</PricingFeature>
                  <PricingFeature>Budget tracking</PricingFeature>
                  <PricingFeature>Macro tracking</PricingFeature>
                  <PricingFeature>14-day free trial</PricingFeature>
                </PricingFeatures>
                <PricingCTA href="/signup">Start free trial</PricingCTA>
              </PricingCard>
            </PricingCardWrapper>

            {/* Family */}
            <PricingCardWrapper>
              <PopularBadge>Most popular</PopularBadge>
              <PricingCard $featured>
                <PricingPlanName>Family</PricingPlanName>
                <PricingPrice>$7.99<span style={{ fontSize: '18px', fontWeight: 500, opacity: 0.6 }}>/mo</span></PricingPrice>
                <PricingAlt>or $59.99/year — save 37%</PricingAlt>
                <PricingFeatures>
                  <PricingFeature>Up to 8 household members</PricingFeature>
                  <PricingFeature>Everything in Solo</PricingFeature>
                  <PricingFeature>Individual member profiles</PricingFeature>
                  <PricingFeature>Faith-based dietary settings</PricingFeature>
                  <PricingFeature>Family invite links</PricingFeature>
                  <PricingFeature>14-day free trial</PricingFeature>
                </PricingFeatures>
                <PricingCTA href="/signup">Start free trial</PricingCTA>
              </PricingCard>
            </PricingCardWrapper>
          </PricingRow>
        </Container>
      </Section>

      {/* Final CTA */}
      <FinalCTASection>
        <FinalHeading>Stop dreading dinner.</FinalHeading>
        <FinalSubtext>
          Join thousands of families who let Koda handle the weekly meal chaos.
        </FinalSubtext>
        <div>
          <FinalButton href="/signup">Start your free 14-day trial</FinalButton>
        </div>
        <FinalDisclaimer>No credit card required. Cancel anytime.</FinalDisclaimer>
      </FinalCTASection>

      {/* Footer */}
      <FooterOuter>
        <FooterGrid>
          <div>
            <FooterLogo>
              <LogoImg src="/koda-logo.png" alt="Koda" />
              Koda
            </FooterLogo>
            <FooterTagline>AI-powered meal planning for real families.</FooterTagline>
          </div>
          <div>
            <FooterColTitle>Company</FooterColTitle>
            <FooterLinks>
              <li><FooterLink href="#">About</FooterLink></li>
              <li><FooterLink href="#">Pricing</FooterLink></li>
              <li><FooterLink href="#">Privacy Policy</FooterLink></li>
              <li><FooterLink href="#">Terms of Service</FooterLink></li>
            </FooterLinks>
          </div>
          <div>
            <FooterColTitle>Follow Us</FooterColTitle>
            <FooterLinks>
              <li><FooterExternalLink href="#" rel="noopener noreferrer">TikTok</FooterExternalLink></li>
              <li><FooterExternalLink href="#" rel="noopener noreferrer">Instagram</FooterExternalLink></li>
            </FooterLinks>
          </div>
        </FooterGrid>
        <FooterBottom>
          <FooterCopyright>© 2025 Koda. All rights reserved.</FooterCopyright>
        </FooterBottom>
      </FooterOuter>
    </>
  )
}
