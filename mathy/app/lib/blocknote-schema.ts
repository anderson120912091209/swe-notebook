import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from '@blocknote/core';
import { InlineMath } from '@/app/components/product components/InlineMath';
import { LegacyMathSymbol } from '@/app/components/product components/LegacyMathSymbol';
import { getDefaultReactSlashMenuItems, DefaultReactSuggestionItem } from '@blocknote/react';
import React from 'react';

// Create a custom schema that includes the inline math content
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineMath: InlineMath,
    mathSymbol: LegacyMathSymbol, // Backward compatibility
  },
});

// Get menu items for inserting math (used with $ trigger)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMathMenuItems(editor: any) {
  return [
    {
      title: 'Inline Math',
      onItemClick: () => {
        editor.insertInlineContent([
          {
            type: 'inlineMath',
            props: {
              latex: ' ',
            },
          },
        ]);
      },
      aliases: ['math', 'latex', 'equation', 'formula', 'mathlive'],
      group: 'Math',
      icon: '𝑥',
      subtext: 'Insert inline math equation with live rendering',
    },
  ];
}

// Get custom inline math menu item (can be used in slash menu or other suggestion menus)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getInlineMathMenuItem(editor: any): DefaultReactSuggestionItem {
  return {
    title: 'Inline Math',
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: 'inlineMath',
          props: {
            latex: ' ',
          },
        },
      ]);
    },
    aliases: ['math', 'latex', 'equation', 'formula', 'mathlive', 'inline math'],
    group: 'Math',
    icon: React.createElement('span', null, '𝑥'),
    subtext: 'Insert inline math equation with live rendering',
  };
}

// Get slash menu items with inline math included
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSlashMenuItems(editor: any): DefaultReactSuggestionItem[] {
  const defaultItems = getDefaultReactSlashMenuItems(editor);
  const inlineMathItem = getInlineMathMenuItem(editor);
  
  // Add inline math to the default slash menu items
  return [...defaultItems, inlineMathItem];
}

