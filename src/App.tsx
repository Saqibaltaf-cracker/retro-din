/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StereoDeck } from './components/StereoDeck';
import { LeatherBackground } from './components/LeatherBackground';
import { AdSenseGateModal } from './components/AdSenseGateModal';
import { ExternalLink, Info, Video, ShieldCheck, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

export default function App() {
  const [isolated, setIsolated] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(1.0);
  const [showCopyright, setShowCopyright] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

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
  const normalScale = Math.min(1, Math.max(0.35, (windowDimensions.width - 24) / 880));

  // Scale in isolated mode: make the player start comfortably big and fill available space
  const availW = Math.max(320, windowDimensions.width - 32);
  const availH = Math.max(300, windowDimensions.height - 32);
  const fitScale = Math.min(availW / PLAYER_W, availH / PLAYER_H);

  // Big, clear, and prominent in isolated mode
  const baseScale = Math.min(1.35, Math.max(0.65, fitScale * 0.95));
  const isolatedScale = Math.min(1.7, Math.max(0.4, baseScale * zoomMultiplier));

  const currentScale = isolated ? isolatedScale : normalScale;

  return (
    <div className={`w-screen min-w-[100vw] max-w-[100vw] ${isolated ? 'h-screen min-h-[100vh] max-h-[100vh] overflow-hidden bg-black' : 'min-h-screen overflow-x-hidden bg-[#0a0a0c]'} flex flex-col items-center ${isolated ? 'justify-center p-0 m-0' : 'justify-between'} relative font-sans select-none`}>
      {/* Isolation Mode Toggle & Scale Controls */}
      <div className={`fixed top-3 right-3 z-50 flex items-center gap-2.5 ${isolated ? 'opacity-90 hover:opacity-100 transition-opacity duration-200' : ''}`}>
        {/* Zoom Controls when in Player Only mode */}
        {isolated && (
          <div className="flex items-center gap-1.5 bg-[#0d0f14]/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#2d3240] shadow-xl">
            <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider">SIZE:</span>
            <button
              onClick={() => setZoomMultiplier(m => Math.max(0.7, +(m - 0.1).toFixed(2)))}
              className="w-6 h-6 rounded bg-[#161822] hover:bg-[#222636] active:scale-95 text-xs font-mono font-bold text-zinc-200 flex items-center justify-center border border-[#32384a] transition-colors cursor-pointer"
              title="Decrease Player Size"
            >
              -
            </button>
            <button
              onClick={() => setZoomMultiplier(1.0)}
              className="px-2 h-6 rounded bg-[#161822] hover:bg-[#222636] text-[10px] font-mono font-bold text-[var(--color-lcd-primary)] flex items-center justify-center border border-[#32384a] transition-colors cursor-pointer"
              title="Reset to Default Size"
            >
              {Math.round(currentScale * 100)}%
            </button>
            <button
              onClick={() => setZoomMultiplier(m => Math.min(1.6, +(m + 0.1).toFixed(2)))}
              className="w-6 h-6 rounded bg-[#161822] hover:bg-[#222636] active:scale-95 text-xs font-mono font-bold text-zinc-200 flex items-center justify-center border border-[#32384a] transition-colors cursor-pointer"
              title="Increase Player Size"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setIsolated(!isolated);
            setZoomMultiplier(1.0);
          }}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-mono font-black tracking-wider uppercase border-2 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 shadow-2xl active:scale-95"
          style={{
            background: isolated ? 'rgba(10, 11, 16, 0.95)' : 'rgba(12, 14, 20, 0.95)',
            borderColor: isolated ? 'var(--color-lcd-primary)' : 'rgba(var(--color-lcd-primary-rgb), 0.75)',
            color: 'var(--color-lcd-primary)',
            boxShadow: isolated 
              ? '0 0 20px rgba(var(--color-lcd-primary-rgb), 0.4)' 
              : '0 0 16px rgba(var(--color-lcd-primary-rgb), 0.25), 0 4px 12px rgba(0,0,0,0.8)'
          }}
          title={isolated ? "Show Surrounding Dashboard & Details" : "Show Stereo Deck Only (Clean Focused View)"}
        >
          {isolated ? (
            <Minimize2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-[var(--color-lcd-primary)]" />
          )}
          <span 
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isolated ? '#34d399' : 'var(--color-lcd-primary)',
              boxShadow: isolated ? '0 0 8px #34d399' : '0 0 8px var(--color-lcd-primary)'
            }}
          />
          <span>{isolated ? 'SHOW FULL DASHBOARD' : 'SHOW PLAYER ONLY'}</span>
        </button>
      </div>

      {/* Pure Black Leather Texture Background (hidden when isolated) */}
      {!isolated && <LeatherBackground />}

      {/* Top Header Section with Vintage Title (hidden when isolated) */}
      {!isolated && (
        <header className="relative z-10 pt-4 pb-2 text-center flex flex-col items-center">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md mb-2 shadow-lg transition-all duration-300 border"
            style={{
              borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.35)',
              boxShadow: '0 0 8px rgba(var(--color-lcd-primary-rgb), 0.12)'
            }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse transition-all duration-300"
              style={{
                backgroundColor: 'var(--color-lcd-primary)',
                boxShadow: '0 0 5px var(--color-lcd-primary)'
              }}
            />
            <span 
              className="text-[9px] font-mono tracking-widest uppercase transition-all duration-300"
              style={{
                color: 'var(--color-lcd-primary)',
                textShadow: '0 0 3px rgba(var(--color-lcd-primary-rgb), 0.4)'
              }}
            >
              JDM SPEC // 12V DC DECK
            </span>
            <span className="text-[9px] font-mono text-zinc-600">|</span>
            <span 
              className="text-[9px] font-mono transition-all duration-300 flex items-center gap-1"
              style={{
                color: 'var(--color-lcd-secondary)',
                textShadow: '0 0 3px rgba(var(--color-lcd-secondary-rgb), 0.4)'
              }}
            >
              <span>MODEL NO. TM-9400</span>
              <span className="rainbow-gradient-text tracking-wider text-[9px]">OLED</span>
            </span>
          </div>

          {/* Title - Changes Color with Deck Theme */}
          <h1 
            className="text-xs sm:text-sm md:text-base tracking-[0.18em] uppercase font-bold transition-all duration-300 select-none"
            style={{ 
              fontFamily: "'Press Start 2P', monospace",
              color: 'var(--color-lcd-primary)',
              textShadow: '0 0 5px var(--color-lcd-primary), 0 0 12px rgba(var(--color-lcd-primary-rgb), 0.55), 0 2px 0 #000'
            }}
          >
            time machine sterio
          </h1>
          
          <p 
            className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase mt-1.5 transition-all duration-300 font-bold"
            style={{
              color: 'rgba(var(--color-lcd-primary-rgb), 0.75)',
              textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.25)'
            }}
          >
            HI-FI COMPACT DISC / CASSETTE / DSP GRAPHIC EQUALIZER
          </p>
        </header>
      )}

      {/* Main Center Console Section - Large & Centered when Isolated */}
      <main className={`relative z-20 flex flex-col items-center justify-center w-full ${isolated ? 'flex-1 h-full p-0 overflow-hidden' : 'px-2 py-2'}`}>
        <div 
          className="transition-transform duration-350 ease-out origin-center flex items-center justify-center select-none"
          style={{
            transform: `scale(${currentScale})`
          }}
        >
          <StereoDeck isolated={isolated} />
        </div>
      </main>

      {/* Bottom Information & Credits (hidden when isolated to show player ONLY) */}
      {!isolated && (
        <footer className="relative z-10 pb-4 pt-1.5 text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-300 select-none px-4">
          {/* Local Music Files Instruction */}
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/85 border backdrop-blur-md transition-all duration-300 shadow-lg pointer-events-auto"
            style={{
              borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.35)',
              boxShadow: '0 0 12px rgba(var(--color-lcd-primary-rgb), 0.15)'
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
              className="text-[8.5px] sm:text-[10px] font-mono tracking-wider uppercase font-semibold transition-colors duration-300"
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
            className="text-[8.5px] sm:text-[9.5px] font-mono tracking-[0.25em] uppercase font-bold transition-colors duration-300 pointer-events-auto"
            style={{
              color: 'rgba(var(--color-lcd-primary-rgb), 0.85)',
              textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.3)'
            }}
          >
            developed by saqib altaf
          </div>

          {/* Video Attribution & Copyright Info Section */}
          <div className="w-full max-w-xl mt-0.5 flex flex-col items-center pointer-events-auto">
            <button
              onClick={() => setShowCopyright(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 hover:bg-black/95 border transition-all duration-200 cursor-pointer shadow-md"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.3)',
                color: 'rgba(var(--color-lcd-primary-rgb), 0.9)'
              }}
              title="View copyright and source video links"
            >
              <Video className="w-3 h-3" />
              <span className="text-[8.5px] sm:text-[9.5px] font-mono tracking-wider uppercase font-bold">
                Video Credits & Copyright Sources
              </span>
              {showCopyright ? <ChevronUp className="w-3 h-3 ml-0.5 opacity-75" /> : <ChevronDown className="w-3 h-3 ml-0.5 opacity-75" />}
            </button>

            {showCopyright && (
              <div 
                className="w-full mt-2 p-3 rounded-lg bg-black/95 border backdrop-blur-md shadow-2xl text-left transition-all duration-300"
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
          </div>
        </footer>
      )}

      {/* 15-Second AdSense 24-Hour Access Gate */}
      <AdSenseGateModal />
    </div>
  );
}
