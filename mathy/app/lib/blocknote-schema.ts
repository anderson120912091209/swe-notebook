import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from '@blocknote/core';
import { InlineMath } from '@/app/components/product components/InlineMath';
import { InlineMathSymbol } from '@/app/components/product components/InlineMathSymbol';

// Create a custom schema that includes the inline math content
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineMath: InlineMath,
    mathSymbol: InlineMathSymbol,
  },
});

// Get menu items for inserting math
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
      },
      aliases: ['math', 'latex', 'equation', 'formula'],
      group: 'Math',
      icon: '𝑥',
      subtext: 'Insert inline math equation',
    },
  ];
}

// Small helper to mount keystroke suggestions externally
export function mountMathSuggest(editor: any, enableMathSuggest: boolean) {
  // The hook lives in a client component; this function is a placeholder
  // to clarify the initialization site in app code.
  return { editor, enableMathSuggest };
}

