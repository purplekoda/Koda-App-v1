'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useChat } from './ChatProvider'
import { saveChatButtonPositionAction } from '@/app/(app)/settings/actions'

// ── Layout constants ──────────────────────────────────────
const PAD = { left: 16, right: 16, top: 80, bottom: 24 }
const DRAG_THRESHOLD = 8   // px of movement before drag activates
const LONG_PRESS_MS  = 400 // ms hold to enter drag mode on mobile
const CONTEXT_MS     = 2000 // ms hold to show context menu
const SNAP_MS        = 200  // duration of snap transition
const DEFAULT_CORNER = 'bottom-right'

function getBtnSize() {
  return typeof window !== 'undefined' && window.innerWidth <= 768 ? 76 : 84
}

/** Convert a saved corner+offset back to viewport x/y. */
function cornerToPos(corner, offset = 0) {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  const vw  = window.innerWidth
  const vh  = window.innerHeight
  const btn = getBtnSize()
  const rx  = vw - PAD.right  - btn
  const by  = vh - PAD.bottom - btn
  switch (corner) {
    case 'bottom-right': return { x: rx,       y: by - offset }
    case 'bottom-left':  return { x: PAD.left,  y: by - offset }
    case 'top-right':    return { x: rx,        y: PAD.top + offset }
    case 'top-left':     return { x: PAD.left,  y: PAD.top + offset }
    default:             return { x: rx,        y: by }
  }
}

/** Snap a free position to the nearest screen edge with padding. */
function snapPos(x, y) {
  const vw   = window.innerWidth
  const vh   = window.innerHeight
  const btn  = getBtnSize()
  const maxX = vw - PAD.right  - btn
  const maxY = vh - PAD.bottom - btn

  const dLeft   = x - PAD.left
  const dRight  = maxX - x
  const dTop    = y - PAD.top
  const dBottom = maxY - y
  const minD    = Math.min(dLeft, dRight, dTop, dBottom)

  let sx = x
  let sy = y

  if      (minD === dLeft)   sx = PAD.left
  else if (minD === dRight)  sx = maxX
  else if (minD === dTop)    sy = PAD.top
  else                       sy = maxY

  // Clamp the axis that was NOT snapped
  if (minD === dLeft || minD === dRight) {
    sy = Math.max(PAD.top, Math.min(sy, maxY))
  } else {
    sx = Math.max(PAD.left, Math.min(sx, maxX))
  }

  return { x: Math.round(sx), y: Math.round(sy) }
}

/** Classify a snapped position into a corner + edge offset for storage. */
function posToCorner(x, y) {
  const vw  = window.innerWidth
  const vh  = window.innerHeight
  const btn = getBtnSize()
  const rx  = vw - PAD.right  - btn
  const by  = vh - PAD.bottom - btn

  const onLeft   = Math.abs(x - PAD.left) <= 1
  const onRight  = Math.abs(x - rx)       <= 1

  if (onLeft || onRight) {
    const side = onRight ? 'right' : 'left'
    const midY = (PAD.top + by) / 2
    if (y <= midY) return { corner: `top-${side}`,    offset: Math.round(y - PAD.top) }
    else           return { corner: `bottom-${side}`, offset: Math.round(by - y) }
  }

  // Horizontal edge — resolve to nearest vertical corner for storage
  const onTop = Math.abs(y - PAD.top) <= 1
  const row   = onTop ? 'top' : 'bottom'
  const midX  = (PAD.left + rx) / 2
  if (x <= midX) return { corner: `${row}-left`,  offset: Math.round(x - PAD.left) }
  else           return { corner: `${row}-right`, offset: Math.round(rx - x) }
}

// ── Animations ────────────────────────────────────────────
const springAnim = keyframes`
  0%   { transform: scale(1.1); }
  55%  { transform: scale(0.95); }
  100% { transform: scale(1.0); }
`

