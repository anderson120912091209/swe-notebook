'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MathSuggestPopover, { SuggestItem } from './MathSuggestPopover';
import { getGreekSuggestions } from '@/app/lib/math-dsl/suggestions';
import { getGreekSymbol } from '@/app/lib/math-dsl/utils';

type UseMathSuggestOptions = {
  editor: any; // BlockNote editor instance
  enabled?: boolean;
};

export function useMathSuggest({ editor, enabled = true }: UseMathSuggestOptions) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  const updateFromSelection = useCallback(() => {
    if (!enabled) { setOpen(false); return; }
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed) { setOpen(false); return; }

    const range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range) return;

    // Get current text node and token
    const node = range.startContainer;
    const text = node.textContent || '';
    const cursor = range.startOffset;

    // Find current token (letters only)
    let start = cursor; let end = cursor;
    while (start > 0 && /[a-zA-Z]/.test(text[start - 1] || '')) start--;
    while (end < text.length && /[a-zA-Z]/.test(text[end] || '')) end++;
    const token = text.slice(start, end);
    if (!token) { setOpen(false); return; }

    const sugg = getGreekSuggestions(token).map((s, idx) => ({
      id: `${s.keyword}-${idx}`,
      label: s.keyword.split('(')[0],
      glyph: getGreekSymbol(s.keyword),
    }));

    if (sugg.length === 0) { setOpen(false); return; }

    setItems(sugg);
    setActiveIndex(0);
    setOpen(true);

    // Compute caret rect
    const rects = range.getClientRects();
    const lastRect = rects[rects.length - 1];
    if (lastRect) setAnchor(lastRect);
  }, [enabled]);

  // Listeners
  useEffect(() => {
    if (!enabled) return;
    const onKeyUp = (e: KeyboardEvent) => {
      const metaKeys = e.ctrlKey || e.metaKey || e.altKey;
      if (metaKeys) return;
      updateFromSelection();
    };
    const onSelection = () => updateFromSelection();
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelection);
    return () => {
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelection);
    };
  }, [enabled, updateFromSelection]);

  const accept = useCallback((index: number) => {
    const pick = items[index];
    if (!pick) return;

    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) {
      setOpen(false);
      return;
    }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const text = node.textContent || '';
    const cursor = range.startOffset;

    // Find current token bounds (letters only)
    let start = cursor; let end = cursor;
    while (start > 0 && /[a-zA-Z]/.test(text[start - 1] || '')) start--;
    while (end < text.length && /[a-zA-Z]/.test(text[end] || '')) end++;

    // Select the token range so BlockNote replaces it upon insert
    try {
      const tokenRange = document.createRange();
      tokenRange.setStart(node, start);
      tokenRange.setEnd(node, end);
      // Remove the token from DOM so insertion is clean
      tokenRange.deleteContents();
      // Place caret at the delete start
      const collapseRange = document.createRange();
      collapseRange.setStart(node, start);
      collapseRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(collapseRange);
    } catch {
      // If range ops fail, continue and let editor insert at current caret
    }

    // Insert the inline node at caret
    editor.insertInlineContent([
      { type: 'mathSymbol', props: { token: pick.label, unicode: pick.glyph } },
    ]);

    setOpen(false);
  }, [items, editor]);

  // Keyboard handling while popover open
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(activeIndex); }
      else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, items, activeIndex, accept]);

  const Popover = useMemo(() => (
    <MathSuggestPopover open={open} anchor={anchor} items={items} activeIndex={activeIndex} onPick={accept} />
  ), [open, anchor, items, activeIndex, accept]);

  return { open, Popover } as const;
}


