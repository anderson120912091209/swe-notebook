'use client';

import React, { useEffect, useRef, useState } from 'react';

// Local type definition for MathfieldElement to avoid build-time import issues
interface MathfieldElement extends HTMLElement {
  value: string;
  readOnly?: boolean;
  smartMode?: boolean;
  mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed';
  focus?: () => void;
  blur?: () => void;
  isSuggestionMenuVisible?: boolean;
}

interface MathLiveInputProps {
    value: string;
    onChange: (value: string) => void;
    onFinish?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

const MathLiveInput: React.FC<MathLiveInputProps> = ({
    value,
    onChange,
    onFinish,
    onCancel,
    autoFocus,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mfRef = useRef<MathfieldElement | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Use refs to always have latest callbacks (avoiding stale closures)
    const onChangeRef = useRef(onChange);
    const onFinishRef = useRef(onFinish);
    const onCancelRef = useRef(onCancel);

    // Update refs when callbacks change
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    useEffect(() => {
        onCancelRef.current = onCancel;
    }, [onCancel]);

    useEffect(() => {
        // Dynamically import mathlive to avoid SSR issues
        // Use 'mathlive' alias for better Turbopack compatibility
        import('mathlive').then(() => {
            // Register the custom element if it hasn't been registered yet
            // MathLive automatically registers 'math-field' when imported
            setIsMounted(true);
        }).catch(() => {
            console.error('Failed to load mathlive');
            setIsMounted(true); // Set mounted anyway to prevent UI blocking
        });
    }, []);

    useEffect(() => {
        if (!isMounted || !containerRef.current) return;

        // Create the math-field element programmatically to ensure proper typing and event handling
        const mf = new window.MathfieldElement();
        mf.value = value;

        // Configure the math field
        mf.smartMode = true;
        mf.mathVirtualKeyboardPolicy = 'manual';

        // Styling to make it look inline
        mf.style.display = 'inline-block';
        mf.style.minWidth = '20px';
        mf.style.outline = 'none';
        mf.style.border = 'none';
        mf.style.background = 'transparent';
        mf.style.fontSize = 'inherit';
        mf.style.color = 'inherit';

        // Events - using refs to access latest callbacks
        mf.addEventListener('input', (evt) => {
            const target = evt.target as MathfieldElement;
            console.log('[MathLiveInput] input event, value:', target.value);
            onChangeRef.current(target.value);
        });

        mf.addEventListener('keydown', (evt) => {
            // Check if MathLive's autocomplete/suggestion menu is open using the new API
            // Using type assertion since this property exists at runtime but may not be in types
            const mfWithMenu = mf as MathfieldElement & { isSuggestionMenuVisible?: boolean };
            
            if (evt.key === 'Enter' || evt.key === 'Tab') {
                // If menu is open, let MathLive handle the selection
                if (mfWithMenu.isSuggestionMenuVisible) {
                    console.log('[MathLiveInput] Menu open, letting MathLive handle Enter/Tab');
                    return; // Don't intercept - let MathLive handle menu selection
                }

                // Menu is closed, so exit the math block
                evt.preventDefault();
                console.log('[MathLiveInput] Enter/Tab pressed, calling onFinish');
                onFinishRef.current?.();
            } else if (evt.key === 'Escape') {
                // If menu is open, close it first; otherwise cancel the edit
                if (mfWithMenu.isSuggestionMenuVisible) {
                    console.log('[MathLiveInput] Menu open, letting MathLive handle Escape');
                    return; // Let MathLive close the menu first
                }

                evt.preventDefault();
                console.log('[MathLiveInput] Escape pressed, calling onCancel');
                onCancelRef.current?.();
            }
        });

        // Mount
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(mf);
        mfRef.current = mf;

        // Auto-focus
        if (autoFocus) {
            setTimeout(() => {
                mf.focus();
            }, 10);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted]);

    // Update value if it changes externally (though usually it's driven by internal input)
    useEffect(() => {
        if (mfRef.current && mfRef.current.value !== value) {
            // Only update if significantly different to avoid cursor jumping
            // For simple inline math, this might be okay.
            // mfRef.current.value = value; 
        }
    }, [value]);

    return <span ref={containerRef} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
};

export default MathLiveInput;
