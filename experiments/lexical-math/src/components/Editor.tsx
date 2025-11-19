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
    // Theme styling goes here
    paragraph: 'mb-2',
};

function onError(error: Error) {
    console.error(error);
}

export default function Editor() {
    const initialConfig = {
        namespace: 'MyEditor',
        theme,
        onError,
        nodes: [MathNode],
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="min-h-screen bg-black text-white flex justify-center pt-24 px-6">
                <div className="w-full max-w-[800px] relative">

                    {/* Header / Title Area */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold tracking-tight mb-2">Getting Started</h1>
                        <div className="text-gray-500 text-lg">Anderson Chen · @andersonchen_7</div>
                    </div>

                    {/* Editor Area */}
                    <div className="relative min-h-[500px]">
                        <RichTextPlugin
                            contentEditable={
                                <ContentEditable className="outline-none text-lg leading-8 text-gray-200 font-normal" />
                            }
                            placeholder={
                                <div className="absolute top-0 left-0 text-gray-600 text-lg pointer-events-none select-none">
                                    Type something...
                                </div>
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                        <HistoryPlugin />
                        <AutoFocusPlugin />
                        <MathPlugin />
                        <MathTypeaheadPlugin />
                    </div>
                </div>
            </div>
        </LexicalComposer>
    );
}
