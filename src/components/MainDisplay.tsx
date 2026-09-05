import React, { useState, useEffect, useMemo } from 'react';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { StereoMode, VisualizerMode, JDM_STATIONS } from '../hooks/useStereo';
import { AudioEngine, EqBand } from '../audio/AudioEngine';

interface Props {
  powered: boolean;
  isBooting: boolean;
  mode: StereoMode;
  eq: Record<EqBand, number>;
  dimmerLevel: number;
  frequency: number;
  volume: number;
  engine: AudioEngine;
  ytTitle: string;
  loadYoutubeUrl: (url: string) => void;
  mtl: boolean;
  loudness: boolean;
  memory: number | null;
  tps?: boolean;
  bSkip?: boolean;
  rep?: boolean;
  auto?: boolean;
  playing?: boolean;
  isYtPlaying?: boolean;
  theme?: string;
  selectMemory?: (n: number) => void;
  visualizerMode?: VisualizerMode;
  cycleVisualizerMode?: () => void;
  toastMessage?: string | null;
  speakerBalance?: 'FRONT' | 'REAR' | 'CENTER';
  toggleSpeakerBalance?: () => void;
  activePresetName?: string;
  showStreamDialog?: boolean;
  setShowStreamDialog?: (val: boolean) => void;
  setMode?: (m: StereoMode) => void;
  openStreamDialog?: () => void;
}

