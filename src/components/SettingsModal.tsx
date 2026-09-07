/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AndroidRecoveryMenu, RecoverySettingItem } from './AndroidRecoveryMenu';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndex: number;
  items: RecoverySettingItem[];
  onSetupAction: (action: 'UP' | 'DOWN' | 'NEXT' | 'PREV') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedIndex,
  items,
  onSetupAction
}) => {
  if (!isOpen) return null;

  // Keyboard navigation for recovery menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        onSetupAction('UP');
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        onSetupAction('DOWN');
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === 'l') {
        e.preventDefault();
        onSetupAction('NEXT');
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        onSetupAction('PREV');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSetupAction, onClose]);

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Android Recovery Chassis Monitor Enclosure */}
      <div 
        className="relative w-full max-w-md sm:max-w-lg flex flex-col rounded-lg border border-[#333333] bg-black text-zinc-100 shadow-[0_0_50px_rgba(0,0,0,1),0_0_20px_rgba(26,115,232,0.25)] overflow-hidden"
      >
        {/* The Screen Display (Pure settings list, zero title bar, zero footer) */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-black overflow-hidden">
          <AndroidRecoveryMenu 
            selectedIndex={selectedIndex}
            items={items}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};
