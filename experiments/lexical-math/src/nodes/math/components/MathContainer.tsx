import React from 'react';
import { buildContainerClassName } from '../theme';

interface MathContainerProps {
    isSelected: boolean;
    children: React.ReactNode;
    additionalClasses?: string;
}

/**
 * Container for math expressions
 * Provides consistent padding, spacing, and selection highlighting
 */
export const MathContainer: React.FC<MathContainerProps> = ({
    isSelected,
    children,
    additionalClasses = '',
}) => {
    const className = buildContainerClassName(isSelected, additionalClasses);

    return <div className={className}>{children}</div>;
};
