import React from 'react';
import { EditorWrapper } from './EditorWrapper';
import { EditorWrapperProps, MathSymbolConfig } from '../types';
import { MATH_THEME } from '../theme';
import { LexicalEditor } from 'lexical';

interface EditorGroupProps {
    config: MathSymbolConfig;
    isSelected: boolean;
    editors: {
        upperLimit: LexicalEditor;
        lowerLimit: LexicalEditor;
        operand: LexicalEditor;
    };
    parentEditor: LexicalEditor;
    nodeKey: string;
}

/**
 * Layouts nested editors based on symbol configuration
 * Handles different layout strategies (horizontal, vertical, fraction, etc.)
 */
export const EditorGroup: React.FC<EditorGroupProps> = ({
    config,
    isSelected,
    editors,
    parentEditor,
    nodeKey,
}) => {
    const { upperLimit: upperConfig, lowerLimit: lowerConfig, operand: operandConfig } = config.editors;

    // Helper to create editor wrapper props
    const createEditorProps = (
        editor: LexicalEditor,
        editorConfig: any,
        nextEditor?: LexicalEditor
    ): EditorWrapperProps => ({
        editor,
        config: editorConfig,
        isSelected,
        nextEditor,
        parentEditor,
        nodeKey,
    });

    // Horizontal layout: limits stacked vertically to the right of symbol
    if (config.layout === 'horizontal') {
        return (
            <>
                {/* Limits stacked vertically */}
                {(upperConfig || lowerConfig) && (
                    <div className={`${MATH_THEME.common.flexCol} ${MATH_THEME.spacing.editorGap} ${MATH_THEME.common.justifyStart} ${MATH_THEME.common.flexStart}`}>
                        {upperConfig && (
                            <EditorWrapper
                                {...createEditorProps(editors.upperLimit, upperConfig, editors.lowerLimit)}
                            />
                        )}
                        {lowerConfig && (
                            <EditorWrapper
                                {...createEditorProps(editors.lowerLimit, lowerConfig, editors.operand)}
                            />
                        )}
                    </div>
                )}

                {/* Operand to the right */}
                {operandConfig && (
                    <EditorWrapper
                        {...createEditorProps(editors.operand, {
                            ...operandConfig,
                            className: `${operandConfig.className || ''} ${MATH_THEME.spacing.operandMargin}`,
                        })}
                    />
                )}
            </>
        );
    }

    // Fraction layout: numerator over denominator
    if (config.layout === 'fraction') {
        return (
            <div className={`${MATH_THEME.common.flexCol} items-center mx-1`}>
                {upperConfig && (
                    <EditorWrapper
                        {...createEditorProps(editors.upperLimit, upperConfig, editors.lowerLimit)}
                    />
                )}
                {lowerConfig && (
                    <EditorWrapper
                        {...createEditorProps(editors.lowerLimit, lowerConfig)}
                    />
                )}
            </div>
        );
    }

    // Radical layout: content inside radical symbol
    if (config.layout === 'radical') {
        return (
            <>
                {operandConfig && (
                    <EditorWrapper
                        {...createEditorProps(editors.operand, operandConfig)}
                    />
                )}
            </>
        );
    }

    // Overlay layout: limits overlay on symbol (for integrals)
    if (config.layout === 'overlay') {
        return (
            <>
                <div className="flex flex-col -ml-2">
                    {upperConfig && (
                        <EditorWrapper
                            {...createEditorProps(editors.upperLimit, upperConfig, editors.operand)}
                        />
                    )}
                    {lowerConfig && (
                        <EditorWrapper
                            {...createEditorProps(editors.lowerLimit, lowerConfig, editors.upperLimit)}
                        />
                    )}
                </div>
                {operandConfig && (
                    <EditorWrapper
                        {...createEditorProps(editors.operand, operandConfig)}
                    />
                )}
            </>
        );
    }

    // Default: just operand
    return (
        <>
            {operandConfig && (
                <EditorWrapper
                    {...createEditorProps(editors.operand, operandConfig)}
                />
            )}
        </>
    );
};
