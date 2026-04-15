'use client'

import { startTransition } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sidebarSections } from '@/data/navigation'
import { logout } from '@/app/(auth)/actions'

const SidebarContainer = styled.aside`
  width: ${({ theme }) => theme.sidebarWidth};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  padding: ${({ theme }) => theme.spacing.xl} 0;
  flex-shrink: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

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

const NavContent = styled.div`
  flex: 1;
`

const UserSection = styled.div`
  margin-top: auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  flex-shrink: 0;
`

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const UserName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.body};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const LogoutButton = styled.button`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.coral};
  }
`

export default function Sidebar({ user }) {
  const pathname = usePathname()

  function handleLogout() {
    startTransition(() => {
      logout()
    })
  }

  return (
    <SidebarContainer>
      <Logo>
        <LogoDot /> Koda
      </Logo>
      <NavContent>
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
      </NavContent>
      {user && (
        <UserSection>
          <Avatar>{user.initials}</Avatar>
          <UserInfo>
            <UserName>{user.displayName}</UserName>
          </UserInfo>
          <LogoutButton onClick={handleLogout} aria-label="Sign out">
            Sign out
          </LogoutButton>
        </UserSection>
      )}
    </SidebarContainer>
  )
}
