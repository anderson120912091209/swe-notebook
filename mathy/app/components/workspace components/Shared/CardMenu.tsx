'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface CardMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export function CardMenu({ isOpen, onClose, items }: CardMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="absolute right-0 top-full mt-2 rounded-lg border py-1.5 z-[9999] min-w-[180px] origin-top-right"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const nextIsDestructive = !isLast && items[index + 1]?.destructive;
            const shouldShowDivider = !isLast && (item.destructive || nextIsDestructive);
            
            return (
              <React.Fragment key={index}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-3 cursor-pointer"
                  style={{ color: item.destructive ? '#ef4444' : 'var(--foreground)' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </button>
                {shouldShowDivider && (
                  <div className="h-px my-1.5" style={{ background: 'var(--border-color)' }} />
                )}
              </React.Fragment>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ThreeDotButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isVisible: boolean;
}

export function ThreeDotButton({ onClick, isVisible }: ThreeDotButtonProps) {
  return (
    <div 
      className={`absolute right-0 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      <button
        onClick={onClick}
        className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  );
}

