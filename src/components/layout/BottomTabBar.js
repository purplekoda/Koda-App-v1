'use client'

import styled from 'styled-components'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { bottomTabs } from '@/data/navigation'

const TabBarContainer = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ theme }) => theme.bottomNavHeight};
  background: ${({ theme }) => theme.colors.surface};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  z-index: 100;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
`

const Tab = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  min-height: ${({ theme }) => theme.touchTarget};
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight : 'transparent'};
  transition: background 0.15s ease;
`

const TabDot = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ $color, $active, theme }) => $active ? $color : theme.colors.textMuted};
  opacity: ${({ $active }) => $active ? 1 : 0.5};
`

const TabLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $active, theme }) => $active ? theme.colors.textPrimary : theme.colors.textMuted};
  font-weight: ${({ $active }) => $active ? 500 : 400};
`

export default function BottomTabBar() {
  const pathname = usePathname()

  return (
    <TabBarContainer>
      {bottomTabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Tab key={tab.id} href={tab.href} $active={active}>
            <TabDot $color={tab.color} $active={active} />
            <TabLabel $active={active}>{tab.name}</TabLabel>
          </Tab>
        )
      })}
    </TabBarContainer>
  )
}
