
import React, { FC } from 'react';
import { SuggestionMenuProps } from '@blocknote/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomSuggestionMenu: FC<SuggestionMenuProps<any>> = ({
    items,
    selectedIndex,
    onItemClick,
}) => {
    return (
        <div className="bg-[#1f1f1f] border border-[#333] rounded-lg shadow-2xl overflow-hidden min-w-[280px] max-w-[320px] text-white font-sans z-50">
            <div className="px-3 py-2.5 text-xs font-medium text-gray-400 select-none">
                Create a block
            </div>

            <div className="max-h-[320px] overflow-y-auto py-1 custom-scrollbar">
                {items.map((item, index) => {
                    const isSelected = index === selectedIndex;

                    return (
                        <div
                            key={item.title} // Assuming title is unique enough for menu items
                            className={`
                group flex items-center justify-between mx-1.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150
                ${isSelected ? 'bg-[#333333]' : 'hover:bg-[#2a2a2a]'}
              `}
                            onClick={() => onItemClick?.(item)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                            aria-selected={isSelected}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* Icon Container */}
                                <div className={`
                  flex items-center justify-center w-5 h-5 text-gray-400
                  ${isSelected ? 'text-white' : ''}
                `}>
                                    {item.icon}
                                </div>

                                {/* Label */}
                                <span className={`
                  text-sm font-medium truncate
                  ${isSelected ? 'text-white' : 'text-gray-300'}
                `}>
                                    {item.title}
                                </span>
                            </div>

                            {/* Right Side Indicator (Hamburger/Drag handle style from reference) */}
                            {isSelected && (
                                <div className="text-gray-500 opacity-100 flex-shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No results found
                    </div>
                )}
            </div>

            <div className="px-3 py-2 border-t border-[#2a2a2a] flex items-center justify-between text-[10px] text-gray-500 select-none bg-[#1f1f1f]">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-400">↑↓</span> to navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-400">Esc</span> to abort
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-400">Enter</span> to select
                    </span>
                </div>
            </div>
        </div>
    );
};
