import React from 'react';
import { useStereo } from '../hooks/useStereo';
import { LeftControls } from './LeftControls';
import { RightControls } from './RightControls';
import { MainDisplay } from './MainDisplay';
import { Equalizer } from './Equalizer';

interface StereoDeckProps {
  isolated?: boolean;
}

export const StereoDeck: React.FC<StereoDeckProps> = ({ isolated = false }) => {
  const stereoState = useStereo();

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer Dashboard Mount Frame (Completely stripped when isolated to show PLAYER ONLY) */}
      <div className={`transition-all duration-300 relative ${
        isolated 
          ? 'w-[836px] min-w-[836px] max-w-[836px] p-0 m-0 bg-transparent border-none shadow-none rounded-none' 
          : 'w-[880px] min-w-[880px] max-w-[880px] p-5 rounded-2xl bg-[#111215] border border-[#20242c] shadow-[inset_0_4px_18px_rgba(0,0,0,1),0_12px_35px_rgba(0,0,0,0.9),0_0_2px_rgba(255,255,255,0.06)]'
      }`}>

        {/* Inner Chassis Trim */}
        <div className="relative">
          {/* Main Stereo Chassis Double-DIN Fixed Size */}
          <div className="stereo-chassis w-[836px] min-w-[836px] max-w-[836px] h-[375px] min-h-[375px] max-h-[375px] flex border-[2px] border-[#060608] bg-[#0c0c0e] rounded-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_6px_20px_rgba(0,0,0,0.8)] overflow-hidden flex-shrink-0">
            
            {/* Left Controls with Circular Volume Rotary Dial */}
            <LeftControls 
              {...stereoState} 
              isBooting={stereoState.isBooting}
            />
            
            {/* Center Console: LCD Information Display & 7-Band Graphic Equalizer */}
            <div className="w-[546px] min-w-[546px] max-w-[546px] h-full flex flex-col justify-between bg-[#0b0c0e] relative pt-0.5 flex-shrink-0 overflow-hidden">
              <MainDisplay 
                {...stereoState} 
                isBooting={stereoState.isBooting}
                showStreamDialog={stereoState.showStreamDialog}
                setShowStreamDialog={stereoState.setShowStreamDialog}
                setMode={stereoState.setMode}
                openStreamDialog={stereoState.openStreamDialog}
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
            
            {/* Right Controls with Circular Bass Rotary Dial */}
            <RightControls 
              {...stereoState} 
              isBooting={stereoState.isBooting}
              isYtPlaying={stereoState.isYtPlaying}
              openStreamDialog={stereoState.openStreamDialog}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
};
