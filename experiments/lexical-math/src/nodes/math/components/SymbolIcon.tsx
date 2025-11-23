import React from 'react';
import { MATH_THEME } from '../theme';

interface SymbolIconProps {
    symbol: React.ReactNode;
    style?: React.CSSProperties;
}

/**
 * Renders a math symbol (SVG or text)
 * Provides consistent sizing and styling
 */
export const SymbolIcon: React.FC<SymbolIconProps> = ({ symbol, style }) => {
    return (
        <div
            className="flex items-center"
            style={{ height: 'fit-content', ...MATH_THEME.typography.symbolFont, ...style }}
        >
            {symbol}
        </div>
    );
};
