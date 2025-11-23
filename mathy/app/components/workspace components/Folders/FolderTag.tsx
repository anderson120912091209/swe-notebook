'use client';

import React from 'react';

interface FolderTagProps {
  folderName: string;
  folderColor?: string;
  className?: string;
}

// Helper functions for color manipulation
function parseHex(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    hex: result[0]
  } : null;
}

function lightenHex(hex: string, amount: number) {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  
  const factor = amount;
  const r = Math.round(parsed.r + (255 - parsed.r) * factor);
  const g = Math.round(parsed.g + (255 - parsed.g) * factor);
  const b = Math.round(parsed.b + (255 - parsed.b) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const FALLBACK_COLOR = '#6b7280';

export default function FolderTag({ folderName, folderColor, className = '' }: FolderTagProps) {
  const mutedFolderColor = folderColor 
    ? lightenHex(parseHex(folderColor)?.hex ?? FALLBACK_COLOR, 0.7) 
    : 'var(--hover-bg)';

  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${className}`}
      style={{ 
        background: mutedFolderColor,
        color: '#374151',
        border: '1px solid var(--border-color)'
      }}
    >
      {/*Folder Icon in the Tag*/}
      <svg className="w-3 h-3 mr-1" fill={folderColor || '#6b7280'} stroke="none" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      {folderName}
    </span>
  );
}
