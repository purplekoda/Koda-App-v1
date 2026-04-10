'use client'

import styled from 'styled-components'
import Sidebar from './Sidebar'
import BottomTabBar from './BottomTabBar'

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
`

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xxxl};
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

export default function AppShell({ children, user }) {
  return (
    <Shell>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <BottomTabBar />
    </Shell>
  )
}
