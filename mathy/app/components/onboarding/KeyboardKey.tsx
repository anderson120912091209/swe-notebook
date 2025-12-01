'use client';

import React from 'react';

interface KeyboardKeyProps {
  keys: string[];
  className?: string;
}

/**
 * Realistic keyboard key component with proper button styling
 */
export default function KeyboardKey({ keys, className = '' }: KeyboardKeyProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd
            className="px-2 py-1 text-xs font-semibold rounded-md border transition-all duration-150 relative"
            style={{
              background: 'var(--hover-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--foreground)',
              boxShadow: `
                0 1px 0 rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 2px 4px rgba(0, 0, 0, 0.08)
              `,
              minWidth: '28px',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-bg)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `
                0 2px 0 rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                0 3px 6px rgba(0, 0, 0, 0.12)
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `
                0 1px 0 rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 2px 4px rgba(0, 0, 0, 0.08)
              `;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `
                0 1px 0 rgba(0, 0, 0, 0.1),
                inset 0 1px 2px rgba(0, 0, 0, 0.15)
              `;
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `
                0 2px 0 rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                0 3px 6px rgba(0, 0, 0, 0.12)
              `;
            }}
          >
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-xs mx-0.5 font-medium" style={{ color: 'var(--foreground-muted)' }}>
              +
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
