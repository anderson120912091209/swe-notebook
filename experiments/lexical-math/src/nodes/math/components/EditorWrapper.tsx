import React from 'react';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import MathPlugin from '../../../plugins/MathPlugin';
import MathTypeaheadPlugin from '../../../plugins/MathTypeaheadPlugin';
import MathNavigationPlugin from '../../../plugins/MathNavigationPlugin';
import { EditorWrapperProps } from '../types';
import { buildEditorClassName, MATH_THEME } from '../theme';

const mathTheme = {
    paragraph: 'm-0 p-0 leading-none',
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="absolute top-0 left-0 text-gray-500 pointer-events-none text-[10px] p-0.5 whitespace-nowrap">
        {text}
    </div>
);

/**
 * Wrapper for nested editors with consistent theming
 * Provides a standardized editor with proper styling and navigation
 */
export const EditorWrapper: React.FC<EditorWrapperProps> = ({
    editor,
    config,
    isSelected,
    nextEditor,
    parentEditor,
    nodeKey,
}) => {
    const className = buildEditorClassName(
        config.size,
        isSelected,
        config.alignment || 'start',
        config.className || ''
    );

    return (
        <LexicalNestedComposer initialEditor={editor} initialTheme={mathTheme}>
            <div className="relative">
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className={`${className} whitespace-nowrap px-1
                focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-purple-500/10
                transition-all duration-150`}
                            style={{
                                fontFamily: 'KaTeX_Main, "Times New Roman", serif',
                                fontOpticalSizing: 'auto',
                                fontWeight: 400,
                                fontStyle: 'normal',
                                color: MATH_THEME.colors.text,
                                outline: 'none',
                            }}
                        />
                    }
                    placeholder={config.placeholder ? <Placeholder text={config.placeholder} /> : null}
                    ErrorBoundary={LexicalErrorBoundary}
                />
            </div>
            <HistoryPlugin />
            <MathPlugin />
            <MathTypeaheadPlugin />
            <MathNavigationPlugin
                nextEditor={nextEditor}
                parentEditor={parentEditor}
                nodeKey={nodeKey}
            />
        </LexicalNestedComposer>
    );
};
