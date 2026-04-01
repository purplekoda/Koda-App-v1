'use client'

import { useState } from 'react'
import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $color, theme }) => theme.colors[$color] || theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CountBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $color, theme }) => theme.colors[$color] || theme.colors.grayLight};
  color: ${({ $textColor, theme }) => theme.colors[$textColor] || theme.colors.textSecondary};
  font-weight: 600;
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const Checkbox = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid ${({ $checked, $color, theme }) =>
    $checked ? theme.colors[$color] || theme.colors.teal : theme.colors.border};
  background: ${({ $checked, $color, theme }) =>
    $checked ? theme.colors[$color] || theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 12px;
  transition: all 0.15s ease;
`

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ $checked, theme }) => $checked ? theme.colors.textMuted : theme.colors.textPrimary};
  text-decoration: ${({ $checked }) => $checked ? 'line-through' : 'none'};
`

const ItemCategory = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const ItemMeal = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const RescanButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

export default function StepPantryCheck({ items, onUpdateItems }) {
  const [localItems, setLocalItems] = useState(items)

  const needItems = localItems.filter(i => i.status === 'need')
  const lowItems = localItems.filter(i => i.status === 'low')
  const haveItems = localItems.filter(i => i.status === 'have')

  function toggleItem(id) {
    setLocalItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (item.status === 'need') return { ...item, status: 'have' }
      if (item.status === 'have') return { ...item, status: 'need' }
      if (item.status === 'low') return { ...item, status: 'have' }
      return item
    }))
  }

  function renderSection(title, sectionItems, color, textColor, checkColor) {
    if (sectionItems.length === 0) return null
    return (
      <>
        <SectionTitle $color={textColor}>
          {title}
          <CountBadge $color={color} $textColor={textColor}>{sectionItems.length}</CountBadge>
        </SectionTitle>
        <ItemList>
          {sectionItems.map(item => (
            <ItemRow key={item.id} onClick={() => toggleItem(item.id)}>
              <Checkbox
                $checked={item.status === 'have'}
                $color={checkColor}
              >
                {item.status === 'have' && '\u2713'}
              </Checkbox>
              <ItemName $checked={item.status === 'have'}>{item.name}</ItemName>
              <ItemCategory>{item.category}</ItemCategory>
              <ItemMeal>{item.meal}</ItemMeal>
            </ItemRow>
          ))}
        </ItemList>
      </>
    )
  }

  return (
    <Card>
      {renderSection('Need to buy', needItems, 'coralLight', 'coral', 'coral')}
      {needItems.length > 0 && lowItems.length > 0 && (
        <div style={{ height: 16 }} />
      )}
      {renderSection('Running low', lowItems, 'amberLight', 'amber', 'amber')}
      {(needItems.length > 0 || lowItems.length > 0) && haveItems.length > 0 && (
        <div style={{ height: 16 }} />
      )}
      {renderSection('Already have', haveItems, 'tealLight', 'teal', 'teal')}

      <RescanButton>
        {'\uD83D\uDCF7'} Rescan pantry
      </RescanButton>
    </Card>
  )
}
