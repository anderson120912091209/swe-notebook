/**
 * Centralized design system for math symbols
 * Provides consistent spacing, sizing, typography, and colors
 */

export const MATH_THEME = {
    // Spacing between elements
    spacing: {
        symbolGap: 'gap-0.5',         // between symbol SVG and editors (與 operandMargin 一致)
        editorGap: 'gap-0.5',         // between stacked editors (e.g., upper/lower limits)
        containerPadding: 'px-1 py-1', // padding around entire math expression
        operandMargin: 'ml-[2px]',    // margin before operand editor (與 gap-0.5 = 2px 一致)
    },

    // Element sizing
    sizing: {
        limitHeight: 'h-[12px]',       // height of limit editors (upper/lower)
        limitMinWidth: 'min-w-[12px]', // minimum width of limit editors
        operandHeight: 'h-[26px]',     // height of operand editor
        operandMinWidth: 'min-w-[24px]', // minimum width of operand editor
        symbolHeight: 26,              // height in pixels for SVG symbols
    },

    // Typography settings
    typography: {
        limitText: 'text-[10px]',      // font size for limits
        operandText: 'text-sm',        // font size for operands
        symbolFont: {
            fontFamily: 'KaTeX_Main, "Times New Roman", serif',
            fontOpticalSizing: 'auto' as const,
            fontWeight: 400,
            fontStyle: 'normal' as const,
        },
    },

    // Color system
    colors: {
        text: '#ffffff',
        // 背景永遠顯示，不依賴選中狀態
        containerBg: (isSelected: boolean) =>
            isSelected ? 'bg-[#B4B4FF]/25' : 'bg-[#B4B4FF]/15', // 即使未選中也有淡背景
        editorBg: (isSelected: boolean) =>
            'bg-[#938AF5]/40', // 永遠顯示紫色背景
        symbolStroke: 'white',
    },

    // Common reusable classes
    common: {
        rounded: 'rounded-lg',
        roundedMd: 'rounded-md',
        flexRow: 'flex items-center',
        flexCol: 'flex flex-col',
        transition: 'transition-colors',
        flexStart: 'items-start',
        justifyStart: 'justify-start',
    },
} as const;

/**
 * Utility to build editor class names based on size and selection state
 */
export function buildEditorClassName(
    size: 'small' | 'medium' | 'large',
    isSelected: boolean,
    alignment: 'start' | 'center' = 'start',
    additionalClasses: string = ''
): string {
    const baseClasses = [
        'rounded',
        'flex',
        'items-center',
        alignment === 'start' ? 'justify-start' : 'justify-center',
    ];

    const sizeClasses = {
        small: [
            MATH_THEME.sizing.limitMinWidth,
            MATH_THEME.sizing.limitHeight,
            MATH_THEME.typography.limitText,
        ],
        medium: [
            MATH_THEME.sizing.operandMinWidth,
            MATH_THEME.sizing.operandHeight,
            MATH_THEME.typography.operandText,
        ],
        large: [
            'min-w-[32px]',
            'h-[32px]',
            'text-base',
        ],
    };

    const bgClass = MATH_THEME.colors.editorBg(isSelected);

    return [
        ...baseClasses,
        ...sizeClasses[size],
        bgClass,
        additionalClasses,
    ]
        .filter(Boolean)
        .join(' ');
}

/**
 * Utility to build container class names
 */
export function buildContainerClassName(
    isSelected: boolean,
    additionalClasses: string = ''
): string {
    const baseClasses = [
        MATH_THEME.common.flexRow,
        MATH_THEME.spacing.symbolGap,
        MATH_THEME.spacing.containerPadding,
        MATH_THEME.common.rounded,
        MATH_THEME.common.transition,
    ];

    const bgClass = MATH_THEME.colors.containerBg(isSelected);

    return [
        ...baseClasses,
        bgClass,
        additionalClasses,
    ]
        .filter(Boolean)
        .join(' ');
}
