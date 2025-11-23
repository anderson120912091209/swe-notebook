import {
    DecoratorNode,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import { ReactNode } from 'react';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { mergeRegister } from '@lexical/utils';
import {
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    createEditor,
    LexicalEditor,
} from 'lexical';
import React, { useEffect, useRef } from 'react';
import MathTypeaheadPlugin from '../plugins/MathTypeaheadPlugin';
import MathPlugin from '../plugins/MathPlugin';

export type MathSymbolType = 'sum' | 'int' | 'frac' | 'sqrt' | 'sup' | 'sub' | 'symbol';

export interface SerializedMathNode extends SerializedLexicalNode {
    mathType: MathSymbolType;
}

export class MathNode extends DecoratorNode<ReactNode> {
    __mathType: MathSymbolType;
    __upperLimit: LexicalEditor;
    __lowerLimit: LexicalEditor;
    __operand: LexicalEditor;

    static getType(): string {
        return 'math-node';
    }

    static clone(node: MathNode): MathNode {
        return new MathNode(
            node.__mathType,
            node.__upperLimit,
            node.__lowerLimit,
            node.__operand,
            node.__key
        );
    }

    static importJSON(serializedNode: SerializedMathNode): MathNode {
        const node = $createMathNode(serializedNode.mathType);
        return node;
    }

    exportJSON(): SerializedMathNode {
        return {
            mathType: this.__mathType,
            type: 'math-node',
            version: 1,
        };
    }

    constructor(
        mathType: MathSymbolType,
        upperLimit?: LexicalEditor,
        lowerLimit?: LexicalEditor,
        operand?: LexicalEditor,
        key?: NodeKey
    ) {
        super(key);
        this.__mathType = mathType;
        this.__upperLimit = upperLimit || createEditor({
            nodes: [MathNode]
        });
        this.__lowerLimit = lowerLimit || createEditor({
            nodes: [MathNode]
        });
        this.__operand = operand || createEditor({
            nodes: [MathNode]
        });
    }

    createDOM(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'inline-flex items-center align-middle mx-1';
        return div;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): ReactNode {
        return (
            <MathComponent
                mathType={this.__mathType}
                upperLimit={this.__upperLimit}
                lowerLimit={this.__lowerLimit}
                operand={this.__operand}
                nodeKey={this.__key}
            />
        );
    }
}

export function $createMathNode(mathType: MathSymbolType): MathNode {
    return new MathNode(mathType);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
    return node instanceof MathNode;
}

import MathNavigationPlugin from '../plugins/MathNavigationPlugin';
import { MathSymbolRenderer } from './math/components/MathSymbolRenderer';
import { SYMBOL_CONFIGS } from './math/configs/symbols';

function MathComponent({
    mathType,
    upperLimit,
    lowerLimit,
    operand,
    nodeKey,
}: {
    mathType: MathSymbolType;
    upperLimit: LexicalEditor;
    lowerLimit: LexicalEditor;
    operand: LexicalEditor;
    nodeKey: NodeKey;
}) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const ref = useRef<HTMLDivElement>(null);
    const hasFocused = useRef(false);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (event: MouseEvent) => {
                    if (ref.current && ref.current.contains(event.target as Node)) {
                        clearSelection();
                        setSelected(true);
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, clearSelection, setSelected]);

    // Auto-focus logic: Focus the first logical editor on mount
    useEffect(() => {
        if (hasFocused.current) return;
        hasFocused.current = true;

        // Determine primary editor based on type
        let primaryEditor = operand;
        if (mathType === 'sum' || mathType === 'int') primaryEditor = lowerLimit;
        if (mathType === 'frac') primaryEditor = upperLimit;
        setTimeout(() => {
            primaryEditor.focus();
        }, 0);
    }, [mathType, lowerLimit, upperLimit, operand]);

    // Get configuration for this symbol type
    const config = SYMBOL_CONFIGS[mathType];

    if (!config) {
        return <div>Unknown math type: {mathType}</div>;
    }

    return (
        <div
            ref={ref}
            className="inline-flex items-center"
            style={{ fontFamily: 'KaTeX_Main, "Times New Roman", serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}
        >
            <MathSymbolRenderer
                config={config}
                isSelected={isSelected}
                editors={{ upperLimit, lowerLimit, operand }}
                parentEditor={editor}
                nodeKey={nodeKey}
            />
        </div>
    );
}
