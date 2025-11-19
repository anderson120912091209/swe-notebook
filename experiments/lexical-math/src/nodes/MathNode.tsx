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
        this.__upperLimit = upperLimit || createEditor();
        this.__lowerLimit = lowerLimit || createEditor();
        this.__operand = operand || createEditor();
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


    const Placeholder = ({ text }: { text: string }) => (
        <div className="absolute top-0 left-0 text-gray-500 pointer-events-none text-[10px] p-0.5 whitespace-nowrap">
            {text}
        </div>
    );

    const NestedEditor = ({
        initialEditor,
        className,
        placeholder,
        nextEditor,
    }: {
        initialEditor: LexicalEditor;
        className?: string;
        placeholder?: string;
        nextEditor?: LexicalEditor;
    }) => (
        <LexicalNestedComposer initialEditor={initialEditor}>
            <div className={`relative border border-dotted border-gray-700 min-w-[20px] min-h-[20px] flex items-center ${className}`} style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal' }}>
                <RichTextPlugin
                    contentEditable={<ContentEditable className="outline-none min-w-[20px] whitespace-nowrap px-1 text-white" style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }} />}
                    placeholder={placeholder ? <Placeholder text={placeholder} /> : null}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <MathPlugin />
                <MathTypeaheadPlugin />
                <MathNavigationPlugin
                    nextEditor={nextEditor}
                    parentEditor={editor}
                    nodeKey={nodeKey}
                />
            </div>
        </LexicalNestedComposer>
    );

    return (
        <div
            ref={ref}
            className={`inline-flex items-center p-1 rounded ${isSelected ? 'ring-2 ring-gray-500 bg-gray-700/30' : ''
                }`}
            style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}
        >
            {mathType === 'sum' && (
                <div className="flex flex-col items-center mr-1">
                    <NestedEditor
                        initialEditor={upperLimit}
                        className="text-xs mb-0.5 text-center"
                        placeholder="n"
                        nextEditor={operand}
                    />
                    <span className="text-2xl leading-none" style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}>Σ</span>
                    <NestedEditor
                        initialEditor={lowerLimit}
                        className="text-xs mt-0.5 text-center"
                        placeholder="i=0"
                        nextEditor={upperLimit}
                    />
                </div>
            )}

            {mathType === 'int' && (
                <div className="flex items-center mr-1 relative">
                    <span className="text-3xl italic mr-1" style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}>∫</span>
                    <div className="flex flex-col -ml-2">
                        <NestedEditor
                            initialEditor={upperLimit}
                            className="text-xs mb-2"
                            placeholder="b"
                            nextEditor={operand}
                        />
                        <NestedEditor
                            initialEditor={lowerLimit}
                            className="text-xs mt-2"
                            placeholder="a"
                            nextEditor={upperLimit}
                        />
                    </div>
                </div>
            )}

            {mathType === 'frac' && (
                <div className="flex flex-col items-center mx-1">
                    <NestedEditor
                        initialEditor={upperLimit}
                        className="text-sm text-center border-b border-gray-400 px-1 min-w-[15px]"
                        placeholder="num"
                        nextEditor={lowerLimit}
                    />
                    <NestedEditor
                        initialEditor={lowerLimit}
                        className="text-sm text-center px-1 min-w-[15px]"
                        placeholder="den"
                    />
                </div>
            )}

            {mathType === 'sqrt' && (
                <div className="flex items-center mx-1">
                    <span className="text-2xl mr-0.5" style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}>√</span>
                    <div className="border-t border-gray-400 pt-0.5 px-1">
                        <NestedEditor
                            initialEditor={operand}
                            className="text-base"
                            placeholder="x"
                        />
                    </div>
                </div>
            )}

            {(mathType === 'sup' || mathType === 'sub') && (
                <div className={`flex flex-col mx-0.5 ${mathType === 'sup' ? 'mb-3' : 'mt-3'}`}>
                    <NestedEditor
                        initialEditor={operand}
                        className="text-xs"
                        placeholder=" "
                    />
                </div>
            )}

            {/* Operand for Sum/Int is rendered last but logically follows limits */}
            {(mathType === 'sum' || mathType === 'int') && (
                <NestedEditor
                    initialEditor={operand}
                    className="text-base ml-1"
                    placeholder="Expression"
                />
            )}

        </div>
    );
}
