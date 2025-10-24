import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from '@blocknote/core';
import { InlineMath } from '@/app/components/product components/InlineMath';
import { LegacyMathSymbol } from '@/app/components/product components/LegacyMathSymbol';

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

// Get menu items for inserting math
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
              latex: '',
            },
          },
        ]);
        // Auto-focus the newly inserted math field
        setTimeout(() => {
          const mathField = document.querySelector('math-field:not([readonly])') as any;
          if (mathField) {
            mathField.focus();
            mathField.executeCommand('moveToMathfieldEnd');
          }
        }, 50);
      },
      aliases: ['math', 'latex', 'equation', 'formula', 'mathlive'],
      group: 'Math',
      icon: '𝑥',
      subtext: 'Insert inline math equation with live rendering',
    },
  ];
}