// ── Styled components ─────────────────────────────────────
const Fab = styled.button`
  position: fixed;
  width: 84px;
  height: 84px;
  border: none;
  background: none;
  padding: 0;
  z-index: 1000;
  user-select: none;
  touch-action: none;
  -webkit-user-drag: none;

  ${({ $spring }) => $spring && css`
    animation: ${springAnim} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  `}

  img {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  @media (max-width: 768px) {
    width: 76px;
    height: 76px;
  }
`

const Ghost = styled.div`
  position: fixed;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 2px dashed rgba(100, 100, 100, 0.22);
  pointer-events: none;
  z-index: 999;

  @media (max-width: 768px) {
    width: 76px;
    height: 76px;
  }
`

const ContextMenu = styled.div`
  position: fixed;
  z-index: 1002;
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.13), 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 6px;
  display: flex;
  flex-direction: column;
  min-width: 168px;
  border: 0.5px solid rgba(0, 0, 0, 0.07);
`

const ContextItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  color: #1a1a1a;

  &:hover { background: #f4f4f4; }
`

// ── Component ─────────────────────────────────────────────
export default function KodaChatButton({ initialPosition }) {
  const { isOpen, setIsOpen } = useChat()

  // Off-screen until hydration resolves the real position
  const [pos, setPos]             = useState({ x: -500, y: -500 })
  const [isDragActive, setIsDragActive] = useState(false)
  const [isSnapping, setIsSnapping]     = useState(false)
  const [isSpring, setIsSpring]         = useState(false)
  const [ghostPos, setGhostPos]         = useState(null)
  const [showMenu, setShowMenu]         = useState(false)
  const [initialized, setInitialized]   = useState(false)

  // Refs — mutable state that doesn't need re-renders
  const btnRef         = useRef(null)
  const isDragging     = useRef(false)
  const didDrag        = useRef(false)
  const justDragged    = useRef(false)    // absorb the click that follows mouseup
  const dragStart      = useRef({ mouseX: 0, mouseY: 0, btnX: 0, btnY: 0 })
  const currentDragPos = useRef({ x: 0, y: 0 }) // latest pos during drag (avoids stale closure)
  const savedPos       = useRef(null)     // for ESC cancel
  const longPressTimer = useRef(null)
  const contextTimer   = useRef(null)
  const touchIdRef     = useRef(null)

  // ── Init from saved corner ──────────────────────────────
  // Init runs once on mount — window dimensions are only available client-side.
  useEffect(() => {
    const { x, y } = cornerToPos(
      initialPosition?.corner || DEFAULT_CORNER,
      initialPosition?.offset || 0,
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({ x, y })
    currentDragPos.current = { x, y }
    setInitialized(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save position to Supabase (best-effort) ─────────────
  const savePosition = useCallback(async (corner, offset) => {
    try { await saveChatButtonPositionAction({ corner, offset }) } catch { /* silent */ }
  }, [])

  // ── Snap logic ──────────────────────────────────────────
  const performSnap = useCallback((x, y) => {
    const snapped            = snapPos(x, y)
    const { corner, offset } = posToCorner(snapped.x, snapped.y)

    setIsSnapping(true)
    setIsDragActive(false)
    setGhostPos(null)
    setPos(snapped)
    currentDragPos.current = snapped

    setTimeout(() => {
      setIsSnapping(false)
      setIsSpring(true)
      setTimeout(() => setIsSpring(false), 350)
    }, SNAP_MS)

    savePosition(corner, offset)
  }, [savePosition])

  // ── Desktop: mousemove / mouseup (attached globally while dragging) ──
  const handleMouseMove = useCallback((e) => {
    const dx = e.clientX - dragStart.current.mouseX
    const dy = e.clientY - dragStart.current.mouseY

    if (!didDrag.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      didDrag.current = true
      setIsDragActive(true)
      clearTimeout(contextTimer.current)
    }
    if (!didDrag.current) return

    const btn  = getBtnSize()
    const newX = Math.max(0, Math.min(window.innerWidth  - btn, dragStart.current.btnX + dx))
    const newY = Math.max(0, Math.min(window.innerHeight - btn, dragStart.current.btnY + dy))

    currentDragPos.current = { x: newX, y: newY }
    setPos({ x: newX, y: newY })
    setGhostPos(snapPos(newX, newY))
  }, [])

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    // mouseup was added with { once: true } — no manual removal needed
    clearTimeout(contextTimer.current)

    if (didDrag.current) {
      justDragged.current = true
      performSnap(currentDragPos.current.x, currentDragPos.current.y)
    }

    isDragging.current = false
    didDrag.current    = false
  }, [handleMouseMove, performSnap])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    if (showMenu) { setShowMenu(false); return }

    e.preventDefault() // suppress text selection
    isDragging.current = true
    didDrag.current    = false
    savedPos.current   = { ...pos }
    dragStart.current  = { mouseX: e.clientX, mouseY: e.clientY, btnX: pos.x, btnY: pos.y }
    currentDragPos.current = { x: pos.x, y: pos.y }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp, { once: true })

    contextTimer.current = setTimeout(() => {
      if (!didDrag.current) {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        isDragging.current = false
        setShowMenu(true)
      }
    }, CONTEXT_MS)
  }, [pos, showMenu, handleMouseMove, handleMouseUp])

  // ── Mobile: touch events ─────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (showMenu) { setShowMenu(false); return }
    if (e.touches.length !== 1) return

    const touch         = e.touches[0]
    touchIdRef.current  = touch.identifier
    didDrag.current     = false
    savedPos.current    = { ...pos }
    dragStart.current   = { mouseX: touch.clientX, mouseY: touch.clientY, btnX: pos.x, btnY: pos.y }
    currentDragPos.current = { x: pos.x, y: pos.y }

    // Long-press (400 ms) → activate drag mode
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      if (!didDrag.current) {
        isDragging.current = true
        setIsDragActive(true)
      }
    }, LONG_PRESS_MS)

    // Very long press (2 s) → context menu
    contextTimer.current = setTimeout(() => {
      clearTimeout(longPressTimer.current)
      if (!isDragging.current && !didDrag.current) {
        setShowMenu(true)
      }
    }, CONTEXT_MS)
  }, [pos, showMenu])

  const handleTouchMove = useCallback((e) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
    if (!touch) return

    const dx = touch.clientX - dragStart.current.mouseX
    const dy = touch.clientY - dragStart.current.mouseY

    // Significant movement before long-press fires → cancel timers (plain scroll)
    if (!isDragging.current) {
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        clearTimeout(longPressTimer.current)
        clearTimeout(contextTimer.current)
      }
      return
    }

    e.preventDefault() // prevent page scroll while dragging
    didDrag.current = true

    const btn  = getBtnSize()
    const newX = Math.max(0, Math.min(window.innerWidth  - btn, dragStart.current.btnX + dx))
    const newY = Math.max(0, Math.min(window.innerHeight - btn, dragStart.current.btnY + dy))

    currentDragPos.current = { x: newX, y: newY }
    setPos({ x: newX, y: newY })
    setGhostPos(snapPos(newX, newY))
  }, [])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
    clearTimeout(contextTimer.current)

    if (isDragging.current && didDrag.current) {
      justDragged.current = true
      performSnap(currentDragPos.current.x, currentDragPos.current.y)
    }

    isDragging.current = false
    didDrag.current    = false
    touchIdRef.current = null
  }, [performSnap])

  // ── Click: only open chat when it was a real tap ─────────
  const handleClick = useCallback(() => {
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    if (!showMenu) setIsOpen(true)
  }, [showMenu, setIsOpen])

  // ── Keyboard accessibility ────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // ESC during drag: cancel and return to saved position
    if (e.key === 'Escape' && isDragActive) {
      setIsDragActive(false)
      isDragging.current = false
      didDrag.current    = false
      // Remove any lingering drag listeners (mouseup may still be pending)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (savedPos.current) {
        setPos(savedPos.current)
        currentDragPos.current = savedPos.current
      }
      return
    }

    // Arrow keys nudge position
    const NUDGE = 10
    let dx = 0, dy = 0
    if (e.key === 'ArrowLeft')  dx = -NUDGE
    if (e.key === 'ArrowRight') dx =  NUDGE
    if (e.key === 'ArrowUp')    dy = -NUDGE
    if (e.key === 'ArrowDown')  dy =  NUDGE
    if (dx === 0 && dy === 0) return

    e.preventDefault()
    setPos(prev => {
      const btn  = getBtnSize()
      const next = {
        x: Math.max(0, Math.min(window.innerWidth  - btn, prev.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - btn, prev.y + dy)),
      }
      currentDragPos.current = next
      return next
    })
  }, [isDragActive, handleMouseMove, handleMouseUp])

  const handleKeyUp = useCallback((e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      performSnap(currentDragPos.current.x, currentDragPos.current.y)
    }
  }, [performSnap])

  // ── Reset button to default corner ───────────────────────
  const handleReset = useCallback(() => {
    setShowMenu(false)
    const defaultPos = cornerToPos(DEFAULT_CORNER, 0)
    setIsSnapping(true)
    setPos(defaultPos)
    currentDragPos.current = defaultPos
    setTimeout(() => {
      setIsSnapping(false)
      setIsSpring(true)
      setTimeout(() => setIsSpring(false), 350)
    }, SNAP_MS)
    savePosition(DEFAULT_CORNER, 0)
  }, [savePosition])

  // ── Dismiss context menu on outside pointer ──────────────
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showMenu])

  if (isOpen || !initialized) return null

  // Position the context menu above (or below if near top) the button
  const btn     = getBtnSize()
  const menuW   = 168
  const menuH   = 96
  const menuX   = Math.max(8, Math.min(window.innerWidth - menuW - 8, pos.x + btn / 2 - menuW / 2))
  const menuY   = pos.y - menuH - 8 > 0 ? pos.y - menuH - 8 : pos.y + btn + 8

  // Inline styles computed fresh each render (avoids stale closures)
  const fabStyle = {
    left: pos.x,
    top:  pos.y,
    transform: isDragActive ? 'scale(1.1)' : undefined,
    opacity:   isDragActive ? 0.9 : undefined,
    transition: isSnapping
      ? `left ${SNAP_MS}ms cubic-bezier(0.34,1.56,0.64,1), top ${SNAP_MS}ms cubic-bezier(0.34,1.56,0.64,1), transform 0.15s ease`
      : isDragActive
        ? 'transform 0.1s ease, opacity 0.1s ease'
        : 'transform 0.2s ease',
    cursor: isDragActive ? 'grabbing' : 'pointer',
  }

  return (
    <>
      {/* Ghost: predicted snap destination while dragging */}
      {isDragActive && ghostPos && (
        <Ghost
          style={{ left: ghostPos.x, top: ghostPos.y }}
          aria-hidden="true"
        />
      )}

      {/* Context menu (long-press) */}
      {showMenu && (
        <ContextMenu style={{ left: menuX, top: menuY }} role="menu" aria-label="Chat button options">
          <ContextItem
            role="menuitem"
            onClick={() => {
              setShowMenu(false)
              // Activating drag mode from menu — user can now drag via keyboard arrows
              savedPos.current = { ...pos }
              setIsDragActive(true)
              btnRef.current?.focus()
            }}
          >
            Move button
          </ContextItem>
          <ContextItem role="menuitem" onClick={handleReset}>
            Reset to corner
          </ContextItem>
        </ContextMenu>
      )}

      <Fab
        ref={btnRef}
        $spring={isSpring && !isDragActive}
        style={fabStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        aria-label="Open Koda chat"
        aria-haspopup="false"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/chat-button-64.png"
          srcSet="/chat-button-56.png 56w, /chat-button-64.png 64w, /chat-button-80.png 80w, /chat-button-120.png 120w"
          sizes="(max-width: 768px) 56px, 64px"
          alt="Koda"
          draggable="false"
        />
      </Fab>
    </>
  )
}
