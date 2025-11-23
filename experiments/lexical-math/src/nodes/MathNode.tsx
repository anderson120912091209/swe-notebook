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
        <div className="absolute top-0 left-0 text-gray-500
         pointer-events-none text-[10px] p-0.5 whitespace-nowrap">
            {text}
        </div>
    );

    const NestedEditor = ({
        initialEditor,
        className,
        placeholder,
        nextEditor,
        showBorder = true,
        purpleHighlight = false,
    }: {
        initialEditor: LexicalEditor;
        className?: string;
        placeholder?: string;
        nextEditor?: LexicalEditor;
        showBorder?: boolean;
        purpleHighlight?: boolean;
    }) => (
        <LexicalNestedComposer initialEditor={initialEditor}>
            <div
                className={`relative min-w-[20px] min-h-[20px] flex items-center rounded ${className} ${showBorder ? 'border border-dotted border-gray-700' : ''
                    } ${purpleHighlight ? 'bg-purple-700/30' : ''
                    }`}
                style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal' }}
            >
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="outline-none min-w-[5x] whitespace-nowrap px-1 text-white w-full"
                            style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}
                        />
                    }
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
            className={`inline-flex items-center ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
            style={{ fontFamily: '"Stack Sans Text", sans-serif', fontOpticalSizing: 'auto', fontWeight: 400, fontStyle: 'normal', color: '#ffffff' }}
        >
            {mathType === 'sum' && (
                <div className={`flex items-center gap-1 px-1 rounded-lg 
                transition-colors ${isSelected ? 'bg-[#B4B4FF]/20' : ''}`}>
                    {/* Sigma symbol on the left - using SVG */}
                    <div className="flex items-center" style={{ height: 'fit-content' }}>
                        <svg
                            width="18"
                            height="24"
                            viewBox="0 0 20 27"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="flex-shrink-0"
                        >
                            <path
                                d="M18.4482 5.51055V3C18.4482 1.89543 17.5528 1 16.4482 1H3.00489C1.44507 1 0.485618 2.70621 1.29597 4.03903L6.41651 12.461C6.80461 13.0993 6.80461 13.9007 6.41651 14.539L1.29597 22.961C0.485617 24.2938 1.44507 26 3.00489 26H16.4482C17.5528 26 18.4482 25.1046 18.4482 24V21.7485"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* Limits stacked vertically to the right of Sigma */}
                    <div className="flex flex-col gap-0.5 justify-center -ml-0.5">
                        <NestedEditor
                            initialEditor={upperLimit}
                            className={`min-w-[3px] h-[3px] rounded flex items-center justify-center 
                            text-[5px] px-0.5 ${isSelected ? 'bg-[#938AF5]/40' : ''}`}
                            placeholder=" "
                            nextEditor={lowerLimit}
                            showBorder={false}
                            purpleHighlight={false}
                        />
                        <NestedEditor
                            initialEditor={lowerLimit}
                            className={`min-w-[3px] h-[3px] rounded flex items-center 
                            justify-center text-[5px] px-0.5 ${isSelected ? 'bg-[#938AF5]/40' : ''}`}
                            placeholder=" "
                            nextEditor={operand}
                            showBorder={false}
                            purpleHighlight={false}
                        />
                    </div>

                    {/* Operand to the right of limits */}
                    <NestedEditor
                        initialEditor={operand}
                        className={`h-[32px] min-w-[24px] px-1 rounded flex items-center justify-center text-sm ml-1 ${isSelected ? 'bg-[#938AF5]/40' : ''}`}
                        placeholder=" "
                        showBorder={false}
                        purpleHighlight={false}
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

            {/* Operand for Int is rendered separately */}
            {mathType === 'int' && (
                <NestedEditor
                    initialEditor={operand}
                    className="text-base ml-1"
                    placeholder="Expression"
                />
            )}

        </div>
    );
}
