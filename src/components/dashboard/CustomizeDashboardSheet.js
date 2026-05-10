'use client';

import { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { SECTION_DEFS } from '@/data/dashboard-sections';

/* ── Overlay & Sheet ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Sheet = styled.div`
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  animation: slideUp 0.25s ease;

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.xl};
    margin-bottom: ${({ theme }) => theme.spacing.xxl};
    max-height: 70vh;
  }
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

/* ── Section row ── */

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  min-height: ${({ theme }) => theme.touchTarget};
  user-select: none;
  background: ${({ $dragging, theme }) => ($dragging ? theme.colors.tealLight : 'transparent')};
  border-radius: ${({ $dragging, theme }) => ($dragging ? theme.radii.md : '0')};
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }
`;

const SectionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SectionLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: block;
`;

const SectionDesc = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* ── Toggle switch ── */

const ToggleTrack = styled.button`
  width: 44px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: none;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s ease;
  flex-shrink: 0;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const ToggleKnob = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: ${({ $on }) => ($on ? '22px' : '2px')};
  transition: left 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
`;

/* ── Drag handle ── */

const DragHandle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: grab;
  padding: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`;

const DragLine = styled.div`
  width: 16px;
  height: 2px;
  background: ${({ theme }) => theme.colors.grayMid};
  border-radius: 1px;
`;

const AlwaysOnLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
`;

function getSectionDef(sectionId) {
  return (
    SECTION_DEFS.find((d) => d.section_id === sectionId) || { label: sectionId, description: '' }
  );
}

export default function CustomizeDashboardSheet({ sections, onClose, onUpdate }) {
  const [items, setItems] = useState(() =>
    [...sections].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [dragIdx, setDragIdx] = useState(null);
  const dragOverIdx = useRef(null);

  const handleToggle = useCallback(
    (sectionId) => {
      setItems((prev) => {
        const next = prev.map((s) =>
          s.section_id === sectionId ? { ...s, is_visible: !s.is_visible } : s,
        );
        onUpdate(next.map((s, i) => ({ ...s, sort_order: i })));
        return next;
      });
    },
    [onUpdate],
  );

  /* ── Pointer-based drag and drop ── */

  const handleDragStart = useCallback(
    (e, idx) => {
      e.preventDefault();
      setDragIdx(idx);

      const handleMove = (moveEvent) => {
        const y = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
        const rows = document.querySelectorAll('[data-section-row]');
        for (let i = 0; i < rows.length; i++) {
          const rect = rows[i].getBoundingClientRect();
          if (y >= rect.top && y <= rect.bottom) {
            dragOverIdx.current = i;
            break;
          }
        }
      };

      const handleEnd = () => {
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleEnd);

        setDragIdx((prev) => {
          if (prev === null || dragOverIdx.current === null || prev === dragOverIdx.current) {
            return null;
          }

          setItems((prevItems) => {
            const next = [...prevItems];
            const [moved] = next.splice(prev, 1);
            next.splice(dragOverIdx.current, 0, moved);
            const reordered = next.map((s, i) => ({ ...s, sort_order: i }));
            onUpdate(reordered);
            return reordered;
          });

          return null;
        });
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleEnd);
    },
    [onUpdate],
  );

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <Handle />
        <Title>Customize your dashboard</Title>

        {items.map((section, idx) => {
          const def = getSectionDef(section.section_id);
          const canHide = def.canHide !== false;

          return (
            <SectionRow key={section.section_id} data-section-row $dragging={dragIdx === idx}>
              {canHide ? (
                <ToggleTrack
                  $on={section.is_visible}
                  onClick={() => handleToggle(section.section_id)}
                  aria-label={`Toggle ${def.label}`}
                >
                  <ToggleKnob $on={section.is_visible} />
                </ToggleTrack>
              ) : (
                <AlwaysOnLabel>Always on</AlwaysOnLabel>
              )}

              <SectionInfo>
                <SectionLabel>{def.label}</SectionLabel>
                <SectionDesc>{def.description}</SectionDesc>
              </SectionInfo>

              <DragHandle
                onPointerDown={(e) => handleDragStart(e, idx)}
                aria-label={`Reorder ${def.label}`}
              >
                <DragLine />
                <DragLine />
                <DragLine />
              </DragHandle>
            </SectionRow>
          );
        })}
      </Sheet>
    </Overlay>
  );
}
