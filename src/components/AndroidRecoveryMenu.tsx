/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export interface RecoverySettingItem {
  id: string;
  label: string;
  value: string;
  onNext: () => void;
  onPrev: () => void;
}

interface AndroidRecoveryMenuProps {
  selectedIndex: number;
  items: RecoverySettingItem[];
  compact?: boolean;
  onSelect?: (index: number) => void;
}

export const AndroidRecoveryMenu: React.FC<AndroidRecoveryMenuProps> = ({
  selectedIndex,
  items,
  compact = false,
  onSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Automatically scroll selected item into view cleanly
  useEffect(() => {
    const activeEl = itemRefs.current[selectedIndex];
    if (activeEl && containerRef.current) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-40 bg-black/95 p-1 sm:p-1.5 flex flex-col font-mono select-none text-zinc-100 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent shadow-[inset_0_0_20px_rgba(0,0,0,1)]"
    >
      {/* Settings List - Only Settings, Zero Title Bar, Zero Footer */}
      <div className="flex flex-col gap-[2px] sm:gap-[3px] py-0.5 min-h-full">
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;

          return (
            <div
              key={item.id}
              ref={(el) => { itemRefs.current[idx] = el; }}
              onClick={() => {
                if (isSelected) {
                  item.onNext();
                } else {
                  onSelect?.(idx);
                }
              }}
              className={`flex items-center justify-between px-2 py-1.5 rounded-[2px] leading-tight cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#1a73e8] text-white font-bold shadow-[0_0_8px_rgba(26,115,232,0.8)]'
                  : 'text-[#00e5ff] hover:bg-white/5 bg-transparent'
              }`}
            >
              {/* Item Label with Cursor */}
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="w-2.5 text-center font-bold flex-shrink-0">
                  {isSelected ? '>' : ' '}
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-wider truncate">
                  {item.label}
                </span>
              </div>

              {/* Display Current Setting Value */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  item.onNext();
                }}
                className={`text-[8px] sm:text-[9px] tracking-wider whitespace-nowrap ml-2 flex-shrink-0 font-bold px-1.5 py-0.5 rounded transition-transform active:scale-95 ${
                  isSelected 
                    ? 'text-white bg-black/30 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]' 
                    : 'text-[#ffea00] hover:text-white bg-black/20'
                }`}
                title="Click to change option"
              >
                [ {item.value} ]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