export const MainDisplay: React.FC<Props> = ({ 
  powered, isBooting, mode, eq, dimmerLevel, frequency, volume, engine, ytTitle, loadYoutubeUrl, 
  mtl, loudness, memory, tps, bSkip, rep, auto, playing = false, isYtPlaying = false,
  theme, selectMemory, visualizerMode = 'FIRE_SPECTRUM', cycleVisualizerMode, toastMessage,
  speakerBalance = 'CENTER', toggleSpeakerBalance, activePresetName = 'HIP-HOP',
  showStreamDialog, setShowStreamDialog, setMode, openStreamDialog
}) => {
  const [internalShowYt, setInternalShowYt] = useState(false);
  const isStreamModalOpen = showStreamDialog !== undefined ? showStreamDialog : internalShowYt;
  const setStreamModalOpen = setShowStreamDialog || setInternalShowYt;
  const [ytUrl, setYtUrl] = useState('');
  const [tapeAngle, setTapeAngle] = useState(0);
  const [bootStatusText, setBootStatusText] = useState('>> SYSTEM IGNITION <<');
  const [bootVuLevel, setBootVuLevel] = useState(0);

  // Synchronized retro HELLO startup sequence for main display
  useEffect(() => {
    if (!isBooting || !powered) {
      setBootVuLevel(0);
      return;
    }

    const start = performance.now();
    let animId: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed < 400) {
        setBootStatusText('· · · 起動中 · · ·');
        setBootVuLevel(Math.sin(elapsed * 0.01) > 0 ? 1 : 0);
      } else if (elapsed < 1100) {
        setBootStatusText('よ');
        setBootVuLevel(2);
      } else if (elapsed < 1900) {
        setBootStatusText('よ う');
        setBootVuLevel(3);
      } else if (elapsed < 2700) {
        setBootStatusText('よ う こ');
        setBootVuLevel(4);
      } else if (elapsed < 3800) {
        setBootStatusText('よ う こ そ');
        setBootVuLevel(5);
      } else if (elapsed < 4600) {
        setBootStatusText('· · · よ う こ そ · · ·');
        const pulse = (Math.sin(elapsed * 0.008) + 1) / 2;
        setBootVuLevel(4 + Math.floor(pulse * 3));
      } else {
        setBootStatusText('JDM HIGH-FIDELITY STEREO READY');
        setBootVuLevel(2);
      }

      if (elapsed < 5200) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isBooting, powered]);

  // Spin tape spools when playing
  useEffect(() => {
    if (!powered || !playing) return;
    const interval = setInterval(() => {
      setTapeAngle(a => (a + 12) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [powered, playing]);

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ytUrl) {
      loadYoutubeUrl(ytUrl);
      setStreamModalOpen(false);
      setYtUrl('');
    }
  };

  const getFreqString = () => {
    if (mode === 'RADIO') return frequency.toFixed(1);
    if (mode === 'CD') return '01.24';
    if (mode === 'TAPE') return 'A-04';
    if (mode === 'AUX') return 'LINE';
    if (mode === 'USB') return 'U-01';
    return '----';
  };

  const currentStation = useMemo(() => {
    return JDM_STATIONS.find(s => Math.abs(s.freq - frequency) < 0.25);
  }, [frequency]);

  const displaySongName = useMemo(() => {
    if (!powered) return '888.8';
    if (isBooting) return bootStatusText;
    if (toastMessage) return toastMessage.toUpperCase();
    if (ytTitle) return ytTitle.toUpperCase();
    if (mode === 'RADIO') {
      const st = JDM_STATIONS.find(s => Math.abs(s.freq - frequency) < 0.25);
      if (st) {
        if (st.preset === 3) return '90S ENGLISH HITS 81.3 - 90S POP & DANCE';
        if (st.preset === 4) return 'ENGLISH HITS LATEST 82.5 - TOP 40';
        if (st.preset === 5) return '2000S BOLLYWOOD 84.7 - 2000S HINDI HITS';
        return `${st.name} - STEREO FM`;
      }
      return `${frequency.toFixed(1)} MHZ - TOKYO FM`;
    }
    if (mode === 'CD') return 'TRACK 01 - TIME MACHINE 1994 - 01:24';
    if (mode === 'TAPE') return 'CASSETTE SIDE-A - TYPE II CHROME - A-04';
    if (mode === 'USB') return 'USB-01 - 320KBPS MP3 - HI-RES';
    if (mode === 'AUX') return 'AUX IN - 3.5MM STEREO LINE';
    return 'STANDBY';
  }, [powered, isBooting, bootStatusText, toastMessage, ytTitle, mode, frequency]);

  // Station or Channel Number displayed next to EQ bands
  const currentStationNumber = useMemo(() => {
    if (!powered) return '--';
    if (mode === 'RADIO') {
      if (memory !== null) return String(memory).padStart(2, '0');
      const stIdx = [76.1, 80.0, 81.3, 82.5, 84.7, 89.7].findIndex(f => Math.abs(f - frequency) < 0.25);
      return stIdx !== -1 ? String(stIdx + 1).padStart(2, '0') : '01';
    }
    if (mode === 'CD') return '01';
    if (mode === 'TAPE') return 'A1';
    if (mode === 'AUX') return 'AU';
    if (mode === 'USB') return 'U1';
    return '--';
  }, [powered, mode, memory, frequency]);

  // Dual VU level computation based on audio/volume and JDM tachometer sweep on boot
  const vuLeft = powered 
    ? (isBooting ? bootVuLevel : (playing ? Math.min(8, Math.floor((volume * 7) + (Math.random() * 2))) : 0)) 
    : 0;
  const vuRight = powered 
    ? (isBooting ? bootVuLevel : (playing ? Math.min(8, Math.floor((volume * 7) + (Math.random() * 2))) : 0)) 
    : 0;

  return (
    <div className="flex-1 flex flex-col justify-between relative px-2 py-1 select-none h-[270px] min-h-[270px] max-h-[270px] w-[550px] min-w-[550px] max-w-[550px] flex-shrink-0 overflow-hidden">
      {/* Web Stream & YouTube Modal */}
      {isStreamModalOpen && (
        <div className="absolute top-2 left-4 right-4 z-50 bg-[#0f0f0f] border-2 border-[#444] p-3 rounded shadow-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-1.5">
            <span className="text-[10px] font-label font-bold text-zinc-200 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff3333] shadow-[0_0_6px_#ff3333]"></span>
              WEB STREAM / YOUTUBE AUDIO
            </span>
            <button 
              type="button" 
              onClick={() => setStreamModalOpen(false)} 
              className="text-[10px] text-zinc-400 hover:text-white px-1.5 font-bold cursor-pointer"
            >
              X
            </button>
          </div>

          <form onSubmit={handleYtSubmit} className="flex gap-1.5 mt-1">
            <input 
              autoFocus
              type="text" 
              placeholder="Paste YouTube Link or Video ID"
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              className="flex-1 bg-black text-[10px] font-mono text-emerald-400 p-1.5 outline-none border border-[#333] rounded-sm focus:border-emerald-500"
            />
            <button type="submit" className="bg-[#242424] hover:bg-[#333] text-[9px] font-label text-white px-3 border border-[#555] rounded-sm font-bold active:scale-95 cursor-pointer">
              LOAD
            </button>
          </form>
        </div>
      )}

      {/* Top Deck Section: Compact Disc & Logic Tape Slot */}
      <div className="flex flex-col w-full px-1 gap-1">
        {/* Motorized CD Slot / Port - Click to Open Stream Options */}
        <div 
          onClick={() => {
            if (openStreamDialog) {
              openStreamDialog();
            } else if (setShowStreamDialog) {
              setShowStreamDialog(true);
            } else {
              setStreamModalOpen(true);
            }
            if (setMode) {
              setMode('CD');
            }
          }}
          className="w-full h-4 bg-gradient-to-b from-[#18191c] via-[#08090b] to-[#040405] rounded-[2px] border border-[#22252b] hover:border-[#444a57] shadow-[inset_0_3px_6px_rgba(0,0,0,0.98),inset_0_-1px_1px_rgba(255,255,255,0.06)] relative flex items-center px-3 overflow-hidden cursor-pointer group/cd transition-all duration-200"
          title="CD Port - Click to Open Stream Options"
        >
           {/* Top and bottom subtle felt dust wiper lips */}
           <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#0d0d0f] shadow-[0_1px_0_rgba(0,0,0,0.9)]" />
           <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#0d0d0f] shadow-[0_-1px_0_rgba(0,0,0,0.9)]" />
           {/* Deep recessed empty CD slot cavity */}
           <div className="w-full h-[2px] bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,1)] group-hover/cd:bg-zinc-800 transition-colors" />
           {/* Minimalist CD slot alignment status LED and silkscreen */}
           <div className="absolute left-2.5 flex items-center gap-1.5 pointer-events-none">
             <div className={`w-1 h-1 rounded-full transition-colors ${powered ? 'bg-[var(--color-lcd-secondary)] shadow-[0_0_3px_var(--color-lcd-secondary)]' : 'bg-zinc-700'}`} />
             <span className="text-[5.5px] font-label tracking-widest text-zinc-500 font-bold group-hover/cd:text-zinc-300 transition-colors">CD INLET / STREAM</span>
           </div>
           <div className="absolute right-2.5 text-[5.5px] font-label tracking-widest text-zinc-500 font-bold pointer-events-none flex items-center gap-1 group-hover/cd:text-zinc-300 transition-colors">
             <span>COMPACT DISC DIGITAL AUDIO</span>
             <div className="w-1.5 h-1 border border-zinc-700 rounded-[0.5px]" />
           </div>
        </div>

        {/* Tape / Web Stream Slot - Empty by default, opens streamer on click */}
        <div className="flex items-center gap-2">
          <div className="w-[11px] h-[11px] rounded-full bg-[#050505] border border-[#333] shadow-inner flex items-center justify-center">
            <div className="w-[4px] h-[4px] rounded-full bg-black"></div>
          </div>
          
          {/* Cassette Slot - Pure Black and Empty with No Text, No Gradient */}
          <div 
            className="flex-1 tape-slot h-9 rounded-sm flex items-center justify-between relative border border-black bg-black overflow-hidden"
            title="Cassette Bay"
          >
            {/* Authentic Black Empty Cassette Bay Cavity - Zero Text, Pure Black */}
            <div className="w-full h-full flex items-center justify-between px-6 relative bg-black">
              {/* Deep recessed pitch black cavity */}
              <div className="absolute inset-0 bg-black" />
              
              {/* Left drive spindle hub */}
              <div className="z-10 w-5 h-5 rounded-full border border-black bg-[#0a0a0a] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-[#161616] border border-[#222]" />
                <div className="absolute top-0.5 w-0.5 h-1 bg-[#262626]" />
                <div className="absolute bottom-0.5 w-0.5 h-1 bg-[#262626]" />
                <div className="absolute left-0.5 w-1 h-0.5 bg-[#262626]" />
                <div className="absolute right-0.5 w-1 h-0.5 bg-[#262626]" />
              </div>

              {/* Center recessed tape guide track aperture - completely black */}
              <div className="z-10 flex-1 max-w-[140px] h-3.5 mx-3 rounded-[2px] bg-[#070707] border border-[#141414] flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full border-t border-[#111]" />
              </div>

              {/* Right drive spindle hub */}
              <div className="z-10 w-5 h-5 rounded-full border border-black bg-[#0a0a0a] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-[#161616] border border-[#222]" />
                <div className="absolute top-0.5 w-0.5 h-1 bg-[#262626]" />
                <div className="absolute bottom-0.5 w-0.5 h-1 bg-[#262626]" />
                <div className="absolute left-0.5 w-1 h-0.5 bg-[#262626]" />
                <div className="absolute right-0.5 w-1 h-0.5 bg-[#262626]" />
              </div>
            </div>
          </div>
          
          <div className="w-[11px] h-[11px] rounded-full bg-[#050505] border border-[#333] shadow-inner flex items-center justify-center">
            <div className="w-[4px] h-[4px] rounded-full bg-black"></div>
          </div>

          {/* Logic Control Deck Badges (Japanese Localization) */}
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0 whitespace-nowrap">
            <span className={`text-[7px] font-label tracking-wider font-bold transition-all duration-300 ${powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' : 'text-zinc-400'}`}>
              ロジック デッキ
            </span>
            <span className="text-zinc-600 text-[8px]">•</span>
            <span className={`text-[6.5px] border px-1 py-[1px] rounded-[1px] font-bold transition-all duration-300 whitespace-nowrap ${powered ? 'text-[var(--color-lcd-secondary)] border-[var(--color-lcd-secondary)] drop-shadow-[0_0_2px_var(--color-lcd-secondary)]' : 'text-zinc-400 border-zinc-600'}`}>
              ドルビー B·C
            </span>
            <span className={`text-[7.5px] font-bold font-label italic tracking-tight transition-all duration-300 whitespace-nowrap ${powered ? 'text-white drop-shadow-[0_0_3px_var(--color-lcd-primary)]' : 'text-zinc-500'}`}>
              ジーワン
            </span>
          </div>
        </div>
      </div>

      {/* Brand & Model Banner */}
      <div className="flex justify-between items-end px-2 mt-1 mb-0.5">
        <div className="flex items-center gap-1.5 z-30 pointer-events-none">
          {/* Authentic Panasonic Logo PNG with Synchronized Neon/VFD Glow */}
          <div 
            className="h-[17px] w-[114px] transition-all duration-300 relative flex items-center brand-logo-led"
            style={{
              backgroundColor: powered ? 'var(--color-lcd-primary)' : '#24252a',
              WebkitMaskImage: 'url(/panasonic-logo.png)',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'left center',
              maskImage: 'url(/panasonic-logo.png)',
              maskRepeat: 'no-repeat',
              maskSize: 'contain',
              maskPosition: 'left center',
              filter: powered 
                ? 'drop-shadow(0 0 3px var(--color-lcd-primary)) drop-shadow(0 0 8px rgba(var(--color-lcd-primary-rgb), 0.8))' 
                : 'none',
              opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.35
            }}
            role="img"
            aria-label="Panasonic"
          >
            <img 
              src="/panasonic-logo.png" 
              alt="Panasonic" 
              className="opacity-0 w-full h-full object-contain pointer-events-none" 
            />
          </div>
          <span 
            className="text-[9px] font-normal tracking-normal text-zinc-400 transition-all duration-300 select-none pt-0.5 flex items-center gap-1.5 brand-model-badge" 
            style={{ 
              textShadow: 'none', 
              color: '#888',
              opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.4
            }}
          >
            <span>CQ-TX5500</span>
            <span className="rainbow-gradient-text tracking-wider text-[9.5px]">OLED</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className={`text-[6.5px] font-label tracking-widest uppercase transition-all duration-300 brand-subtext ${powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' : 'text-zinc-500'}`}
            style={{ opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.35 }}
          >
            VACUUM TUBE D·A DRIVE <span className={`font-bold ml-1 ${powered ? 'text-white' : 'text-zinc-400'}`}>VZ201</span>
          </span>
        </div>
      </div>

      {/* Main Glass LCD / VFD Display (Enlarged Visualizer Viewport) */}
      <div className="lcd-glass h-[170px] p-2 flex border-[2px] border-black ml-1 mr-1 relative overflow-hidden group rounded-[2px]">
        {/* Optical Glass Sheen & Glare */}
        <div className="absolute inset-0 z-50 pointer-events-none opacity-30 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.3)] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1500ms] ease-in-out"></div>
        <div className="absolute inset-0 z-40 pointer-events-none border-[rgba(255,255,255,0.05)] border-t-[rgba(255,255,255,0.2)] border-l-[rgba(255,255,255,0.1)] border-solid border"></div>
        
        {/* Left Side: Rich Information Matrix */}
        <div className="w-[245px] min-w-[245px] max-w-[245px] flex flex-col justify-between h-full pr-2 flex-shrink-0">
          {/* Top Status Flags */}
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-1">
            {/* Mode Selectors */}
            <div className="flex gap-1.5">
              <span className={`text-[7.5px] font-label font-bold uppercase tracking-wider ${powered && mode === 'RADIO' ? 'lcd-text' : 'lcd-text off'}`}>
                TUNER <span className={`text-[5.5px] border px-[1.5px] ${powered && auto ? 'border-current' : 'border-transparent'}`}>ST</span>
              </span>
              <span className={`text-[7.5px] font-label font-bold uppercase tracking-wider ${powered && mode === 'CD' ? 'lcd-text' : 'lcd-text off'}`}>CD</span>
              <span className={`text-[7.5px] font-label font-bold uppercase tracking-wider ${powered && mode === 'TAPE' ? 'lcd-text' : 'lcd-text off'}`}>TAPE</span>
              <span className={`text-[7.5px] font-label font-bold uppercase tracking-wider ${powered && mode === 'AUX' ? 'lcd-text' : 'lcd-text off'}`}>AUX</span>
              <span className={`text-[7.5px] font-label font-bold uppercase tracking-wider ${powered && mode === 'USB' ? 'lcd-text' : 'lcd-text off'}`}>USB</span>
            </div>

            {/* Audio Spec Flags */}
            <div className="flex items-center gap-1">
              <span className={`text-[6px] font-label px-0.5 border border-current rounded-[1px] ${powered ? 'lcd-text amber' : 'lcd-text amber off'}`}>
                44.1k
              </span>
              <span className={`text-[6px] font-label px-0.5 border border-current rounded-[1px] ${powered ? 'lcd-text amber' : 'lcd-text amber off'}`}>
                320k
              </span>
              <span className={`text-[6px] font-label px-0.5 border border-current rounded-[1px] ${powered ? 'lcd-text' : 'lcd-text off'}`}>
                DSP
              </span>
            </div>
          </div>

          {/* Center Main Numerics & VU Channel Meters */}
          <div className="flex items-center justify-between my-1">
            {/* Dual Left & Right VU Peak Meters */}
            <div className="flex flex-col gap-0.5 w-[38px] flex-shrink-0">
              <div className="flex items-center justify-between text-[5.5px] font-label text-zinc-500">
                <span>L</span>
                <span>dB</span>
                <span>R</span>
              </div>
              
              <div className="flex items-center justify-between gap-0.5">
                {/* L Channel */}
                <div className="flex flex-col gap-[1.5px] flex-1">
                  {[7, 6, 5, 4, 3, 2, 1, 0].map(i => (
                    <div 
                      key={`l-${i}`} 
                      className={`h-[2.5px] w-full rounded-[0.5px] ${
                        i < vuLeft 
                          ? (i >= 6 ? 'bg-[var(--color-lcd-danger)] shadow-[0_0_3px_var(--color-lcd-danger)]' : i >= 4 ? 'bg-[var(--color-lcd-secondary)] shadow-[0_0_3px_var(--color-lcd-secondary)]' : 'bg-[var(--color-lcd-primary)] shadow-[0_0_3px_var(--color-lcd-primary)]') 
                          : 'bg-[var(--color-lcd-primary-off)]'
                      }`}
                    />
                  ))}
                </div>

                {/* dB Scale Labels */}
                <div className="flex flex-col justify-between text-[4.5px] font-mono text-zinc-400 h-9 py-0.5 leading-none text-center">
                  <span className="text-[var(--color-lcd-danger)]">+6</span>
                  <span>0</span>
                  <span>-6</span>
                  <span>-18</span>
                </div>

                {/* R Channel */}
                <div className="flex flex-col gap-[1.5px] flex-1">
                  {[7, 6, 5, 4, 3, 2, 1, 0].map(i => (
                    <div 
                      key={`r-${i}`} 
                      className={`h-[2.5px] w-full rounded-[0.5px] ${
                        i < vuRight 
                          ? (i >= 6 ? 'bg-[var(--color-lcd-danger)] shadow-[0_0_3px_var(--color-lcd-danger)]' : i >= 4 ? 'bg-[var(--color-lcd-secondary)] shadow-[0_0_3px_var(--color-lcd-secondary)]' : 'bg-[var(--color-lcd-primary)] shadow-[0_0_3px_var(--color-lcd-primary)]') 
                          : 'bg-[var(--color-lcd-primary-off)]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mini EQ Curve display */}
            <div className="flex flex-col items-center mx-1 flex-shrink-0">
              <span className="text-[5px] font-label text-zinc-500 uppercase tracking-widest mb-0.5">7バンドEQ</span>
              <div className="flex items-end gap-[1.5px] h-9 w-11 p-0.5 border border-[rgba(255,255,255,0.08)] bg-black/40">
                {[63, 125, 250, 500, 1000, 3500, 10000].map(band => {
                  const val = eq[band as EqBand] || 0;
                  const height = 50 + (val / 12) * 45;
                  return (
                    <div 
                      key={band} 
                      className="flex-1 rounded-t-[0.5px]" 
                      style={{ 
                        height: `${height}%`, 
                        backgroundColor: powered ? 'var(--color-lcd-secondary)' : 'var(--color-lcd-primary-off)', 
                        boxShadow: powered ? '0 0 2px var(--color-lcd-secondary)' : 'none' 
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Station Number Indicator (Right side of EQ bands) */}
            <div className="flex flex-col items-center justify-between h-9 px-1 py-0.5 border border-[rgba(255,255,255,0.12)] bg-black/60 rounded-[2px] min-w-[26px] shadow-inner flex-shrink-0">
              <span className="text-[4.5px] font-label text-zinc-400 tracking-wider font-bold uppercase">CH</span>
              <span className={`text-[16px] font-lcd leading-none tracking-tight font-bold ${powered ? 'lcd-text amber' : 'lcd-text off'}`}>
                {currentStationNumber}
              </span>
              <span className="text-[4.5px] font-mono text-zinc-500">
                {mode === 'RADIO' ? 'PRE' : 'TRK'}
              </span>
            </div>

            {/* Main Display / Song Name Marquee Readout */}
            <div className="flex flex-col items-end justify-center relative flex-1 min-w-0 pr-0.5 overflow-hidden">
              <div className="text-[6px] font-mono tracking-wider text-zinc-400 mb-0.5 flex justify-between w-full">
                <span>{mode === 'RADIO' ? 'FM STEREO' : mode === 'CD' ? 'CD-DA' : 'AUDIO'}</span>
                <span>SIG |||</span>
              </div>
              <div className="relative w-full h-[40px] flex items-center justify-end overflow-hidden">
                {/* Ghost digits in the background */}
                <span className="text-[28px] font-lcd lcd-text off tracking-tight pointer-events-none select-none absolute right-0 top-0.5 whitespace-nowrap opacity-15 leading-none">
                  888.8
                </span>
                
                {/* Real Marquee Readout */}
                <div className="w-full relative overflow-hidden flex items-center h-full">
                  {/* Subtle fade edges for classic VFD window */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-[#050506] to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-[#050506] to-transparent z-10 pointer-events-none" />

                  <div className={`w-full whitespace-nowrap text-[25px] font-lcd tracking-wider leading-none py-0.5 flex items-center ${powered ? 'lcd-text' : 'opacity-0'}`}>
                    <div className="animate-marquee-scroll flex gap-6 items-center">
                      <span>{displaySongName} &nbsp;•&nbsp;</span>
                      <span>{displaySongName} &nbsp;•&nbsp;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Display Row: Marquee Track Title & Function Badges */}
          <div className="flex flex-col gap-0.5 border-t border-[rgba(255,255,255,0.08)] pt-1">
            <div className="flex justify-between items-center w-full min-h-[16px]">
              {/* Marquee Audio / Stream Title or Toast Status Message */}
              <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0 mr-1.5 min-h-[14px]">
                <span className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 py-[0.5px] rounded-[1px] leading-none shrink-0 ${
                  powered ? (toastMessage ? 'lcd-text amber' : 'lcd-text') : 'lcd-text off'
                }`}>
                  {toastMessage ? 'SYS' : 'NOW'}
                </span>
                <div className={`text-[9.5px] font-lcd tracking-wide leading-tight truncate select-none ${
                  powered ? (toastMessage ? 'lcd-text amber font-bold' : 'lcd-text') : 'opacity-0'
                }`}>
                  {toastMessage || ytTitle || (mode === 'RADIO' ? (currentStation?.name || `FM ${frequency.toFixed(1)}`) : mode === 'CD' ? 'CD-DA 44.1K' : 'READY')}
                </div>
              </div>

              {/* Disc Changer matrix */}
              <div className="flex items-center gap-0.5 text-[7px] font-mono leading-none shrink-0 select-none">
                <span className="text-[6.5px] font-bold tracking-wider text-zinc-400">DISC:</span>
                {[1, 2, 3, 4, 5, 6].map(d => (
                  <span 
                    key={d} 
                    className={`min-w-[11px] h-[12px] flex items-center justify-center font-bold text-[7px] leading-none rounded-[1px] border transition-all ${
                      powered && (mode === 'CD' ? d === 1 : d === 1) 
                        ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.18)] shadow-[0_0_3px_var(--color-lcd-primary)]' 
                        : 'border-zinc-700/60 text-zinc-400 bg-black/40'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Status Badges */}
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-1">
                <div className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 rounded-[1px] ${powered && mtl ? 'lcd-text amber' : 'lcd-text amber off'}`}>MTL</div>
                <div className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 rounded-[1px] ${powered && loudness ? 'lcd-text amber' : 'lcd-text amber off'}`}>LOUD</div>
                <div className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 rounded-[1px] ${powered && tps ? 'lcd-text amber' : 'lcd-text amber off'}`}>TPS</div>
                <div className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 rounded-[1px] ${powered && rep ? 'lcd-text amber' : 'lcd-text amber off'}`}>REP</div>
                <div className={`text-[6px] font-label font-bold uppercase border border-current px-0.5 rounded-[1px] ${powered && auto ? 'lcd-text amber' : 'lcd-text amber off'}`}>AUTO</div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[6.5px] font-label font-bold uppercase ${powered && mode === 'RADIO' ? 'lcd-text amber' : 'lcd-text amber off'}`}>STEREO</span>
                <span className={`text-[6.5px] font-label font-bold uppercase ${powered && memory !== null ? 'lcd-text amber' : 'lcd-text amber off'}`}>MEM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Spectrum Analyzer with Frequency Scale & Visualizer (Always Fixed Width & Fully Visible) */}
        <div className="w-[270px] min-w-[270px] max-w-[270px] h-full relative pl-2 border-l border-[rgba(255,255,255,0.08)] flex flex-col justify-between flex-shrink-0">
          <div className="flex-1 w-full h-[135px] relative overflow-hidden flex items-center justify-center">
            <SpectrumAnalyzer 
              engine={engine} 
              powered={powered} 
              dimmerLevel={dimmerLevel} 
              isBooting={isBooting} 
              isYtPlaying={isYtPlaying}
              playing={playing}
              theme={theme}
              visualizerMode={visualizerMode}
            />
          </div>
          
          {/* Frequency Labels below */}
          <div className={`flex justify-between text-[6px] font-mono px-0.5 tracking-tighter border-t border-[rgba(255,255,255,0.06)] pt-0.5 transition-all duration-300 ${
            (isBooting || visualizerMode === 'JDM_CAR_DOTS' || visualizerMode === 'JDM_TANDEM_DOTS' || visualizerMode === 'JDM_CAR_OLED' || visualizerMode === 'SERENE_JAPAN')
              ? 'opacity-0 pointer-events-none'
              : (powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' : 'text-zinc-600')
          }`}>
            <span>31.5</span>
            <span>63</span>
            <span>125</span>
            <span>250</span>
            <span>500</span>
            <span>1k</span>
            <span>2k</span>
            <span>4k</span>
            <span>8k</span>
            <span>16k</span>
          </div>
        </div>
      </div>

      {/* JDM Automotive Backlit Preset Key Bank Below Display Glass */}
      <div className="flex items-center justify-between gap-1 mt-1.5 px-1 py-0.5 bg-[#0b0b0b] rounded-[3px] border border-[#1a1a1a] shadow-inner h-[28px] min-h-[28px] max-h-[28px] w-full flex-shrink-0">
        {/* Speaker Fader & Visualizer Selector */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            disabled={!powered}
            onClick={toggleSpeakerBalance}
            className={`btn-backlit px-1 h-5 w-[42px] min-w-[42px] max-w-[42px] flex-shrink-0 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${speakerBalance === 'FRONT' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.4s' } as React.CSSProperties}
            title="Front Speaker Balance"
          >
            FRONT
          </button>
          <button 
            disabled={!powered}
            onClick={toggleSpeakerBalance}
            className={`btn-backlit px-1 h-5 w-[38px] min-w-[38px] max-w-[38px] flex-shrink-0 text-[6.5px] font-bold ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${speakerBalance === 'REAR' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.45s' } as React.CSSProperties}
            title="Rear Speaker Balance"
          >
            REAR
          </button>

          {/* Visualizer Mode Cycle Button - Displays 'VISUALISER' only */}
          <button
            disabled={!powered}
            onClick={cycleVisualizerMode}
            className={`btn-backlit px-1 h-5 w-[72px] min-w-[72px] max-w-[72px] flex-shrink-0 text-[6.5px] font-bold uppercase tracking-wider flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''}`}
            style={{ '--boot-delay': '0.5s' } as React.CSSProperties}
            title="Cycle Visualizer Mode"
          >
            VISUALISER
          </button>
        </div>

        {/* 6 Direct Channel Presets (Illuminated in Display Theme with Boot Wave Delay) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[1, 2, 3, 4, 5, 6].map((ch, idx) => {
            const isSelected = powered && memory === ch;
            const delay = 0.55 + idx * 0.08;
            return (
              <button
                key={ch}
                disabled={!powered}
                onClick={() => selectMemory && selectMemory(ch)}
                className={`btn-backlit px-1 h-5 w-[28px] min-w-[28px] max-w-[28px] flex-shrink-0 text-[7.5px] font-mono flex items-center justify-center gap-0.5 relative transition-all ${
                  powered ? 'lit' : ''
                } ${isBooting ? 'booting' : ''} ${
                  isSelected 
                    ? 'active font-bold' 
                    : ''
                }`}
                style={{ '--boot-delay': `${delay}s` } as React.CSSProperties}
                title={`Select Preset Station ${ch}`}
              >
                <span>{ch}</span>
                <span className="text-[5.5px] opacity-70">CH</span>
                <div 
                  className={`w-1 h-1 rounded-full transition-all ${
                    isSelected 
                      ? 'bg-[var(--color-lcd-primary)]' 
                      : (powered ? 'bg-[var(--color-lcd-primary-off)]' : 'bg-zinc-800')
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
