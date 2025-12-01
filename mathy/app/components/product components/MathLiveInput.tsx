'use client';

import React, { useEffect, useRef, useState } from 'react';
//I am using DOM capture as the main way to prevent conflicting enter key issues. 
//I think this is a technical debt we gotta fix in the future.
// Local type definition for MathfieldElement to avoid build-time import issues
interface MathfieldElement extends HTMLElement {
  value: string;
  readOnly?: boolean;
  smartMode?: boolean;
  mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed';
  // focus and blur are inherited from HTMLElement, no need to redefine
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
            // Helper function to check if MathLive's suggestion popover is visible
            // Uses the same DOM-based check that MathLive uses internally
            const isPopoverVisible = (): boolean => {
                const panel = document.getElementById('mathlive-suggestion-popover');
                return panel?.classList.contains('is-visible') ?? false;
            };
            
            if (evt.key === 'Enter' || evt.key === 'Tab') {
                // Check if popover is visible using DOM (same as MathLive)
                const popoverVisible = isPopoverVisible();
                
                if (popoverVisible) {
                    console.log('[MathLiveInput] Popover visible, letting MathLive handle Enter/Tab');
                    return; // Don't intercept - let MathLive handle menu selection
                }
                
                // Additional safety check: if event was already prevented, don't handle
                if (evt.defaultPrevented) {
                    return;
                }

                // Menu is closed, so exit the math block
                evt.preventDefault();
                console.log('[MathLiveInput] Enter/Tab pressed, calling onFinish');
                onFinishRef.current?.();
            } else if (evt.key === 'Escape') {
                // Check if popover is visible
                const popoverVisible = isPopoverVisible();
                
                if (popoverVisible) {
                    console.log('[MathLiveInput] Popover visible, letting MathLive handle Escape');
                    return; // Let MathLive close the menu first
                }
                
                // Additional safety check
                if (evt.defaultPrevented) {
                    return;
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
            // Capture container reference at cleanup time
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const container = containerRef.current;
            if (container) {
                container.innerHTML = '';
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
