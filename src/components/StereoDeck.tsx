import React from 'react';
import { useStereo } from '../hooks/useStereo';
import { PerformanceSettings } from '../hooks/usePerformanceSettings';
import { LeftControls } from './LeftControls';
import { RightControls } from './RightControls';
import { MainDisplay } from './MainDisplay';
import { Equalizer } from './Equalizer';
import { RecoverySettingItem } from './AndroidRecoveryMenu';

interface StereoDeckProps {
  isolated?: boolean;
  stereoState?: ReturnType<typeof useStereo>;
  perfSettings?: PerformanceSettings;
  onToggleCarPlay?: () => void;
  recoveryItems?: RecoverySettingItem[];
  setupMenuIndex?: number;
  onSetupAction?: (action: 'UP' | 'DOWN' | 'NEXT' | 'PREV') => void;
  onSelectSetupMenuIndex?: (idx: number) => void;
}

export const StereoDeck: React.FC<StereoDeckProps> = ({ 
  isolated = false, 
  stereoState: propStereoState, 
  perfSettings, 
  onToggleCarPlay,
  recoveryItems,
  setupMenuIndex,
  onSetupAction,
  onSelectSetupMenuIndex
}) => {
  const localStereoState = useStereo();
  const stereoState = propStereoState || localStereoState;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer Dashboard Mount Frame (Completely stripped when isolated to show PLAYER ONLY) */}
      <div className={`outer-mount-frame transition-all duration-300 relative ${
        isolated 
          ? 'w-[836px] min-w-[836px] max-w-[836px] p-0 m-0 bg-transparent border-none shadow-none rounded-none' 
          : 'w-[880px] min-w-[880px] max-w-[880px] p-5 rounded-2xl bg-[#1c2027] border border-[#363e4d] shadow-[inset_0_4px_18px_rgba(0,0,0,0.8),0_14px_35px_rgba(0,0,0,0.9),0_0_2px_rgba(255,255,255,0.12)]'
      }`}>

        {/* Inner Chassis Trim */}
        <div className="relative">
          {/* Main Stereo Chassis Double-DIN Fixed Size - Dark Anodized Graphite Metal Body */}
          <div className="stereo-chassis w-[836px] min-w-[836px] max-w-[836px] h-[375px] min-h-[375px] max-h-[375px] flex border-[2px] border-[#242730] bg-[#14161a] rounded-[3px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),0_8px_24px_rgba(0,0,0,0.9)] overflow-hidden flex-shrink-0">
            
            {/* Left Controls with Circular Volume Rotary Dial */}
            <LeftControls 
              {...stereoState} 
              isBooting={stereoState.isBooting}
              showSetupMenu={stereoState.showSetupMenu}
              onSetupAction={onSetupAction}
            />
            
            {/* Center Console: LCD Information Display & 7-Band Graphic Equalizer */}
            <div className="center-console-panel w-[546px] min-w-[546px] max-w-[546px] h-full flex flex-col justify-between bg-[#0f1014] relative pt-0.5 flex-shrink-0 overflow-hidden">
              <MainDisplay 
                {...stereoState} 
                isBooting={stereoState.isBooting}
                showStreamDialog={stereoState.showStreamDialog}
                setShowStreamDialog={stereoState.setShowStreamDialog}
                setMode={stereoState.setMode}
                openStreamDialog={stereoState.openStreamDialog}
                perfSettings={perfSettings}
                showSetupMenu={stereoState.showSetupMenu}
                setShowSetupMenu={stereoState.setShowSetupMenu}
                updatePerfSetting={perfSettings?.updateSetting}
                setVisualizerMode={stereoState.setVisualizerMode}
                recoveryItems={recoveryItems}
                setupMenuIndex={setupMenuIndex}
                onSelectSetupMenuIndex={onSelectSetupMenuIndex}
              />
              <Equalizer 
                eq={stereoState.eq} 
                adjustEq={stereoState.adjustEq} 
                powered={stereoState.powered} 
                isBooting={stereoState.isBooting}
                eqMode={stereoState.eqMode}
                activePresetName={stereoState.activePresetName}
                applyEqPreset={stereoState.applyEqPreset}
                autoScanRadio={stereoState.autoScanRadio}
              />
            </div>
            
            {/* Right Controls with Circular Bass Rotary Dial & SETUP button */}
            <RightControls 
              {...stereoState} 
              isBooting={stereoState.isBooting}
              isYtPlaying={stereoState.isYtPlaying}
              openStreamDialog={stereoState.openStreamDialog}
              isolated={isolated}
              onToggleCarPlay={onToggleCarPlay}
              showSetupMenu={stereoState.showSetupMenu}
              toggleSetupMenu={stereoState.toggleSetupMenu}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
};
