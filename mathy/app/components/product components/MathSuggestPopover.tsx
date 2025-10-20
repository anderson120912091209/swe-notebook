'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

export type SuggestItem = {
  id: string;
  label: string; // e.g., alpha
  glyph: string; // e.g., α
};

type MathSuggestPopoverProps = {
  open: boolean;
  anchor: DOMRect | null;
  items: SuggestItem[];
  activeIndex: number;
  onPick: (index: number) => void;
};

const MathSuggestPopover: React.FC<MathSuggestPopoverProps> = ({ open, anchor, items, activeIndex, onPick }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const { theme } = useTheme();

  // Compute a comfortable position near the caret:
  // Always place BELOW the current line so it never occludes text above.
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Default desired position: below the caret line, aligned to caret left
    let desiredLeft = Math.round(anchor.left);
    let desiredTop = Math.round(anchor.bottom + pad);

    // Measure popover size after mount
    const el = ref.current;
    const width = el?.offsetWidth ?? 200;
    const height = el?.offsetHeight ?? (12 + Math.min(items.length, 8) * 28);

    // If overflow right, shift left but stay near caret
    if (desiredLeft + width > vw - 12) {
      desiredLeft = Math.max(12, Math.round(vw - width - 12));
    }
    if (desiredLeft < 12) desiredLeft = 12;

    // Clamp vertically to viewport bottom (always below line)
    if (desiredTop + height > vh - 12) {
      desiredTop = Math.max(12, vh - height - 12);
    }

    setPos({ top: desiredTop, left: desiredLeft });
  }, [open, anchor, items.length]);

  useEffect(() => {
    if (!open) return;
    const preventScroll = (e: WheelEvent) => e.stopPropagation();
    document.addEventListener('wheel', preventScroll, { passive: true });
    return () => document.removeEventListener('wheel', preventScroll);
  }, [open]);

  if (!open || !anchor) return null;

  const isDark = theme === 'dark';

  return (
    <div
      ref={ref}
      role="listbox"
      aria-activedescendant={`math-suggest-${activeIndex}`}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 10000,
        // Container visuals tuned for each theme
        background: isDark ? 'rgba(52,54,58,0.10)' : '#ffffff',
        color: isDark ? 'var(--popover-fg, #F9FAFB)' : 'var(--foreground, #111111)',
        border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 8,
        padding: 8,
        minWidth: 180,
        fontSize: 13,
        boxShadow: isDark
          ? '0 10px 20px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.22)'
          : '0 10px 18px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        backdropFilter: isDark ? 'saturate(140%) blur(8px)' : undefined,
        WebkitBackdropFilter: isDark ? 'saturate(140%) blur(8px)' : undefined,
        willChange: 'transform, top, left',
        transform: 'translateZ(0)',
        contain: 'layout paint style',
        display: 'flex',
        flexDirection: 'column',
        gap: 6, // little gap between item rectangles
      }}
    >
      {items.map((it, i) => (
        <div
          id={`math-suggest-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          key={it.id}
          onMouseDown={(e) => { e.preventDefault(); onPick(i); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 10px',
            borderRadius: 6,
            background: isDark
              ? (i === activeIndex ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)')
              : (i === activeIndex ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)'),
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transition: 'background 120ms ease-out',
          }}
        >
          <span style={{ fontSize: 16, width: 18 }}>{it.glyph}</span>
          <span style={{ opacity: 0.95 }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MathSuggestPopover;


