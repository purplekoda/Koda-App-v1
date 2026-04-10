'use client'

import { useState, useCallback, useTransition } from 'react'
import styled from 'styled-components'
import AIResponse from './AIResponse'
import { askAI } from '@/lib/actions/ai'

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

export default function AIBar({ placeholder, context, onSubmit }) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await askAI(trimmed, context || 'general')
      if (result.success && result.data) {
        setResponse(result.data)
        setQuery('')
        if (onSubmit) onSubmit(trimmed)
      } else {
        setResponse({ text: result.error || 'Koda couldn\u2019t respond. Please try again.', isError: true })
      }
    })
  }, [query, context, onSubmit, startTransition])

  function handleChipClick(chip) {
    startTransition(async () => {
      const result = await askAI(chip, context || 'general')
      if (result.success && result.data) {
        setResponse(result.data)
      } else {
        setResponse({ text: result.error || 'Koda couldn\u2019t respond. Please try again.', isError: true })
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <BarWrapper>
          <PurpleDot />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isPending ? 'Koda is thinking\u2026' : (placeholder || 'Ask Koda anything\u2026')}
            type="text"
            maxLength={500}
            disabled={isPending}
          />
          <AskButton type="submit" disabled={isPending}>
            <AskText>{isPending ? '\u2026' : 'Ask'}</AskText>
            <ArrowIcon>{'\u2197'}</ArrowIcon>
          </AskButton>
        </BarWrapper>
      </form>

      <AIResponse
        response={response}
        onClose={() => setResponse(null)}
        onChipClick={handleChipClick}
      />
    </>
  )
}
