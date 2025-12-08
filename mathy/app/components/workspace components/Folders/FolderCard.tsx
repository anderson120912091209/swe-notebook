'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Folder } from '@/app/types/workspace';
import { CardMenu, ThreeDotButton } from '../Shared/CardMenu';

interface FolderCardProps {
  folder: Folder;
  pageCount?: number;
  onDelete?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
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



const FolderCard = React.memo(function FolderCard({
  folder,
  pageCount = 0,
  onDelete,
  onEdit,
  isOpen,
  onToggle
}: FolderCardProps) {
  const router = useRouter();
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Internal state fallback if not controlled
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isMenuOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const handleToggle = onToggle || setInternalIsOpen;

  // Prefetch route on hover for instant navigation
  const handleMouseEnter = React.useCallback(() => {
    router.prefetch(`/notebook/folder/${folder.id}`);
  }, [router, folder.id]);

  // Prefetch route when card enters viewport (intersection observer)
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            router.prefetch(`/notebook/folder/${folder.id}`);
            observer.disconnect(); // Only prefetch once
          }
        });
      },
      { rootMargin: '100px' } // Prefetch 100px before visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [folder.id, router]);

  const handleClick = () => {
    router.push(`/notebook/folder/${folder.id}`);
  };

  const baseColor = parseHex(folder.color)?.hex ?? FALLBACK_COLOR;
  // Make background darker/vintage in dark mode for better white text visibility
  // const lightenAmount = theme === 'dark' ? 0.25 : 0.42;
  // const cardBackground = lightenHex(baseColor, lightenAmount);
  // const chipBackground = lightenHex(baseColor, theme === 'dark' ? 0.35 : 0.58);
  // // Use a more appropriate border color for dark mode
  // const borderColor = theme === 'dark'
  //   ? darkenHex(cardBackground, 0.4) // Darker border in dark mode for better contrast
  //   : darkenHex(cardBackground, 0.2); // Original border for light mode
  // const textColor = '#ffffff'; // White text for better readability on light backgrounds
  // const mutedTextColor = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white for secondary text
  // const controlBackground = 'rgba(255, 255, 255, 0.7)';
  // const controlHoverBackground = 'rgba(255, 255, 255, 0.9)';
  // const controlIconColor = '#0F172A';

  // const createdDate = folder.created_at ? new Date(folder.created_at) : null;
  // const createdYear = createdDate && !Number.isNaN(createdDate.valueOf()) ? createdDate.getFullYear() : '—';
  // const createdLabel =
  //   createdDate && !Number.isNaN(createdDate.valueOf())
  //     ? createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  //     : 'Date unavailable';
  // const description =
  //   folder.description && folder.description.trim().length > 0
  //     ? folder.description.trim()
  //     : 'Add a short description so collaborators know what lives here.';

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="group relative p-4 rounded-xl border cursor-pointer flex flex-col justify-between"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--card-bg)',
        width: '256px',
        height: '110px'
      }}
    >
      <div className="flex items-start justify-between relative">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${baseColor}20`, color: baseColor }}
        >
          <svg
            className="w-5 h-5"
            fill={baseColor}
            stroke="none"
            viewBox="0 0 24 24"
            style={{ filter: 'none' }}
          >
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>

        {/* Top Right Container - Swaps Page Count and Menu */}
        <div className="relative h-6 min-w-[24px] flex items-center justify-end z-20">
          {/* Page Count - Visible by default, hidden on hover */}
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full bg-[var(--hover-bg)] ${isMenuOpen ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}
            style={{ color: 'var(--foreground-muted)' }}
          >
            {pageCount}
          </span>

          {/* Menu Button - Hidden by default, visible on hover */}
          <div className="relative">
            <ThreeDotButton
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(!isMenuOpen);
              }}
              isVisible={isMenuOpen}
            />
            <CardMenu
              isOpen={isMenuOpen}
              onClose={() => handleToggle(false)}
              items={[
                {
                  label: 'Rename',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  ),
                  onClick: () => onEdit?.(folder.id),
                },
                {
                  label: 'Move',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  ),
                  onClick: () => {
                    // TODO: Implement move functionality
                    console.log('Move folder');
                  },
                },
                {
                  label: 'Delete',
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
                  ),
                  onClick: () => {
                    if (onDelete && confirm(`Delete folder "${folder.name}" and all its pages?`)) {
                      onDelete(folder.id);
                    }
                  },
                  destructive: true,
                },
              ]}
                />
          </div>
        </div>
      </div>
      <div className="relative">
        <h4 className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {folder.name || 'Untitled Folder'}
        </h4>
      </div>
    </div>
  );
});

export default FolderCard;
