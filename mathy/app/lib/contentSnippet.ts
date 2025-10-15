/**
 * Content Snippet Extraction Utility
 * Extracts readable text from BlockNote JSON content for page card previews
 */

interface BlockNoteBlock {
  id: string;
  type: string;
  props?: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: string;
    level?: number;
  };
  content?: Array<{
    type: string;
    text?: string;
    styles?: Record<string, boolean>;
    href?: string;
  }>;
  children?: BlockNoteBlock[];
}

/**
 * Extract text content from a BlockNote block
 */
function extractTextFromBlock(block: BlockNoteBlock): string {
  if (!block.content || !Array.isArray(block.content)) {
    return '';
  }

  return block.content
    .map(item => {
      if (item.type === 'text' && item.text) {
        return item.text;
      }
      return '';
    })
    .join('')
    .trim();
}

/**
 * Extract snippet from BlockNote content
 * Returns first 2-3 blocks of readable content, max 200 characters
 */
export function extractSnippet(content: unknown): string {
  if (!content || typeof content !== 'object' || !('blocks' in content) || !Array.isArray((content as { blocks: unknown }).blocks)) {
    return 'No content yet...';
  }

  const blocks = (content as { blocks: BlockNoteBlock[] }).blocks;
  const maxBlocks = 3;
  const maxLength = 200;
  
  let snippet = '';
  let blockCount = 0;

  for (const block of blocks) {
    if (blockCount >= maxBlocks) break;
    
    // Skip empty blocks
    if (!block.content || block.content.length === 0) {
      continue;
    }

    const blockText = extractTextFromBlock(block);
    if (!blockText) continue;

    // Handle different block types
    switch (block.type) {
      case 'paragraph':
        snippet += blockText;
        break;
      case 'heading':
        // Add heading indicator
        snippet += `# ${blockText}`;
        break;
      case 'bulletListItem':
      case 'numberedListItem':
        snippet += `• ${blockText}`;
        break;
      case 'table':
        snippet += '📊 Table';
        break;
      case 'math':
        snippet += '📐 Math';
        break;
      case 'image':
        snippet += '🖼️ Image';
        break;
      default:
        snippet += blockText;
    }

    blockCount++;
    
    // Add spacing between blocks
    if (blockCount < maxBlocks && snippet.length < maxLength) {
      snippet += ' ';
    }

    // Check if we've reached the character limit
    if (snippet.length >= maxLength) {
      snippet = snippet.substring(0, maxLength).trim();
      break;
    }
  }

  // Clean up and format
  snippet = snippet.trim();
  
  if (!snippet) {
    return 'No content yet...';
  }

  // Add ellipsis if truncated
  if (snippet.length >= maxLength) {
    snippet = snippet.substring(0, maxLength - 3) + '...';
  }

  return snippet;
}

/**
 * Get a preview of the content type (for icons or indicators)
 */
export function getContentTypePreview(content: unknown): string {
  if (!content || typeof content !== 'object' || !('blocks' in content) || !Array.isArray((content as { blocks: unknown }).blocks)) {
    return '📝';
  }

  const blocks = (content as { blocks: BlockNoteBlock[] }).blocks;
  
  for (const block of blocks) {
    switch (block.type) {
      case 'math':
        return '📐';
      case 'table':
        return '📊';
      case 'image':
        return '🖼️';
      case 'heading':
        return '📋';
      default:
        continue;
    }
  }
  
  return '📝';
}
