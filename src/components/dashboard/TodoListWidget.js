'use client'

import { useState } from 'react'
import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const Wrapper = styled.div``

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  letter-spacing: 0.03em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:first-of-type {
    margin-top: 0;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const TodoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`

const Checkbox = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid ${({ $done, theme }) => $done ? theme.colors.teal : theme.colors.border};
  background: ${({ $done, theme }) => $done ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  color: white;
  font-size: 12px;
`

const TodoText = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ $done, theme }) => $done ? theme.colors.textMuted : theme.colors.textPrimary};
  text-decoration: ${({ $done }) => $done ? 'line-through' : 'none'};
`

const categoryColors = {
  bday: '#D85A30',
  meals: '#1D9E75',
  Thu: '#D85A30',
  Fri: '#7F77DD',
}

const CategoryTag = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $category }) => {
    const color = categoryColors[$category]
    return color ? color + '18' : '#F1EFE8'
  }};
  color: ${({ $category, theme }) => {
    const color = categoryColors[$category]
    return color || theme.colors.textSecondary
  }};
  font-weight: 500;
`

const AddTask = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const PlusIcon = styled.span`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`

export default function TodoListWidget({ todos: initialTodos }) {
  const [todos, setTodos] = useState(initialTodos)

  const todayTodos = todos.filter(t => t.section === 'today')
  const upcomingTodos = todos.filter(t => t.section === 'upcoming')

  function toggleTodo(id) {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
    )
  }

  return (
    <Wrapper>
      <SectionHeader title="To do" linkText="All" linkHref="#" />

      <SectionLabel>TODAY</SectionLabel>
      <List>
        {todayTodos.map((todo) => (
          <TodoRow key={todo.id} onClick={() => toggleTodo(todo.id)}>
            <Checkbox $done={todo.done}>
              {todo.done && '\u2713'}
            </Checkbox>
            <TodoText $done={todo.done}>{todo.text}</TodoText>
            <CategoryTag $category={todo.category}>{todo.category}</CategoryTag>
          </TodoRow>
        ))}
      </List>

      <SectionLabel>UPCOMING</SectionLabel>
      <List>
        {upcomingTodos.map((todo) => (
          <TodoRow key={todo.id} onClick={() => toggleTodo(todo.id)}>
            <Checkbox $done={todo.done}>
              {todo.done && '\u2713'}
            </Checkbox>
            <TodoText $done={todo.done}>{todo.text}</TodoText>
            <CategoryTag $category={todo.category}>{todo.category}</CategoryTag>
          </TodoRow>
        ))}
      </List>

      <AddTask>
        <PlusIcon>+</PlusIcon>
        Add task...
      </AddTask>
    </Wrapper>
  )
}
