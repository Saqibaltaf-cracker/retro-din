/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StereoDeck } from './components/StereoDeck';
import { LeatherBackground } from './components/LeatherBackground';
import { KeyBindingsModal } from './components/KeyBindingsModal';
import { SettingsModal } from './components/SettingsModal';
import { useStereo } from './hooks/useStereo';
import { usePerformanceSettings } from './hooks/usePerformanceSettings';
import { 
  ExternalLink, 
  Video, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  Smartphone
} from 'lucide-react';

export default function App() {
  const stereo = useStereo();
  const {
    settings: perfSettings,
    diagnostics,
    updateSetting,
    toggleLowEndMode,
    applyPreset,
    autoOptimize,
    resetDefaults
  } = usePerformanceSettings();

  const [isolated, setIsolated] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(1.0);
  const [showCopyright, setShowCopyright] = useState(false);
  const [showPlayerGuide, setShowPlayerGuide] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dismissMobileTip, setDismissMobileTip] = useState(false);
  const [bypassPortrait, setBypassPortrait] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const isPortraitMode = windowDimensions.height > windowDimensions.width && windowDimensions.width < 768;
  const showRotatePrompt = !isolated && isPortraitMode && !bypassPortrait && (diagnostics.isMobile || windowDimensions.width < 640);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prevSilverRef = React.useRef(perfSettings.vintageSilver);
  useEffect(() => {
    if (perfSettings.vintageSilver && !prevSilverRef.current) {
      stereo.setTheme('blue');
      stereo.setDimmerLevel(1);
      stereo.setBacklitLevel(0);
    }
    prevSilverRef.current = perfSettings.vintageSilver;
  }, [perfSettings.vintageSilver, stereo]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (key === 'Escape') {
        if (showSettingsModal) {
          setShowSettingsModal(false);
          return;
        }
        if (showPlayerGuide) {
          setShowPlayerGuide(false);
          return;
        }
        if (isolated) {
          setIsolated(false);
          setZoomMultiplier(1.0);
          return;
        }
      }

      if (key === ',' || key === 'O') {
        e.preventDefault();
        setShowSettingsModal(prev => !prev);
        return;
      }

      if (key === '?' || key === 'h' || key === 'H') {
        e.preventDefault();
        setShowPlayerGuide(prev => !prev);
        return;
      }

      if (key === ' ') {
        e.preventDefault();
        stereo.playPause();
        return;
      }

      if (key === 'p' || key === 'P') {
        e.preventDefault();
        stereo.togglePower();
        return;
      }

      if (key === 'm' || key === 'M') {
        e.preventDefault();
        stereo.setAttenuated(!stereo.attenuated);
        return;
      }

      if (key === 's' || key === 'S') {
        e.preventDefault();
        const modes = ['RADIO', 'TAPE', 'CD', 'AUX', 'USB'] as const;
        const currentIdx = modes.indexOf(stereo.mode as any);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        stereo.setMode(nextMode);
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        stereo.adjustVolume(0.025);
        return;
      }

      if (key === 'ArrowDown') {
        e.preventDefault();
        stereo.adjustVolume(-0.025);
        return;
      }

      if (key === 'ArrowRight') {
        e.preventDefault();
        if (stereo.mode === 'RADIO') {
          stereo.tuneUp();
        } else {
          stereo.seekFwd();
        }
        return;
      }

      if (key === 'ArrowLeft') {
        e.preventDefault();
        if (stereo.mode === 'RADIO') {
          stereo.tuneDown();
        } else {
          stereo.seekRev();
        }
        return;
      }

      if (key === 'b' || key === 'B') {
        e.preventDefault();
        const nextBass = stereo.bass >= 12 ? -12 : stereo.bass + 3;
        stereo.adjustBass(nextBass);
        return;
      }

      if (key === 'l' || key === 'L') {
        e.preventDefault();
        stereo.setLoudness(!stereo.loudness);
        return;
      }

      if (key === 'e' || key === 'E') {
        e.preventDefault();
        stereo.applyEqPreset('PRESET');
        return;
      }

      if (key === 'v' || key === 'V') {
        e.preventDefault();
        stereo.cycleVisualizerMode();
        return;
      }

      if (key === 'c' || key === 'C') {
        e.preventDefault();
        stereo.cycleTheme();
        return;
      }

      if (key === 'd' || key === 'D') {
        e.preventDefault();
        stereo.cycleBacklitLevel();
        return;
      }

      if (key === 'o' || key === 'O' || key === 'f' || key === 'F' || key === 'p' || key === 'P') {
        e.preventDefault();
        toggleCarPlayMode();
        return;
      }

      if (key >= '1' && key <= '6') {
        e.preventDefault();
        stereo.selectMemory(parseInt(key, 10));
        return;
      }

      if (key === 'a' || key === 'A') {
        e.preventDefault();
        stereo.autoScanRadio();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stereo, showPlayerGuide, isolated, showSettingsModal]);

  // Edge-to-edge CarPlay Fullscreen In-Car Mode Toggle
  const toggleCarPlayMode = () => {
    setIsolated(prev => {
      const next = !prev;
      if (next) {
        setZoomMultiplier(1.0);
        if (!document.fullscreenElement && document.fullscreenEnabled) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        setZoomMultiplier(1.0);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  // Synchronize pure black background on html & body elements when isolated
  useEffect(() => {
    if (isolated) {
      document.body.classList.add('is-isolated');
      document.documentElement.classList.add('is-isolated');
      document.body.style.backgroundColor = '#000000';
      document.documentElement.style.backgroundColor = '#000000';
    } else {
      document.body.classList.remove('is-isolated');
      document.documentElement.classList.remove('is-isolated');
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    }
    return () => {
      document.body.classList.remove('is-isolated');
      document.documentElement.classList.remove('is-isolated');
    };
  }, [isolated]);

  // Dimensions of the stereo unit chassis (outer mount bezel removed in isolated mode)
  const PLAYER_W = isolated ? 836 : 880;
  const PLAYER_H = isolated ? 375 : 430;

  // Scale in standard non-isolated mode (responsive fit on smaller viewports)
  const paddingX = windowDimensions.width < 640 ? 8 : 28;
  const normalScale = Math.min(1, Math.max(0.32, (windowDimensions.width - paddingX) / PLAYER_W));

  // Scale in isolated mode: edge-to-edge retro car player sizing
  const availW = windowDimensions.width;
  const availH = windowDimensions.height;
  const fitScale = Math.min(availW / PLAYER_W, availH / PLAYER_H);

  // Pure edge-to-edge fit in in-car fullscreen mode
  const isolatedScale = fitScale * zoomMultiplier;

  const currentScale = isolated ? isolatedScale : normalScale;

  return (
    <div className={`w-screen min-w-[100vw] max-w-[100vw] ${isolated ? 'h-screen min-h-[100vh] max-h-[100vh] overflow-hidden bg-black' : 'min-h-screen overflow-x-hidden bg-[#0a0a0c]'} flex flex-col items-center ${isolated ? 'justify-center p-0 m-0' : 'justify-between'} relative font-sans select-none`}>
      
      {/* Top Controls: Distinct states for Normal vs Isolated mode */}
      {isolated ? (
        /* When Player is Isolated: Small, subtle, and less noticeable option */
        <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 opacity-30 hover:opacity-95 transition-opacity duration-300 pointer-events-auto">
          {/* Discreet Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1 rounded bg-black/70 hover:bg-black/90 border border-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors shadow"
            title="Performance Settings & Low-End Mode"
          >
            <Settings className="w-3 h-3" />
          </button>

          {/* Discreet Zoom Controls */}
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-[8px] font-mono text-zinc-400">
            <button
              onClick={() => setZoomMultiplier(m => Math.max(0.6, +(m - 0.1).toFixed(2)))}
              className="w-4 h-4 flex items-center justify-center hover:text-white cursor-pointer rounded hover:bg-white/10"
              title="Decrease Size"
            >
              -
            </button>
            <button
              onClick={() => setZoomMultiplier(1.0)}
              className="px-1 text-[8px] hover:text-white cursor-pointer"
              title="Reset Size"
            >
              {Math.round(currentScale * 100)}%
            </button>
            <button
              onClick={() => setZoomMultiplier(m => Math.min(1.6, +(m + 0.1).toFixed(2)))}
              className="w-4 h-4 flex items-center justify-center hover:text-white cursor-pointer rounded hover:bg-white/10"
              title="Increase Size"
            >
              +
            </button>
          </div>

          {/* Small, subtle Exit Button */}
          <button
            onClick={() => {
              setIsolated(false);
              setZoomMultiplier(1.0);
            }}
            className="px-2 py-0.5 rounded bg-black/70 hover:bg-black/90 border border-white/10 hover:border-white/30 text-[8.5px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-all shadow"
            title="Exit Player Only View (Press Esc or I)"
          >
            <Minimize2 className="w-2.5 h-2.5 text-zinc-400" />
            <span>Exit</span>
          </button>
        </div>
      ) : (
        /* When Dashboard is Active: Prominent, clear action buttons */
        <div className="fixed top-2.5 sm:top-3 right-2.5 sm:right-3 z-50 flex items-center gap-1.5 sm:gap-2">
          {/* Settings & Low-End Device Optimization Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-mono font-bold tracking-wider uppercase border transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 ${
              perfSettings.lowEndMode 
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-[#0e1017]/90 hover:bg-[#181a24] border-white/15 hover:border-white/30 text-zinc-300 hover:text-white'
            }`}
            title="Settings & Low-End Device Optimization [,]"
          >
            <Settings className={`w-3.5 h-3.5 ${perfSettings.lowEndMode ? 'text-amber-400 animate-spin-slow' : 'text-zinc-400'}`} />
            <span className="hidden md:inline">SETTINGS</span>
            {perfSettings.lowEndMode && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ECO
              </span>
            )}
          </button>

          {/* Physical Controls Guide Info Button */}
          <button
            onClick={() => setShowPlayerGuide(true)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-mono font-bold tracking-wider uppercase border transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 bg-[#0e1017]/90 hover:bg-[#181a24] border-white/15 hover:border-white/30 text-zinc-300 hover:text-white"
            title="View Physical Stereo Controls & Function Manual [?]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">GUIDE</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-zinc-400">?</span>
          </button>

          {/* Show Player Only Button */}
          <button
            onClick={() => {
              setIsolated(true);
              setZoomMultiplier(1.0);
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10.5px] sm:text-xs font-mono font-black tracking-wider uppercase border-2 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-1.5 sm:gap-2 shadow-2xl active:scale-95"
            style={{
              background: 'rgba(12, 14, 20, 0.95)',
              borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.75)',
              color: 'var(--color-lcd-primary)',
              boxShadow: '0 0 16px rgba(var(--color-lcd-primary-rgb), 0.25), 0 4px 12px rgba(0,0,0,0.8)'
            }}
            title="Show Stereo Deck Only (Clean Focused View)"
          >
            <Maximize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[var(--color-lcd-primary)]" />
            <span 
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full hidden sm:inline-block"
              style={{
                backgroundColor: 'var(--color-lcd-primary)',
                boxShadow: '0 0 8px var(--color-lcd-primary)'
              }}
            />
            <span className="whitespace-nowrap">SHOW PLAYER ONLY</span>
          </button>
        </div>
      )}

      {/* Main Content Area: Rotate to Landscape Barrier on mobile portrait, or the full stereo deck */}
      {showRotatePrompt ? (
        <div className="relative z-30 flex-1 flex flex-col items-center justify-center min-h-screen w-full px-5 py-8 text-center select-none animate-fade-in">
          {/* Pure Black Leather Texture Background */}
          <LeatherBackground disableSvgFilter={perfSettings.disableLeatherSvgFilter || perfSettings.lowEndMode} />

          <div 
            className="relative z-10 max-w-xs w-full p-6 rounded-2xl border bg-black/90 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-5"
            style={{
              borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.4)',
              boxShadow: '0 0 30px rgba(var(--color-lcd-primary-rgb), 0.2), 0 20px 50px rgba(0,0,0,0.9)'
            }}
          >
            {/* Panasonic Brand Badge */}
            <div 
              className="px-3 py-1 rounded-full bg-white/5 border text-[9px] font-mono font-bold tracking-[0.25em] uppercase"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.4)',
                color: 'var(--color-lcd-primary)',
                textShadow: '0 0 6px rgba(var(--color-lcd-primary-rgb), 0.4)'
              }}
            >
              PANASONIC CQ-VX5500D
            </div>

            {/* Rotating Smartphone Device Animation Graphic */}
            <div className="relative w-28 h-28 flex items-center justify-center my-1">
              <div 
                className="absolute inset-0 rounded-full border border-dashed opacity-25 animate-spin"
                style={{
                  borderColor: 'var(--color-lcd-primary)',
                  animationDuration: '12s'
                }}
              />
              <div className="animate-rotate-device flex items-center justify-center">
                <div 
                  className="w-12 h-20 rounded-xl border-2 bg-zinc-950/95 flex flex-col items-center justify-between p-1.5 shadow-2xl"
                  style={{
                    borderColor: 'var(--color-lcd-primary)',
                    boxShadow: '0 0 16px rgba(var(--color-lcd-primary-rgb), 0.5)'
                  }}
                >
                  <div className="w-3.5 h-0.5 rounded-full bg-zinc-600" />
                  <div 
                    className="w-full flex-1 my-1 rounded-md flex items-center justify-center border border-white/10"
                    style={{ background: 'rgba(var(--color-lcd-primary-rgb), 0.15)' }}
                  >
                    <span 
                      className="text-[7.5px] font-mono font-bold tracking-widest uppercase"
                      style={{ color: 'var(--color-lcd-primary)' }}
                    >
                      JDM
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full border border-zinc-700" />
                </div>
              </div>
            </div>

            {/* Clear, Minimal Message */}
            <div className="space-y-2">
              <h2 
                className="text-sm font-bold tracking-[0.18em] uppercase font-mono"
                style={{ 
                  color: 'var(--color-lcd-primary)',
                  textShadow: '0 0 10px rgba(var(--color-lcd-primary-rgb), 0.45)'
                }}
              >
                ROTATE TO LANDSCAPE
              </h2>
              <p className="text-xs font-mono text-zinc-300 leading-relaxed max-w-xs">
                Please rotate your phone to landscape to experience the stereo player.
              </p>
            </div>

            {/* Discreet override for orientation lock */}
            <button
              onClick={() => setBypassPortrait(true)}
              className="mt-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Continue in portrait anyway
            </button>
          </div>
        </div>
      ) : (
        <>

      {/* Pure Black Leather Texture Background (hidden when isolated) */}
      {!isolated && (
        <LeatherBackground 
          disableSvgFilter={perfSettings.disableLeatherSvgFilter || perfSettings.lowEndMode} 
        />
      )}

      {/* Top Header Section with Retro din Title (hidden when isolated; text above title removed) */}
      {!isolated && (
        <header className="relative z-10 pt-4 sm:pt-5 pb-1 sm:pb-2 text-center flex flex-col items-center">
          {/* Main Title: Retro din */}
          <h1 
            className="text-xs sm:text-base md:text-lg tracking-[0.16em] uppercase font-bold transition-all duration-300 select-none"
            style={{ 
              fontFamily: "'Press Start 2P', monospace",
              color: 'var(--color-lcd-primary)',
              textShadow: '0 0 5px var(--color-lcd-primary), 0 0 14px rgba(var(--color-lcd-primary-rgb), 0.55), 0 2px 0 #000'
            }}
          >
            Retro din
          </h1>
          
          {/* Subtitle: retro din stereo player */}
          <p 
            className="text-[8px] sm:text-[9.5px] font-mono tracking-[0.25em] uppercase mt-1 transition-all duration-300 font-bold"
            style={{
              color: 'rgba(var(--color-lcd-primary-rgb), 0.75)',
              textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.25)'
            }}
          >
            retro din stereo player
          </p>
        </header>
      )}

      {/* Main Center Console Section - Mathematically Bounded Container for Flawless Mobile Scaling */}
      <main className={`relative z-20 flex flex-col items-center justify-center w-full ${isolated ? 'flex-1 h-full p-0 overflow-hidden' : 'px-1 sm:px-2 py-2 my-auto'}`}>
        <div 
          className="relative flex items-center justify-center mx-auto overflow-visible"
          style={{
            width: `${Math.round(PLAYER_W * currentScale)}px`,
            height: `${Math.round(PLAYER_H * currentScale)}px`,
            maxWidth: '100vw'
          }}
        >
          <div 
            className="absolute top-0 left-0 transition-transform duration-300 ease-out origin-top-left flex items-center justify-center select-none"
            style={{
              width: `${PLAYER_W}px`,
              height: `${PLAYER_H}px`,
              transform: `scale(${currentScale})`,
              transformOrigin: 'top left'
            }}
          >
            <StereoDeck 
              isolated={isolated} 
              stereoState={stereo} 
              perfSettings={perfSettings}
              onToggleCarPlay={toggleCarPlayMode}
            />
          </div>
        </div>
      </main>

      {/* Bottom Information & Credits - Arranged Horizontally */}
      {!isolated && (
        <footer className="relative z-10 pb-3 pt-2 w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-2 transition-all duration-300 select-none px-4">
          {/* Horizontal Bottom Bar: Play Instruction, Developer Saqib Altaf, and Credits */}
          <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-5 pointer-events-auto">
            {/* Local Music Files Instruction */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/85 border backdrop-blur-md transition-all duration-300 shadow-lg"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.35)',
                boxShadow: '0 0 10px rgba(var(--color-lcd-primary-rgb), 0.12)'
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--color-lcd-primary)',
                  boxShadow: '0 0 6px var(--color-lcd-primary)'
                }}
              />
              <span 
                className="text-[8px] sm:text-[9px] font-mono tracking-wider uppercase font-semibold transition-colors duration-300 whitespace-nowrap"
                style={{
                  color: 'var(--color-lcd-primary)',
                  textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.45)'
                }}
              >
                play your local music files: click on usb or aux port
              </span>
            </div>

            {/* Developer Credit */}
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border backdrop-blur-md text-[8px] sm:text-[9px] font-mono tracking-[0.22em] uppercase font-bold transition-all duration-300 shadow-lg whitespace-nowrap"
              style={{
                color: 'rgba(var(--color-lcd-primary-rgb), 0.85)',
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.3)',
                textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.3)'
              }}
            >
              <span>developed by saqib altaf</span>
            </div>

            {/* Video Attribution & Copyright Credits Button */}
            <button
              onClick={() => setShowCopyright(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 hover:bg-black/95 border transition-all duration-200 cursor-pointer shadow-md whitespace-nowrap"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.3)',
                color: 'rgba(var(--color-lcd-primary-rgb), 0.9)'
              }}
              title="View copyright and source video links"
            >
              <Video className="w-3 h-3" />
              <span className="text-[8px] sm:text-[9px] font-mono tracking-wider uppercase font-bold">
                credits
              </span>
              {showCopyright ? <ChevronUp className="w-3 h-3 ml-0.5 opacity-75" /> : <ChevronDown className="w-3 h-3 ml-0.5 opacity-75" />}
            </button>
          </div>

          {/* Video Attribution & Copyright Info Accordion */}
          {showCopyright && (
            <div 
              className="w-full max-w-2xl mt-1 p-3 rounded-lg bg-black/95 border backdrop-blur-md shadow-2xl text-left transition-all duration-300 pointer-events-auto"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.4)',
                boxShadow: '0 0 20px rgba(var(--color-lcd-primary-rgb), 0.15)'
              }}
            >
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span 
                  className="text-[9.5px] font-mono uppercase font-bold tracking-wider"
                  style={{ color: 'var(--color-lcd-primary)' }}
                >
                  Media Attribution & Copyright Transparency
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[8.5px] font-mono">
                {/* Boot Animation */}
                <a
                  href="https://pixabay.com/videos/cherry-blossom-sakura-bloom-spring-2578/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between p-2 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-colors"
                >
                  <div>
                    <div className="font-bold text-white/90 group-hover:text-white flex items-center gap-1">
                      <span>Sakura Boot Animation</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-zinc-400 text-[7.5px] mt-0.5">Source: Pixabay (Royalty-Free Content License)</div>
                  </div>
                </a>

                {/* Tandem Drift */}
                <a
                  href="https://www.youtube.com/watch?v=Gkf_fMJz9Tc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between p-2 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-colors"
                >
                  <div>
                    <div className="font-bold text-white/90 group-hover:text-white flex items-center gap-1">
                      <span>JDM Tandem Drift Edit</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-zinc-400 text-[7.5px] mt-0.5">Creator: wajahatk2001 (YouTube)</div>
                  </div>
                </a>

                {/* Mount Fuji */}
                <a
                  href="https://www.pexels.com/video/28957687/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between p-2 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-colors"
                >
                  <div>
                    <div className="font-bold text-white/90 group-hover:text-white flex items-center gap-1">
                      <span>Mount Fuji Reflection</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-zinc-400 text-[7.5px] mt-0.5">Source: Pexels Video (Pexels License)</div>
                  </div>
                </a>

                {/* Touge Drift */}
                <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                  <div className="font-bold text-white/90">
                    <span>Touge Mountain Drift</span>
                  </div>
                  <div className="text-zinc-400 text-[7.5px] mt-0.5">Source: Open JDM Archive / Public Domain</div>
                </div>
              </div>

              <p className="mt-2 pt-2 border-t border-white/10 text-[7.5px] font-mono text-zinc-400 leading-relaxed">
                All video clips and trademarks remain the property of their respective creators. Videos are transformed client-side into 1-bit phosphor and dot-matrix CRT signal simulations for non-commercial aesthetic & educational demonstration.
              </p>
            </div>
          )}
        </footer>
      )}
      </>
      )}

      {/* Physical Stereo Controls & Functions Manual Modal */}
      <KeyBindingsModal 
        isOpen={showPlayerGuide} 
        onClose={() => setShowPlayerGuide(false)} 
      />

      {/* Device Performance, Low-End Mode & Mobile Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={perfSettings}
        diagnostics={diagnostics}
        updateSetting={updateSetting}
        toggleLowEndMode={toggleLowEndMode}
        applyPreset={applyPreset}
        autoOptimize={autoOptimize}
        resetDefaults={resetDefaults}
        onSelectChassis={(silver: boolean) => {
          updateSetting('vintageSilver', silver);
          if (silver) {
            stereo.setTheme('blue');
            stereo.setDimmerLevel(1);
            stereo.setBacklitLevel(0);
          }
        }}
      />
    </div>
  );
}

