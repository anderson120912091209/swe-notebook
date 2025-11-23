import React from 'react';
import { MathSymbolConfig } from '../types';

/**
 * Configuration for all math symbols
 */
export const SYMBOL_CONFIGS: Record<string, MathSymbolConfig> = {
    sum: {
        type: 'sum',
        symbol: (
            <span
                className="text-[32px]"
                style={{
                    fontFamily: 'KaTeX_Main, "Times New Roman", serif',
                    fontWeight: 400,
                    lineHeight: 1,
                }}
            >
                Σ
            </span>
        ),
        layout: 'horizontal',
        editors: {
            upperLimit: {
                position: 'top',
                size: 'small',
                placeholder: ' ',
                alignment: 'start',
            },
            lowerLimit: {
                position: 'bottom',
                size: 'small',
                placeholder: ' ',
                alignment: 'start',
            },
            operand: {
                position: 'right',
                size: 'medium',
                placeholder: ' ',
                alignment: 'center',
                className: 'rounded-md',
            },
        },
    },

    int: {
        type: 'int',
        symbol: <span className="text-3xl italic mr-1" style={{ fontFamily: 'KaTeX_Main, "Times New Roman", serif' }}>∫</span>,
        layout: 'overlay',
        editors: {
            upperLimit: {
                position: 'top-overlay',
                size: 'small',
                placeholder: 'b',
                className: 'mb-2',
            },
            lowerLimit: {
                position: 'bottom-overlay',
                size: 'small',
                placeholder: 'a',
                className: 'mt-2',
            },
            operand: {
                position: 'right',
                size: 'medium',
                placeholder: 'Expression',
                className: 'ml-1',
            },
        },
        containerClass: 'mr-1 relative',
    },

    frac: {
        type: 'frac',
        symbol: null, // No symbol for fractions
        layout: 'fraction',
        editors: {
            upperLimit: {
                position: 'top',
                size: 'medium',
                placeholder: 'num',
                alignment: 'center',
                className: 'border-b border-gray-400 px-1 min-w-[15px]',
            },
            lowerLimit: {
                position: 'bottom',
                size: 'medium',
                placeholder: 'den',
                alignment: 'center',
                className: 'px-1 min-w-[15px]',
            },
        },
        containerClass: 'mx-1',
    },

    sqrt: {
        type: 'sqrt',
        symbol: <span className="text-2xl mr-0.5" style={{ fontFamily: 'KaTeX_Main, "Times New Roman", serif' }}>√</span>,
        layout: 'radical',
        editors: {
            operand: {
                position: 'inside',
                size: 'medium',
                placeholder: 'x',
                className: 'border-t border-gray-400 pt-0.5 px-1',
            },
        },
        containerClass: 'mx-1',
    },

    sup: {
        type: 'sup',
        symbol: null,
        layout: 'horizontal',
        editors: {
            operand: {
                position: 'right',
                size: 'small',
                placeholder: ' ',
            },
        },
        containerClass: 'mx-0.5 mb-3',
    },

    sub: {
        type: 'sub',
        symbol: null,
        layout: 'horizontal',
        editors: {
            operand: {
                position: 'right',
                size: 'small',
                placeholder: ' ',
            },
        },
        containerClass: 'mx-0.5 mt-3',
    },
};
