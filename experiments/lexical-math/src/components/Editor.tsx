'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import React from 'react';
import { MathNode } from '../nodes/MathNode';
import MathPlugin from '../plugins/MathPlugin';
import MathTypeaheadPlugin from '../plugins/MathTypeaheadPlugin';

const theme = {
    paragraph: 'mb-2',
};

function onError(error: Error) {
    console.error(error);
}

export default function Editor() {
    const initialConfig = {
        namespace: 'MathEditor',
        theme,
        onError,
        nodes: [MathNode],
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="relative min-h-[500px] w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="min-h-[400px] outline-none" style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#2b2b2b' }} />
                    }
                    placeholder={
                        <div className="pointer-events-none absolute top-4 left-4 text-gray-400">
                            Start typing... try "sum" or "int"
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <MathPlugin />
                <MathTypeaheadPlugin />
            </div>
        </LexicalComposer>
    );
}
