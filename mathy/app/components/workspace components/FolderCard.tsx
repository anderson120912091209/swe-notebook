'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Folder } from '@/app/types/workspace';

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

function getReadableTextColor(backgroundHex: string) {
  const parsed = parseHex(backgroundHex);
  if (!parsed) return '#0F172A';
  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255;
  return luminance > 0.75 ? '#1F2933' : '#F9FAFB';
}

export default function FolderCard({ folder, pageCount = 0, onDelete, onEdit }: FolderCardProps) {
  const router = useRouter();

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
  const cardBackground = lightenHex(baseColor, 0.42);
  const accentBackground = lightenHex(baseColor, 0.28);
  const chipBackground = lightenHex(baseColor, 0.58);
  const borderColor = darkenHex(cardBackground, 0.2);
  const textColor = getReadableTextColor(cardBackground);
  const mutedTextColor = textColor === '#F9FAFB' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(15, 23, 42, 0.68)';
  const chipTextColor = textColor === '#F9FAFB' ? '#1F2933' : darkenHex(baseColor, 0.55);
  const controlBackground = textColor === '#F9FAFB' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.7)';
  const controlHoverBackground = textColor === '#F9FAFB' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.9)';
  const controlIconColor = textColor === '#F9FAFB' ? '#F8FAFC' : '#0F172A';
  const shadowColor = textColor === '#F9FAFB' ? 'rgba(15, 23, 42, 0.22)' : 'rgba(15, 23, 42, 0.12)';

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
    <div
      onClick={handleClick}
      className="group relative flex w-60 cursor-pointer select-none
      overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1"
      style={{
        background: cardBackground,
        borderRadius: '10px 23px 23px 10px',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0px 0px ${shadowColor}`,
        color: textColor,
        minHeight: '280px',
      }}
    >


      {/* Subtle ambient highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(80% 60% at 80% 0%, rgba(255,255,255,0.22) 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-1 flex-col p-6"
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
  );
}
