'use client'

import { useState } from 'react'
import styled from 'styled-components'

const BarWrapper = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.input};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.radii.pill};
  }
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
  flex-shrink: 0;
`

const Input = styled.input`
  flex: 1;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 14px;
  }
`

const AskButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-height: ${({ theme }) => theme.touchTarget};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border: none;
    padding: 8px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.borderLight};
    justify-content: center;
  }
`

const AskText = styled.span`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const ArrowIcon = styled.span`
  font-size: 16px;
`

export default function AIBar({ placeholder, onSubmit }) {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim() && onSubmit) {
      onSubmit(query.trim())
      setQuery('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <BarWrapper>
        <PurpleDot />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Ask Koda anything\u2026'}
          type="text"
          maxLength={500}
        />
        <AskButton type="submit">
          <AskText>Ask</AskText>
          <ArrowIcon>{'\u2197'}</ArrowIcon>
        </AskButton>
      </BarWrapper>
    </form>
  )
}
