import React from 'react';
import { Play, Pause, Rewind, FastForward, ChevronDown, ChevronUp } from 'lucide-react';
import { StereoMode } from '../hooks/useStereo';
import { RotaryDial } from './RotaryDial';

interface Props {
  powered: boolean;
  isBooting?: boolean;
  togglePower: () => void;
  volume: number;
  adjustVolume: (d: number) => void;
  setDirectVolume?: (v: number) => void;
  attenuated: boolean;
  setAttenuated: (v: boolean) => void;
  loudness: boolean;
  setLoudness: (v: boolean) => void;
  cycleDimmer: () => void;
  backlitLevel?: 0 | 1 | 2 | 3;
  cycleBacklitLevel?: () => void;
  mode: StereoMode;
  playing?: boolean;
  playPause: () => void;
  seekFwd: () => void;
  seekRev: () => void;
  tuneUp: () => void;
  tuneDown: () => void;
  memory: number | null;
  selectMemory: (n: number) => void;
  bSkip: boolean;
  toggleBSkip: () => void;
  selectDisplayMode?: () => void;
  showSetupMenu?: boolean;
  onSetupAction?: (action: 'UP' | 'DOWN' | 'NEXT' | 'PREV') => void;
}

export const LeftControls: React.FC<Props> = ({
  powered,
  isBooting = false,
  togglePower,
  volume,
  adjustVolume,
  setDirectVolume,
  attenuated,
  setAttenuated,
  loudness,
  setLoudness,
  cycleDimmer,
  backlitLevel = 3,
  cycleBacklitLevel,
  playing,
  playPause,
  seekFwd,
  seekRev,
  tuneUp,
  tuneDown,
  memory,
  selectMemory,
  bSkip,
  toggleBSkip,
  selectDisplayMode,
  showSetupMenu = false,
  onSetupAction
}) => {
  const handleVolumeChange = (newVal: number) => {
    if (setDirectVolume) {
      setDirectVolume(newVal);
    } else {
      adjustVolume(newVal - volume);
    }
  };

  return (
    <div className="left-controls-panel w-[145px] min-w-[145px] max-w-[145px] flex-shrink-0 flex flex-col justify-between h-full py-1 px-1.5 border-r border-[#101216] shadow-[1px_0_0_rgba(255,255,255,0.04)] relative bg-gradient-to-b from-[#1a1c22] via-[#14161a] to-[#101114] select-none">
      {/* Top row: Transport & Seek / Recovery Navigation */}
      <div className="flex flex-col gap-1 w-full">
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={() => {
              if (showSetupMenu) {
                onSetupAction?.('PREV');
              } else {
                seekRev();
              }
            }} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[7px] flex items-center justify-center gap-1 relative font-bold tracking-wider ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${
              showSetupMenu 
                ? '!border-[#ffea00] !text-[#ffea00] !bg-[#ffea00]/20 shadow-[0_0_12px_rgba(255,234,0,0.85)] ring-1 ring-[#ffea00] animate-pulse' 
                : ''
            }`}
            style={{ '--boot-delay': '0.1s' } as React.CSSProperties}
            title={showSetupMenu ? "Change Setting Option (Previous)" : "Rewind 10s"}
          >
            <Rewind className="w-2.5 h-2.5 flex-shrink-0" />
            <span>REW</span>
          </button>
          <button 
            onClick={() => {
              if (showSetupMenu) {
                onSetupAction?.('NEXT');
              } else {
                seekFwd();
              }
            }} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[7px] flex items-center justify-center gap-1 relative font-bold tracking-wider ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${
              showSetupMenu 
                ? '!border-[#ffea00] !text-[#ffea00] !bg-[#ffea00]/20 shadow-[0_0_12px_rgba(255,234,0,0.85)] ring-1 ring-[#ffea00] animate-pulse' 
                : ''
            }`}
            style={{ '--boot-delay': '0.2s' } as React.CSSProperties}
            title={showSetupMenu ? "Change Setting Option (Next)" : "Fast Forward 10s"}
          >
            <span>FF</span>
            <FastForward className="w-2.5 h-2.5 flex-shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={() => {
              if (showSetupMenu) {
                onSetupAction?.('DOWN');
              } else {
                tuneDown();
              }
            }} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[7px] flex items-center justify-center gap-0.5 font-bold tracking-wider ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${
              showSetupMenu 
                ? '!border-[#00e5ff] !text-[#00e5ff] !bg-[#00e5ff]/20 shadow-[0_0_12px_rgba(0,229,255,0.85)] ring-1 ring-[#00e5ff] animate-pulse' 
                : ''
            }`}
            style={{ '--boot-delay': '0.12s' } as React.CSSProperties}
            title={showSetupMenu ? "Scroll Down Settings Menu" : "Tune Down / Prev Track"}
          >
            <ChevronDown className="w-2.5 h-2.5 flex-shrink-0" />
            <span>TUNE -</span>
          </button>
          <button 
            onClick={() => {
              if (showSetupMenu) {
                onSetupAction?.('UP');
              } else {
                tuneUp();
              }
            }} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[7px] flex items-center justify-center gap-0.5 font-bold tracking-wider ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${
              showSetupMenu 
                ? '!border-[#00e5ff] !text-[#00e5ff] !bg-[#00e5ff]/20 shadow-[0_0_12px_rgba(0,229,255,0.85)] ring-1 ring-[#00e5ff] animate-pulse' 
                : ''
            }`}
            style={{ '--boot-delay': '0.22s' } as React.CSSProperties}
            title={showSetupMenu ? "Scroll Up Settings Menu" : "Tune Up / Next Track"}
          >
            <span>TUNE +</span>
            <ChevronUp className="w-2.5 h-2.5 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Center: Circular Knurled VOLUME Dial */}
      <div className="volume-dial-container my-0.5 py-0.5 border-y border-[#1c1c1c] flex flex-col items-center justify-center bg-[#090909]/60 rounded">
        <RotaryDial
          label="VOLUME"
          value={volume}
          onChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.02}
          unit=""
          size={102}
          powered={powered}
          isBooting={isBooting}
          displayDecimals={0}
        />
      </div>

      {/* Transport & Functions */}
      <div className="flex flex-col gap-1 w-full">
        {/* Play/Pause Main Bar - High-Fidelity JDM Logos */}
        <button 
          onClick={playPause} 
          disabled={!powered} 
          className={`btn-backlit h-6 text-[8px] font-bold flex items-center justify-center gap-2 ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${playing ? 'active font-black' : ''}`}
          style={{ '--boot-delay': '0.26s' } as React.CSSProperties}
          title="Play / Pause Audio"
        >
          <div className="flex items-center gap-2.5">
            <Play className={`w-3 h-3 ${playing ? 'fill-current' : 'opacity-65'}`} />
            <div className="h-3 w-[1px] bg-zinc-600/50" />
            <Pause className={`w-3 h-3 ${!playing && powered ? 'fill-current' : 'opacity-65'}`} />
          </div>
        </button>

        {/* ATT & LOUDNESS */}
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={() => setAttenuated(!attenuated)} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${attenuated ? 'active' : ''}`}
            style={{ '--boot-delay': '0.15s' } as React.CSSProperties}
            title="Attenuate -20dB"
          >
            ATT -20dB
          </button>
          <button 
            onClick={() => setLoudness(!loudness)} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${loudness ? 'active' : ''}`}
            style={{ '--boot-delay': '0.25s' } as React.CSSProperties}
            title="Loudness Contour"
          >
            LOUDNESS
          </button>
        </div>

        {/* BACKLIT LEVEL & SELECT */}
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={cycleBacklitLevel || cycleDimmer} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''}`}
            style={{ '--boot-delay': '0.18s' } as React.CSSProperties}
            title="Adjust Button Backlight Level (OFF, 1, 2, 3)"
          >
            BACKLIGHT
          </button>
          <button 
            onClick={selectDisplayMode} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold uppercase ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''}`}
            style={{ '--boot-delay': '0.28s' } as React.CSSProperties}
            title="Select Display Information Mode"
          >
            SELECT
          </button>
        </div>
      </div>

      {/* Bottom: Mechanical POWER Button (Red LED removed) + IR Sensor in Black Hole */}
      <div className="pt-1 border-t border-[#1a1a1a] flex flex-col gap-1">
        <button 
          onClick={togglePower} 
          className="btn-hard h-7 text-[8.5px] font-bold relative group uppercase tracking-wider flex items-center justify-center"
          title="Master System Power (Mechanical Toggle)"
        >
          <span className={`transition-all duration-300 ${powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)] font-black' : 'text-zinc-300'}`}>
            POWER
          </span>
        </button>

        <div className="text-[6.5px] font-label font-bold tracking-wider text-center flex justify-center items-center gap-1">
          {/* Deep Black Sensor Aperture Hole */}
          <div className="w-2.5 h-2.5 rounded-full bg-black border border-black shadow-[inset_0_1.5px_3px_#000] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-[#0a0a0a] via-[#222] to-[#000] border border-[#222] relative overflow-hidden">
              <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/70 rounded-full" />
            </div>
          </div>
          <span className={`transition-all duration-300 ${powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' : 'text-zinc-600'}`}>
            REMOTE SENSOR
          </span>
        </div>
      </div>
    </div>
  );
};
