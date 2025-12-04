'use client';

import React, { useMemo, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema } from '@/app/lib/blocknote-schema';
import { useTheme } from '@/app/contexts/ThemeContext';

interface PageCardPreviewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any;
}

// Error Boundary to catch BlockNote initialization errors
class BlockNoteErrorBoundary extends Component<
    { children: ReactNode; fallback: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode; fallback: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('BlockNote Error Boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// Helper function to deeply validate blocks structure
// BlockNote blocks must have: id (string), type (string), and valid nested structures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateBlock(block: any, depth = 0): boolean {
    // Prevent infinite recursion
    if (depth > 10) return false;
    
    if (!block || typeof block !== 'object') return false;
    if (typeof block.id !== 'string' || block.id.length === 0) return false;
    if (typeof block.type !== 'string' || block.type.length === 0) return false;
    
    // Validate props if present (should be object or undefined)
    if (block.props !== undefined && typeof block.props !== 'object') return false;
    
    // Validate content if present (should be array or undefined)
    if (block.content !== undefined && !Array.isArray(block.content)) return false;
    
    // Recursively validate children if present
    if (block.children !== undefined) {
        if (!Array.isArray(block.children)) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!block.children.every((child: any) => validateBlock(child, depth + 1))) return false;
    }
    
    return true;
}

// Helper function to validate blocks structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateBlocks(blocks: any): boolean {
    if (!Array.isArray(blocks)) return false;
    if (blocks.length === 0) return false;
    
    // Validate each block deeply
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return blocks.every((block: any) => validateBlock(block));
}

// Helper function to sanitize and validate blocks before passing to BlockNote
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeBlocks(content: any): any[] | undefined {
    if (!content) return undefined;
    
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let blocks: any = undefined;
        
        // Extract blocks from different possible formats
        if (content.blocks && Array.isArray(content.blocks)) {
            blocks = content.blocks.length > 0 ? content.blocks : undefined;
        } else if (Array.isArray(content)) {
            blocks = content.length > 0 ? content : undefined;
        }
        
        // Deeply validate blocks structure - if invalid, return undefined to use default
        if (blocks && !validateBlocks(blocks)) {
            console.warn('Invalid blocks structure detected, using default content', {
                blocksCount: blocks.length,
                sampleBlock: blocks[0],
            });
            return undefined;
        }
        
        return blocks;
    } catch (error) {
        console.error('Error parsing content for preview:', error);
        return undefined;
    }
}

// Inner component that uses the hook - wrapped in error boundary
function PageCardPreviewInner({ content }: PageCardPreviewProps) {
    const { theme } = useTheme();
    const [hasError, setHasError] = useState(false);

    // Sanitize and validate initial content - this runs before the hook
    const initialContent = useMemo(() => {
        return sanitizeBlocks(content);
    }, [content]);

    // CRITICAL: Hooks must be called unconditionally at the top level
    // We validate blocks BEFORE passing to the hook, so if invalid, pass undefined
    // BlockNote will create default empty content if initialContent is undefined
    const editor = useCreateBlockNote({
        schema: customSchema,
        initialContent: initialContent, // Will be undefined if invalid - safe for BlockNote
    });

    // Update editor content when initialContent changes
    useEffect(() => {
        if (!editor) return;
        
        // Only update if we have valid content
        if (initialContent && validateBlocks(initialContent)) {
            try {
                // Replace all blocks with new content when content prop changes
                // This ensures the preview updates automatically after page edits
                const currentBlocks = editor.document;
                const newBlocks = initialContent;
                
                // Only update if content actually changed (prevent unnecessary updates)
                const currentContentStr = JSON.stringify(currentBlocks);
                const newContentStr = JSON.stringify(newBlocks);
                
                if (currentContentStr !== newContentStr) {
                    editor.replaceBlocks(editor.document, newBlocks);
                    setHasError(false); // Reset error on successful update
                }
            } catch (error) {
                console.error('Error updating preview content:', error);
                setHasError(true);
            }
        }
    }, [editor, initialContent]);

    // Show error state if content update failed
    if (hasError) {
        return (
            <div className="text-sm text-[var(--foreground-muted)] p-4 italic">
                Unable to load preview
            </div>
        );
    }

    // Show empty state if no valid content
    if (!initialContent) {
        return (
            <div className="text-sm text-[var(--foreground-muted)] p-4 italic">
                No content
            </div>
        );
    }

    // Render the preview
    return (
        <div className="page-card-preview h-full w-full 
        pointer-events-none select-none px-4 pt-3">
            <BlockNoteView
                editor={editor}
                theme={theme}
                editable={false}
                className="font-[family-name:var(--font-geist-sans)] [&_.bn-editor]:!bg-transparent [&_.bn-container]:!bg-transparent [&_.bn-editor]:!px-0 [&_.bn-editor]:!py-0"
            />
        </div>
    );
}

// Outer component with error boundary
const PageCardPreview = React.memo(function PageCardPreview({ content }: PageCardPreviewProps) {
    const fallback = (
        <div className="text-sm text-[var(--foreground-muted)] p-4 italic">
            Unable to load preview
        </div>
    );

    return (
        <BlockNoteErrorBoundary fallback={fallback}>
            <PageCardPreviewInner content={content} />
        </BlockNoteErrorBoundary>
    );
});

export default PageCardPreview;
