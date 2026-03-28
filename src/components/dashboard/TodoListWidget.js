'use client'

import { useState } from 'react'
import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const TodoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const Checkbox = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid ${({ $done, theme }) => $done ? theme.colors.teal : theme.colors.border};
  background: ${({ $done, theme }) => $done ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  color: white;
  font-size: 10px;
`

const TodoText = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ $done, theme }) => $done ? theme.colors.textMuted : theme.colors.textPrimary};
  text-decoration: ${({ $done }) => $done ? 'line-through' : 'none'};
`

const CategoryTag = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export default function TodoListWidget({ todos: initialTodos }) {
  const [todos, setTodos] = useState(initialTodos)

  function toggleTodo(id) {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
    )
  }

  return (
    <div>
      <SectionHeader title="To-do" />
      <List>
        {todos.map((todo) => (
          <TodoRow key={todo.id} onClick={() => toggleTodo(todo.id)}>
            <Checkbox $done={todo.done}>
              {todo.done && '\u2713'}
            </Checkbox>
            <TodoText $done={todo.done}>{todo.text}</TodoText>
            <CategoryTag>{todo.category}</CategoryTag>
          </TodoRow>
        ))}
      </List>
    </div>
  )
}
