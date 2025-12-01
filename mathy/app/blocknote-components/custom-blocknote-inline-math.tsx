import { DefaultReactSuggestionItem } from "@blocknote/react";
import { getInlineMathMenuItem } from "@/app/lib/blocknote-schema";

/**
 * Creates a menu item for inserting inline math in BlockNote suggestion menus
 * 
 * Usage:
 * 1. For $ trigger menu: Use getMathMenuItems() from blocknote-schema.ts
 * 2. For / slash menu: Use getSlashMenuItems() from blocknote-schema.ts
 * 3. Or use this function directly to create a custom menu item
 * 
 * Note: This function is a wrapper around getInlineMathMenuItem from blocknote-schema.ts
 * Use that function directly for better type safety and consistency.
 * 
 * @param editor - The BlockNote editor instance
 * @returns A suggestion menu item that inserts inline math
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createInlineMathMenuItem(editor: any): DefaultReactSuggestionItem {
  return getInlineMathMenuItem(editor);
}

// Default export for backward compatibility
const CustomBlockNoteInlineMath = createInlineMathMenuItem;
export default CustomBlockNoteInlineMath;