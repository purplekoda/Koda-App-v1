'use client'

import styled from 'styled-components'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sidebarSections } from '@/data/navigation'

const SidebarContainer = styled.aside`
  width: ${({ theme }) => theme.sidebarWidth};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  padding: ${({ theme }) => theme.spacing.xl} 0;
  flex-shrink: 0;
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
`

const LogoDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
`

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px ${({ theme }) => theme.spacing.xl};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 15px;
  color: ${({ $active, theme }) => $active ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-weight: ${({ $active }) => $active ? 500 : 400};
  border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
  transition: all 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const NavDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <SidebarContainer>
      <Logo>
        <LogoDot /> Koda
      </Logo>
      {sidebarSections.map((section) => (
        <div key={section.label}>
          <SectionLabel>{section.label}</SectionLabel>
          {section.items.map((item) => (
            <NavLink
              key={item.id}
              href={item.href}
              $active={pathname === item.href || pathname.startsWith(item.href + '/')}
            >
              <NavDot $color={item.color} />
              {item.name}
            </NavLink>
          ))}
        </div>
      ))}
    </SidebarContainer>
  )
}
