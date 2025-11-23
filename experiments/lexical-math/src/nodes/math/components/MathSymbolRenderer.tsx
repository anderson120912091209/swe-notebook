import React from 'react';
import { MathContainer } from './MathContainer';
import { SymbolIcon } from './SymbolIcon';
import { EditorGroup } from './EditorGroup';
import { MathSymbolRendererProps } from '../types';

/**
 * Main renderer for math symbols
 * Composes MathContainer, SymbolIcon, and EditorGroup
 */
export const MathSymbolRenderer: React.FC<MathSymbolRendererProps> = ({
    config,
    isSelected,
    editors,
    parentEditor,
    nodeKey,
}) => {
    return (
        <MathContainer isSelected={isSelected} additionalClasses={config.containerClass}>
            <SymbolIcon symbol={config.symbol} style={config.symbolStyle} />
            <EditorGroup
                config={config}
                isSelected={isSelected}
                editors={editors}
                parentEditor={parentEditor}
                nodeKey={nodeKey}
            />
        </MathContainer>
    );
};
