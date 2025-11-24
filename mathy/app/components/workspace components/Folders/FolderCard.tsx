'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Folder } from '@/app/types/workspace';
import { useTheme } from '@/app/contexts/ThemeContext';

interface FolderCardProps {
  folder: Folder;
  pageCount?: number;
  onDelete?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
}

const FALLBACK_COLOR = '#9CC5FF';

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#?[0-9a-f]{3,6}$/i.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function expandToSixDigit(hex: string): string {
  if (hex.length === 7) return hex.toUpperCase();
  const value = hex.slice(1);
  const expanded = value.split('').map((char) => char + char).join('');
  return `#${expanded.toUpperCase()}`;
}

function parseHex(color?: string | null) {
  const normalized = normalizeHex(color);
  if (!normalized) return null;
  const full = expandToSixDigit(normalized);
  const intValue = parseInt(full.slice(1), 16);
  return {
    hex: full,
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function clamp(amount: number) {
  return Math.min(Math.max(amount, 0), 1);
}

function rgbToHex(r: number, g: number, b: number) {
  const componentToHex = (component: number) => component.toString(16).padStart(2, '0');
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
}

function lightenHex(hex: string, amount: number) {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const factor = clamp(amount);
  const r = Math.round(parsed.r + (255 - parsed.r) * factor);
  const g = Math.round(parsed.g + (255 - parsed.g) * factor);
  const b = Math.round(parsed.b + (255 - parsed.b) * factor);
  return rgbToHex(r, g, b);
}

function darkenHex(hex: string, amount: number) {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const factor = clamp(amount);
  const r = Math.round(parsed.r * (1 - factor));
  const g = Math.round(parsed.g * (1 - factor));
  const b = Math.round(parsed.b * (1 - factor));
  return rgbToHex(r, g, b);
}


const FolderCard = React.memo(function FolderCard({ folder, pageCount = 0, onDelete, onEdit }: FolderCardProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const handleClick = () => {
    router.push(`/notebook/folder/${folder.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete folder "${folder.name}" and all its pages?`)) {
      onDelete(folder.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(folder.id);
    }
  };

  const baseColor = parseHex(folder.color)?.hex ?? FALLBACK_COLOR;
  // Make background darker/vintage in dark mode for better white text visibility
  const lightenAmount = theme === 'dark' ? 0.25 : 0.42;
  const cardBackground = lightenHex(baseColor, lightenAmount);
  const chipBackground = lightenHex(baseColor, theme === 'dark' ? 0.35 : 0.58);
  // Use a more appropriate border color for dark mode
  const borderColor = theme === 'dark'
    ? darkenHex(cardBackground, 0.4) // Darker border in dark mode for better contrast
    : darkenHex(cardBackground, 0.2); // Original border for light mode
  const textColor = '#ffffff'; // White text for better readability on light backgrounds
  const mutedTextColor = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white for secondary text
  const controlBackground = 'rgba(255, 255, 255, 0.7)';
  const controlHoverBackground = 'rgba(255, 255, 255, 0.9)';
  const controlIconColor = '#0F172A';

  const createdDate = folder.created_at ? new Date(folder.created_at) : null;
  const createdYear = createdDate && !Number.isNaN(createdDate.valueOf()) ? createdDate.getFullYear() : '—';
  const createdLabel =
    createdDate && !Number.isNaN(createdDate.valueOf())
      ? createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date unavailable';

  const description =
    folder.description && folder.description.trim().length > 0
      ? folder.description.trim()
      : 'Add a short description so collaborators know what lives here.';

  return (
    <div className="relative w-60">
      {/* Background layer - darkened folder base - STAYS STATIONARY */}
      <div
        id="background-layer"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkenHex(cardBackground, 0.15),
          borderRadius: '10px 23px 23px 10px',
          zIndex: 0,
        }}
      />

      {/* Top layer - folder card that MOVES */}
      <div
        id="folder-card"
        onClick={handleClick}
        className="group relative flex w-60 cursor-pointer select-none overflow-hidden"
        style={{
          background: cardBackground,
          borderRadius: '10px 23px 23px 10px',
          border: `1px solid ${borderColor}`,
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`,
          color: textColor,
          minHeight: '280px',
          transform: 'translateY(0px)',
          transformOrigin: 'left', // For rotateY (spine rotation)
          transition: 'all 200ms ease-out',
          filter: 'brightness(1)',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          // Only move the top layer (folder-card), background layer stays stationary
          target.style.transform = 'rotateY(-13deg)';
          target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
          target.style.borderRadius = '8px 20px 20px 8px';
          target.style.filter = 'brightness(1.05)';
          // Background layer stays in place - no transform applied to it
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget;
          // Reset only the top layer
          target.style.transform = 'translateX(0px) translateY(0px) rotateY(0deg)';
          target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
          target.style.borderRadius = '10px 23px 23px 10px';
          target.style.filter = 'brightness(1)';
        }}
      >


        {/* Content - stays stable during hover */}
        <div
          className="relative flex flex-1 flex-col p-6 transition-transform duration-[220ms] ease-out
        group-hover:translate-y-0"
          style={{ gap: '18px' }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span
              className="rounded-md px-3 py-1"
              style={{
                background: chipBackground,
                color: 'white',
                letterSpacing: '0.06em',
              }}
            >
              {createdYear}
            </span>
          </div>

          {/* Title */}
          <div className="mt-4 flex items-start gap-3">
            <h3
              className="flex-1 text-lg font-semibold leading-snug line-clamp-3"
              style={{ color: textColor }}
            >
              {folder.name || 'Untitled Folder'}
            </h3>
          </div>

          {/* Description */}
          <p
            className="mt-3 text-sm leading-relaxed line-clamp-3"
            style={{ color: mutedTextColor }}
          >
            {description}
          </p>

          {/* Footer */}
          <div className="mt-auto flex flex-col gap-4 pt-8 text-xs font-medium">
            <span className="flex items-center gap-2" style={{ color: mutedTextColor }}>
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
            <span style={{ color: mutedTextColor }}>Created {createdLabel}</span>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 
      cursor-pointer transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={handleEdit}
            className="rounded-full p-1.5 transition-colors"
            title="Rename"
            style={{
              background: controlBackground,
              color: controlIconColor,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = controlHoverBackground;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = controlBackground;
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="rounded-full p-1.5 transition-colors"
            title="Delete"
            style={{
              background: controlBackground,
              color: controlIconColor,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = controlHoverBackground;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = controlBackground;
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default FolderCard;
