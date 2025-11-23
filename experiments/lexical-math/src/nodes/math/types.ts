import { LexicalEditor } from 'lexical';
import { ReactNode } from 'react';

export type MathSymbolType = 'sum' | 'int' | 'frac' | 'sqrt' | 'sup' | 'sub' | 'symbol';

export type EditorPosition =
    | 'top'           // above symbol
    | 'bottom'        // below symbol
    | 'left'          // left of symbol
    | 'right'         // right of symbol
    | 'top-overlay'   // overlaid on top-right of symbol (for integrals)
    | 'bottom-overlay' // overlaid on bottom-right of symbol
    | 'inside';       // inside symbol (for radicals)

export type EditorSize = 'small' | 'medium' | 'large';

export type LayoutType =
    | 'horizontal'    // symbol with limits to the right (sum symbol)
    | 'vertical'      // limits above/below symbol (limit notation)
    | 'fraction'      // numerator over denominator
    | 'radical'       // square root with content inside
    | 'overlay';      // limits overlay the symbol (integral)

/**
 * Configuration for a single nested editor
 */
export interface EditorConfig {
    /** Where this editor is positioned relative to the symbol */
    position: EditorPosition;

    /** Size variant */
    size: EditorSize;

    /** Placeholder text */
    placeholder: string;

    /** Text alignment */
    alignment?: 'start' | 'center';

    /** Additional CSS classes */
    className?: string;
}

/**
 * Configuration for a math symbol
 */
export interface MathSymbolConfig {
    /** Type identifier */
    type: MathSymbolType;

    /** The visual symbol (SVG or text) */
    symbol: ReactNode;

    /** Layout strategy for this symbol */
    layout: LayoutType;

    /** Configuration for each editor slot */
    editors: {
        upperLimit?: EditorConfig;
        lowerLimit?: EditorConfig;
        operand?: EditorConfig;
    };

    /** Additional container classes */
    containerClass?: string;

    /** Symbol-specific styling */
    symbolStyle?: React.CSSProperties;
}

/**
 * Props for the main MathSymbolRenderer component
 */
export interface MathSymbolRendererProps {
    /** Symbol configuration */
    config: MathSymbolConfig;

    /** Selection state */
    isSelected: boolean;

    /** Actual editor instances */
    editors: {
        upperLimit: LexicalEditor;
        lowerLimit: LexicalEditor;
        operand: LexicalEditor;
    };

    /** Parent editor for navigation */
    parentEditor: LexicalEditor;

    /** Node key for identification */
    nodeKey: string;
}

/**
 * Props for EditorWrapper component
 */
export interface EditorWrapperProps {
    /** Editor instance */
    editor: LexicalEditor;

    /** Editor configuration */
    config: EditorConfig;

    /** Selection state */
    isSelected: boolean;

    /** Next editor for navigation */
    nextEditor?: LexicalEditor;

    /** Parent editor */
    parentEditor: LexicalEditor;

    /** Node key */
    nodeKey: string;
}
