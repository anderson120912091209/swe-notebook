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
  onMove?: () => void;
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
  onMove,
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
      className="group relative p-4 rounded-xl border border-transparent
      hover:border-[rgba(128,128,128,0.2)] cursor-pointer flex flex-col justify-between transition-all duration-200"
      style={{
        backgroundColor: 'var(--card-bg)',
        width: '256px',
        height: '110px'
      }}
    >
      <div className="flex items-start justify-between relative">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ color: baseColor }}
        >
          {pageCount === 0 ? (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'none' }}
            >
              <path opacity="0.5" d="M22 14V11.7979C22 9.16554 22 7.84935 21.2305 6.99383C21.1598 6.91514 21.0849 6.84024 21.0062 6.76946C20.1506 6 18.8345 6 16.2021 6H15.8284C14.6747 6 14.0979 6 13.5604 5.84678C13.2651 5.7626 12.9804 5.64471 12.7121 5.49543C12.2237 5.22367 11.8158 4.81578 11 4L10.4497 3.44975C10.1763 3.17633 10.0396 3.03961 9.89594 2.92051C9.27652 2.40704 8.51665 2.09229 7.71557 2.01738C7.52976 2 7.33642 2 6.94975 2C6.06722 2 5.62595 2 5.25839 2.06935C3.64031 2.37464 2.37464 3.64031 2.06935 5.25839C2 5.62595 2 6.06722 2 6.94975V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" fill={baseColor} />
              <path d="M12.25 10C12.25 9.58579 12.5858 9.25 13 9.25H18C18.4142 9.25 18.75 9.58579 18.75 10C18.75 10.4142 18.4142 10.75 18 10.75H13C12.5858 10.75 12.25 10.4142 12.25 10Z" fill={baseColor} />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'none' }}
            >
              <path opacity="0.5" d="M2 6.94975C2 6.06722 2 5.62595 2.06935 5.25839C2.37464 3.64031 3.64031 2.37464 5.25839 2.06935C5.62595 2 6.06722 2 6.94975 2C7.33642 2 7.52976 2 7.71557 2.01738C8.51665 2.09229 9.27652 2.40704 9.89594 2.92051C10.0396 3.03961 10.1763 3.17633 10.4497 3.44975L11 4C11.8158 4.81578 12.2237 5.22367 12.7121 5.49543C12.9804 5.64471 13.2651 5.7626 13.5604 5.84678C14.0979 6 14.6747 6 15.8284 6H16.2021C18.8345 6 20.1506 6 21.0062 6.76946C21.0849 6.84024 21.1598 6.91514 21.2305 6.99383C22 7.84935 22 9.16554 22 11.7979V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V6.94975Z" fill={baseColor} />
              <path d="M20 6.23751C19.9992 5.94016 19.9949 5.76263 19.9746 5.60842C19.7974 4.26222 18.7381 3.2029 17.3919 3.02567C17.1969 3 16.9647 3 16.5003 3H9.98828C10.1042 3.10392 10.2347 3.23445 10.45 3.44975L11.0003 4C11.8161 4.81578 12.2239 5.22367 12.7124 5.49543C12.9807 5.64471 13.2653 5.7626 13.5606 5.84678C14.0982 6 14.675 6 15.8287 6H16.2024C17.9814 6 19.1593 6 20 6.23751Z" fill={baseColor} />
              <path fillRule="evenodd" clipRule="evenodd" d="M12.25 10C12.25 9.58579 12.5858 9.25 13 9.25H18C18.4142 9.25 18.75 9.58579 18.75 10C18.75 10.4142 18.4142 10.75 18 10.75H13C12.5858 10.75 12.25 10.4142 12.25 10Z" fill={baseColor} />
            </svg>
          )}
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
                    if (onMove) {
                      onMove();
                    }
                    handleToggle(false);
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
