'use client';

import React, { useEffect, useRef, useState } from 'react';

// Local type definition for MathfieldElement to avoid build-time import issues
interface MathfieldElement extends HTMLElement {
  value: string;
  readOnly?: boolean;
  focus?: () => void;
  blur?: () => void;
}

interface MathLiveDisplayProps {
    value: string;
}

const MathLiveDisplay: React.FC<MathLiveDisplayProps> = ({ value }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Dynamically import mathlive to avoid SSR issues
        // Use 'mathlive' alias for better Turbopack compatibility
        import('mathlive').then(() => {
            setIsMounted(true);
        }).catch(() => {
            console.error('Failed to load mathlive');
            setIsMounted(true); // Set mounted anyway to prevent UI blocking
        });
    }, []);

    useEffect(() => {
        if (!isMounted || !containerRef.current) return;

        // Create read-only math-field for display
        const mf = new window.MathfieldElement();
        mf.value = value;
        mf.readOnly = true;

        // Styling
        mf.style.display = 'inline-block';
        mf.style.outline = 'none';
        mf.style.border = 'none';
        mf.style.background = 'transparent';
        mf.style.fontSize = 'inherit';
        mf.style.color = 'inherit';
        mf.style.cursor = 'pointer';

        // Mount
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(mf);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [isMounted, value]);

    return <span ref={containerRef} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
};

export default MathLiveDisplay;
