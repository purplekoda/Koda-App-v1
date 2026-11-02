import { describe, it, expect } from 'vitest'
import { useEffect, useRef, useState } from 'react'
import { renderHook, act } from '@testing-library/react'

// Mirrors the resync-gating pattern used in MealsPageClient:
//
//   const lastSyncedRef = useRef(initialMeals)
//   useEffect(() => {
//     if (hasOpenGridEdit) return
//     if (initialMeals === lastSyncedRef.current) return
//     lastSyncedRef.current = initialMeals
//     setMeals(initialMeals)
//   }, [initialMeals, hasOpenGridEdit])
//
// A full render of MealsPageClient would require mocking every action and
// child modal. These tests pin the exact useEffect contract that keeps a
// chat-driven router.refresh from clobbering an in-progress grid edit or
// snapping a just-saved optimistic change back to stale server props.
function useGatedResync(initialMeals, hasOpenGridEdit) {
  const [meals, setMeals] = useState(initialMeals)
  const lastSyncedRef = useRef(initialMeals)
  useEffect(() => {
    if (hasOpenGridEdit) return
    if (initialMeals === lastSyncedRef.current) return
    lastSyncedRef.current = initialMeals
    setMeals(initialMeals)
  }, [initialMeals, hasOpenGridEdit])
  return [meals, setMeals]
}

describe('MealsPageClient resync gating', () => {
  it('syncs local meals when server initialMeals change and no edit is open', () => {
    const first = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'A' }] }]
    const second = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'B' }] }]
    const { result, rerender } = renderHook(
      ({ initial, open }) => useGatedResync(initial, open),
      { initialProps: { initial: first, open: false } },
    )
    expect(result.current[0][0].meals[0].name).toBe('A')
    rerender({ initial: second, open: false })
    expect(result.current[0][0].meals[0].name).toBe('B')
  })

  it('does NOT overwrite local meals while a grid edit is open', () => {
    const first = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'A' }] }]
    const second = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'B' }] }]
    const { result, rerender } = renderHook(
      ({ initial, open }) => useGatedResync(initial, open),
      { initialProps: { initial: first, open: true } },
    )
    rerender({ initial: second, open: true })
    expect(result.current[0][0].meals[0].name).toBe('A')
  })

  it('picks up the latest server initialMeals when the edit closes', () => {
    const first = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'A' }] }]
    const second = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'B' }] }]
    const { result, rerender } = renderHook(
      ({ initial, open }) => useGatedResync(initial, open),
      { initialProps: { initial: first, open: false } },
    )
    rerender({ initial: first, open: true })
    rerender({ initial: second, open: true })
    expect(result.current[0][0].meals[0].name).toBe('A')
    act(() => { rerender({ initial: second, open: false }) })
    expect(result.current[0][0].meals[0].name).toBe('B')
  })

  it('keeps an optimistic local edit when a modal closes without new server props', () => {
    const first = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'A' }] }]
    const optimistic = [{ day: 'Mon', meals: [{ type: 'dinner', name: 'Optimistic' }] }]
    const { result, rerender } = renderHook(
      ({ initial, open }) => useGatedResync(initial, open),
      { initialProps: { initial: first, open: true } },
    )
    // User commits an optimistic change inside the open modal.
    act(() => { result.current[1](optimistic) })
    expect(result.current[0][0].meals[0].name).toBe('Optimistic')
    // Modal closes; initialMeals prop is unchanged (identical reference).
    act(() => { rerender({ initial: first, open: false }) })
    // The ref says we've already synced `first`, so the local optimistic
    // state is preserved rather than snapping back to 'A'.
    expect(result.current[0][0].meals[0].name).toBe('Optimistic')
  })
})
