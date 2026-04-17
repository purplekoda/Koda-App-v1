'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useChat } from './ChatProvider'

const FixedLayer = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  pointer-events: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xxxl};
  display: flex;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.md});
  }
`

const Column = styled.div`
  width: 100%;
  max-width: 640px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  max-height: min(60vh, 520px);
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  overflow: hidden;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const HeaderLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
  flex-shrink: 0;
`

const IconButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const Bubble = styled.div`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ $role, theme }) =>
    $role === 'user' ? theme.colors.tealLight : theme.colors.purpleLight};
  color: ${({ $role, $error, theme }) =>
    $error
      ? theme.colors.coral
      : $role === 'user'
        ? theme.colors.tealDark
        : theme.colors.purpleDark};
  border-bottom-right-radius: ${({ $role }) => ($role === 'user' ? '4px' : undefined)};
  border-bottom-left-radius: ${({ $role }) => ($role === 'model' ? '4px' : undefined)};
`

const Typing = styled.div`
  align-self: flex-start;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-self: flex-start;
  max-width: 100%;
`

const Chip = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.purpleMid};
  color: ${({ theme }) => theme.colors.purpleDark};
  cursor: pointer;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  align-self: center;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.lg} 0;
`

const BarForm = styled.form`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.elevated};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.pill};
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  }
`

const Input = styled.input`
  flex: 1;
  font-size: 15px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  border: none;
  outline: none;

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
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const Arrow = styled.span`
  font-size: 16px;
`

export default function FloatingChat() {
  const { messages, isOpen, setIsOpen, sendMessage, isPending } = useChat()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isOpen, messages.length, isPending])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || isPending) return
    sendMessage(trimmed)
    setDraft('')
  }

  function handleChip(chip) {
    if (isPending) return
    sendMessage(chip)
  }

  const lastMessage = messages[messages.length - 1]
  const latestChips =
    lastMessage?.role === 'model' && !lastMessage.isError ? lastMessage.chips : null

  return (
    <FixedLayer>
      <Column>
        <Panel role="dialog" aria-label="Koda chat">
          <PanelHeader>
            <HeaderLabel>
              <PurpleDot />
              Koda
            </HeaderLabel>
            <IconButton
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              {'\u2715'}
            </IconButton>
          </PanelHeader>
          <Messages ref={scrollRef}>
            {!hasMessages && !isPending && (
              <EmptyState>
                Ask Koda about meals, recipes, or what to cook tonight.
              </EmptyState>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} $role={m.role} $error={m.isError}>
                {m.text}
              </Bubble>
            ))}
            {isPending && <Typing>Koda is thinking{'\u2026'}</Typing>}
            {latestChips && latestChips.length > 0 && !isPending && (
              <ChipRow>
                {latestChips.map(chip => (
                  <Chip
                    key={chip}
                    type="button"
                    onClick={() => handleChip(chip)}
                    disabled={isPending}
                  >
                    {chip}
                  </Chip>
                ))}
              </ChipRow>
            )}
          </Messages>
        </Panel>
        <BarForm onSubmit={handleSubmit}>
          <PurpleDot />
          <Input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={isPending ? 'Koda is thinking\u2026' : 'Ask Koda anything\u2026'}
            maxLength={500}
            disabled={isPending}
            aria-label="Ask Koda"
          />
          <AskButton type="submit" disabled={isPending || !draft.trim()}>
            <AskText>{isPending ? '\u2026' : 'Ask'}</AskText>
            <Arrow>{'\u2197'}</Arrow>
          </AskButton>
        </BarForm>
      </Column>
    </FixedLayer>
  )
}
