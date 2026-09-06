import React, { useRef } from 'react';
import { StereoMode } from '../hooks/useStereo';
import { RotaryDial } from './RotaryDial';
import { CarPlayIcon } from './CarPlayIcon';

interface Props {
  powered: boolean;
  isBooting?: boolean;
  cycleTheme: () => void;
  setMode: (mode: StereoMode) => void;
  toggleMtl: () => void;
  mtl: boolean;
  toggleTps: () => void;
  tps: boolean;
  toggleRep: () => void;
  rep: boolean;
  toggleAuto: () => void;
  auto: boolean;
  selectMemory: (n: number) => void;
  memory: number | null;
  loadFile: (file: File) => void;
  loadUsbFile?: (file: File) => void;
  mode?: StereoMode;
  playing?: boolean;
  isYtPlaying?: boolean;
  openStreamDialog?: () => void;
  bass: number;
  adjustBass: (val: number) => void;
  isolated?: boolean;
  onToggleCarPlay?: () => void;
}

export const RightControls: React.FC<Props> = ({ 
  powered, 
  isBooting = false,
  cycleTheme, 
  setMode, 
  toggleMtl, 
  mtl, 
  toggleTps, 
  tps, 
  toggleRep, 
  rep, 
  toggleAuto, 
  auto, 
  selectMemory, 
  memory, 
  loadFile, 
  loadUsbFile, 
  mode, 
  playing,
  isYtPlaying = false,
  openStreamDialog,
  bass, 
  adjustBass,
  isolated = false,
  onToggleCarPlay
}) => {
  const usbInputRef = useRef<HTMLInputElement>(null);
  const auxInputRef = useRef<HTMLInputElement>(null);

  const isUsbActive = mode === 'USB';

  const handleAuxFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
      setMode('AUX');
    }
  };

  const handleUsbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (loadUsbFile) {
        loadUsbFile(e.target.files[0]);
      } else {
        loadFile(e.target.files[0]);
      }
      setMode('USB');
    }
  };

  return (
    <div className="right-controls-panel w-[145px] min-w-[145px] max-w-[145px] flex-shrink-0 flex flex-col justify-between h-full py-1 px-1.5 border-l border-[#080808] shadow-[-1px_0_0_#1a1a1a] bg-gradient-to-b from-[#141414] via-[#101010] to-[#0a0a0a] select-none">
      {/* Source Selection Buttons: TUNER, CD (with STREAM & Beeping LED), TAPE */}
      <div className="flex flex-col gap-1 w-full">
        <div className="grid grid-cols-3 gap-1">
          {/* TUNER */}
          <button 
            onClick={() => setMode('RADIO')} 
            disabled={!powered} 
            className={`btn-backlit h-[26px] text-[7px] uppercase font-bold relative flex flex-col items-center justify-center py-0.5 leading-none ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${mode === 'RADIO' && powered ? 'active' : ''}`}
            style={{ '--boot-delay': '0.85s' } as React.CSSProperties}
            title="Switch to FM/AM Radio Tuner"
          >
            <span>TUNER</span>
            <span className="text-[5px] font-mono tracking-widest text-zinc-400 leading-none mt-0.5">FM/AM</span>
          </button>

          {/* CD Player with Small STREAM text & Beeping LED in Player Colour */}
          <button 
            onClick={() => {
              if (!powered) return;
              setMode('CD');
              if (mode === 'CD' && openStreamDialog) {
                openStreamDialog();
              }
            }} 
            disabled={!powered} 
            className={`btn-backlit h-[26px] text-[7px] uppercase font-bold relative flex flex-col items-center justify-center py-0.5 leading-none group cursor-pointer ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${mode === 'CD' && powered ? 'active' : ''}`}
            style={{ '--boot-delay': '0.90s' } as React.CSSProperties}
            title={isYtPlaying ? "Streaming Active - Click to Change Stream / CD" : "CD Player & Web Stream - Click to Switch or Open Stream"}
          >
            {/* Top row: CD label + LED indicator in recessed black hole */}
            <div className="flex items-center justify-center gap-1.5 w-full">
              {/* Recessed Black LED Hole */}
              <div className="w-2 h-2 rounded-full bg-black border border-black shadow-[inset_0_1px_2px_#000] flex items-center justify-center flex-shrink-0">
                <span 
                  className={`w-[4.5px] h-[4.5px] rounded-full border border-black/80 transition-all flex-shrink-0 ${
                    powered 
                      ? (isYtPlaying 
                          ? 'animate-cd-beep' 
                          : (mode === 'CD' ? 'opacity-100' : 'opacity-40'))
                      : 'bg-[#1a1a1e] opacity-20'
                  }`}
                  style={{
                    backgroundColor: powered ? 'var(--color-lcd-primary)' : '#1a1a1e',
                    boxShadow: powered 
                      ? (isYtPlaying 
                          ? '0 0 6px var(--color-lcd-primary), 0 0 2px #fff' 
                          : (mode === 'CD' ? '0 0 4px var(--color-lcd-primary)' : 'none'))
                      : 'none'
                  }}
                />
              </div>
              <span className="leading-none tracking-wider font-bold">CD</span>
            </div>

            {/* Small STREAM text */}
            <span 
              onClick={(e) => {
                if (powered && openStreamDialog) {
                  e.stopPropagation();
                  setMode('CD');
                  openStreamDialog();
                }
              }}
              className={`text-[5px] font-mono tracking-widest leading-none mt-0.5 uppercase transition-all ${
                isYtPlaying 
                  ? 'text-[var(--color-lcd-primary)] font-bold drop-shadow-[0_0_2px_var(--color-lcd-primary)]' 
                  : (powered ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-600')
              }`}
            >
              STREAM
            </span>
          </button>

          {/* TAPE */}
          <button 
            onClick={() => setMode('TAPE')} 
            disabled={!powered} 
            className={`btn-backlit h-[26px] text-[7px] uppercase font-bold relative flex flex-col items-center justify-center py-0.5 leading-none ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${mode === 'TAPE' && powered ? 'active' : ''}`}
            style={{ '--boot-delay': '0.95s' } as React.CSSProperties}
            title="Switch to Cassette Tape Deck"
          >
            <span>TAPE</span>
            <span className="text-[5px] font-mono tracking-widest text-zinc-400 leading-none mt-0.5">DECK</span>
          </button>
        </div>
      </div>

      {/* Center: Circular Knurled BASS Dial (Bigger & Dark Metal) */}
      <div className="bass-dial-container my-0.5 py-0.5 border-y border-[#1c1c1c] flex flex-col items-center justify-center bg-[#090909]/60 rounded">
        <RotaryDial
          label="BASS"
          value={bass}
          onChange={adjustBass}
          min={-12}
          max={12}
          step={1}
          unit="dB"
          size={102}
          powered={powered}
          isBooting={isBooting}
          displayDecimals={0}
        />
      </div>

      {/* Cassette Tape & Color Controls */}
      <div className="flex flex-col gap-1 w-full">
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={toggleMtl} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${mtl ? 'active' : ''}`}
            style={{ '--boot-delay': '1.1s' } as React.CSSProperties}
            title="Toggle Tape Metal / Normal Bias"
          >
            MTL
          </button>
          <button 
            onClick={toggleTps} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${tps ? 'active' : ''}`}
            style={{ '--boot-delay': '1.15s' } as React.CSSProperties}
            title="Tape Program Sensor (Scan Songs)"
          >
            TPS
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={toggleRep} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${rep ? 'active' : ''}`}
            style={{ '--boot-delay': '1.18s' } as React.CSSProperties}
            title="Repeat Playback Mode"
          >
            REP
          </button>
          <button 
            onClick={toggleAuto} 
            disabled={!powered} 
            className={`btn-backlit h-5 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${auto ? 'active' : ''}`}
            style={{ '--boot-delay': '1.22s' } as React.CSSProperties}
            title="Auto Reverse Mode"
          >
            AUTO
          </button>
        </div>

        {/* Master COLOR Switch (Cycles 11 Backlit Hues) & CarPlay In-Car Fullscreen Mode */}
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={cycleTheme} 
            disabled={!powered} 
            className={`btn-backlit h-6 text-[7px] font-bold tracking-wider flex items-center justify-center gap-1 ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''}`}
            style={{ '--boot-delay': '1.25s' } as React.CSSProperties}
            title="Cycle All Backlight & Display Colors"
          >
            <span>COLOR</span>
          </button>
          <button 
            onClick={onToggleCarPlay} 
            disabled={!powered} 
            className={`btn-backlit h-6 text-[7px] font-bold tracking-wider flex items-center justify-center gap-1 ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${isolated ? 'active font-black shadow-[0_0_6px_var(--color-lcd-primary)]' : ''}`}
            style={{ '--boot-delay': '1.28s' } as React.CSSProperties}
            title={isolated ? "Exit In-Car Fullscreen Mode" : "CarPlay In-Car Mode (Fullscreen Edge-to-Edge)"}
          >
            <CarPlayIcon className="w-2.5 h-2.5" />
            <span>CARPLAY</span>
          </button>
        </div>
      </div>

      {/* Ports: Realistic USB-A Socket & 3.5mm AUX Jack with Illuminated LED Borders */}
      <div className="ports-enclosure w-full bg-[#08080a] rounded-[4px] border border-[#1c1d22] p-1 mt-1 flex flex-col gap-0.5 items-center shadow-inner">
        <div className="flex items-center justify-around w-full px-1">
          {/* USB-A Port with LED Border */}
          <div className="flex flex-col items-center">
            <input 
              type="file" 
              ref={usbInputRef} 
              onChange={handleUsbFile} 
              accept="audio/*" 
              className="hidden" 
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (powered) {
                  setMode('USB');
                  usbInputRef.current?.click();
                }
              }}
              className="usb-port-housing group relative cursor-pointer flex flex-col items-center justify-center p-0.5 rounded-[2px] transition-all duration-300"
              style={{
                border: '1px solid #1c1d22',
                boxShadow: 'none',
                background: '#0a0a0d'
              }}
              title="USB Port - Click to Connect / Load USB Audio"
            >
              {/* Outer USB Beveled Metal Shield */}
              <div className="usb-shield-metal w-[32px] h-[13px] bg-[#14161a] border border-[#2c3038] rounded-[1.5px] relative flex items-center justify-center shadow-inner overflow-hidden">
                {/* Pure Pitch Black Inner Cavity */}
                <div className="usb-inner-cavity w-[28px] h-[9px] bg-black rounded-[1px] relative flex items-center shadow-[inset_0_2px_5px_#000000]">
                  {/* USB Black Plastic Tongue with 4 Gold Contacts */}
                  <div className="usb-tongue w-[18px] h-[4px] bg-[#0a0a0e] absolute top-0 left-[5px] rounded-b-[0.5px] border-b border-[#1c1d24] flex justify-around px-1 items-end pb-[0.5px] shadow-[inset_0_1px_1px_#000000]">
                    <span className="w-[1.5px] h-[1.5px] bg-[#d4af37]" />
                    <span className="w-[1.5px] h-[1.5px] bg-[#d4af37]" />
                    <span className="w-[1.5px] h-[1.5px] bg-[#d4af37]" />
                    <span className="w-[1.5px] h-[1.5px] bg-[#d4af37]" />
                  </div>
                </div>
              </div>
            </div>
            <span className={`text-[6px] font-mono font-bold tracking-wider mt-0.5 transition-all ${powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-600'}`}>
              USB
            </span>
          </div>

          {/* 3.5mm AUX IN Jack */}
          <div className="flex flex-col items-center">
            <input 
              type="file" 
              ref={auxInputRef} 
              onChange={handleAuxFile} 
              accept="audio/*" 
              className="hidden" 
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (powered) {
                  setMode('AUX');
                  auxInputRef.current?.click();
                }
              }}
              className="aux-port-housing group relative cursor-pointer flex items-center justify-center rounded-full p-[2px] transition-all duration-300"
              style={{
                border: '1px solid #1c1d22',
                boxShadow: 'none',
                background: '#0a0a0d'
              }}
              title="3.5mm AUX IN Jack - Click to Plug In AUX Audio"
            >
              {/* Outer Milled Metal Collar */}
              <div className="aux-collar-metal w-[17px] h-[17px] rounded-full bg-gradient-to-tr from-[#1b1c20] via-[#2d3038] to-[#121316] border border-[#383d47] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {/* Pure Pitch Black 3.5mm Aperture Bore Hole */}
                <div className="aux-inner-bore w-[8px] h-[8px] rounded-full bg-black border border-black shadow-[inset_0_3px_5px_#000000] relative flex items-center justify-center">
                  {/* Brass contact leaf in dark socket */}
                  <div className="w-[2px] h-[2.5px] bg-[#9a7828] rounded-full opacity-50" />
                </div>
              </div>
            </div>
            <span className={`text-[6px] font-mono font-bold tracking-wider mt-0.5 transition-all ${powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-600'}`}>
              AUX IN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
