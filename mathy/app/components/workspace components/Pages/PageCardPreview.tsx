'use client';

import React, { useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema } from '@/app/lib/blocknote-schema';
import { useTheme } from '@/app/contexts/ThemeContext';

interface PageCardPreviewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any;
}

const PageCardPreview = React.memo(function PageCardPreview({ content }: PageCardPreviewProps) {
    const { theme } = useTheme();

    // Memoize initial content to prevent re-initialization
    const initialContent = useMemo(() => {
        if (!content) return undefined;
        try {
            if (content.blocks && Array.isArray(content.blocks)) {
                return content.blocks.length > 0 ? content.blocks : undefined;
            }
            if (Array.isArray(content)) {
                return content.length > 0 ? content : undefined;
            }
            return undefined;
        } catch (error) {
            console.error('Error parsing content for preview:', error);
            return undefined;
        }
    }, [content]);

    // Initialize editor in read-only mode (effectively)
    // We don't attach any change handlers
    const editor = useCreateBlockNote({
        schema: customSchema,
        initialContent: initialContent,
    });

    if (!initialContent) {
        return (
            <div className="text-sm text-[var(--foreground-muted)] p-4 italic">
                No content
            </div>
        );
    }

    return (
        <div className="page-card-preview h-full w-full pointer-events-none select-none">
            <BlockNoteView
                editor={editor}
                theme={theme}
                editable={false} // Explicitly set read-only if supported, otherwise pointer-events-none handles it
                className="font-[family-name:var(--font-geist-sans)] [&_.bn-editor]:!bg-transparent [&_.bn-container]:!bg-transparent [&_.bn-editor]:!px-0 [&_.bn-editor]:!py-0"
            />
        </div>
    );
});

export default PageCardPreview;
