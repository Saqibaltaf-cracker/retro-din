import React from 'react';
import { EqBand, EQ_BANDS } from '../audio/AudioEngine';

interface Props {
  eq: Record<EqBand, number>;
  adjustEq: (band: EqBand, delta: number) => void;
  powered: boolean;
  isBooting?: boolean;
  eqMode?: string;
  activePresetName?: string;
  applyEqPreset?: (type: 'PRESET' | 'USER' | 'DEFEAT' | 'BASS_EXT' | 'FLAT') => void;
  autoScanRadio?: () => void;
}

const BAND_LABELS: Record<EqBand, string> = {
  63: '63Hz',
  125: '125Hz',
  250: '250Hz',
  500: '500Hz',
  1000: '1kHz',
  3500: '3.5kHz',
  10000: '10kHz'
};

export const Equalizer: React.FC<Props> = ({ 
  eq, 
  adjustEq, 
  powered, 
  isBooting = false,
  eqMode = 'PRESET', 
  activePresetName = 'HIP-HOP',
  applyEqPreset,
  autoScanRadio
}) => {
  return (
    <div className="w-full h-[105px] min-h-[105px] max-h-[105px] px-2.5 pb-1.5 pt-1 border-t border-[#1a1a1a] bg-gradient-to-b from-[#121212] via-[#0e0e0e] to-[#080808] transition-all select-none flex-shrink-0 flex flex-col justify-between">
      {/* Top control bar with Illuminated LED Strip Border */}
      <div className="flex items-center justify-between mb-0.5 px-0.5 h-5 flex-shrink-0">
        {/* Left EQ Cluster with Solid Thin LED Border (No Outer Glow) */}
        <div 
          className="flex items-center gap-1 px-1 py-0.5 rounded-[2px] transition-all duration-300 eq-cluster-border"
          style={{
            border: '1px solid #1c1d22',
            boxShadow: 'none',
            backgroundColor: '#09090b'
          }}
        >
          <span className={`text-[6.5px] font-label font-bold transition-all duration-300 pr-0.5 ${powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-600'}`}>
            EQ
          </span>
          <button 
            disabled={!powered} 
            onClick={() => applyEqPreset && applyEqPreset('PRESET')}
            className={`btn-backlit px-1 h-4 w-[44px] min-w-[44px] max-w-[44px] flex-shrink-0 text-[6.5px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${powered && eqMode === 'PRESET' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.5s' } as React.CSSProperties}
            title="Cycle Equalizer Presets"
          >
            PRESET
          </button>
          <button 
            disabled={!powered} 
            onClick={() => applyEqPreset && applyEqPreset('USER')}
            className={`btn-backlit px-1 h-4 w-[34px] min-w-[34px] max-w-[34px] flex-shrink-0 text-[6.5px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${powered && eqMode === 'USER' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.55s' } as React.CSSProperties}
            title="User Custom Curves"
          >
            USER
          </button>
          <button 
            disabled={!powered} 
            onClick={() => applyEqPreset && applyEqPreset('DEFEAT')}
            className={`btn-backlit px-1 h-4 w-[42px] min-w-[42px] max-w-[42px] flex-shrink-0 text-[6.5px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${powered && eqMode === 'DEFEAT' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.6s' } as React.CSSProperties}
            title="Bypass Equalizer (Flat Output)"
          >
            DEFEAT
          </button>
        </div>

        <div className={`text-[7px] font-label tracking-widest font-bold transition-all duration-300 brand-subtext ${powered ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' : 'text-zinc-600'}`} style={{ opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.4 }}>
          グラフィックEQ
        </div>

        {/* Right EQ Cluster with AUTO SCAN Station Search */}
        <div 
          className="flex items-center gap-1 px-1 py-0.5 rounded-[2px] transition-all duration-300 eq-cluster-border"
          style={{
            border: '1px solid #1c1d22',
            boxShadow: 'none',
            backgroundColor: '#09090b'
          }}
        >
          <button 
            disabled={!powered} 
            onClick={autoScanRadio}
            className={`btn-backlit px-1 h-4 w-[52px] min-w-[52px] max-w-[52px] flex-shrink-0 text-[6px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''}`}
            style={{ '--boot-delay': '0.62s' } as React.CSSProperties}
            title="Auto Station Search / Seek Next FM Radio Station"
          >
            AUTO SCAN
          </button>
          <button 
            disabled={!powered} 
            onClick={() => applyEqPreset && applyEqPreset('BASS_EXT')}
            className={`btn-backlit px-1 h-4 w-[48px] min-w-[48px] max-w-[48px] flex-shrink-0 text-[6px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${powered && eqMode === 'BASS_EXT' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.65s' } as React.CSSProperties}
            title="Bass Extension (+8dB at 63Hz)"
          >
            BASS EXT
          </button>
          <button 
            disabled={!powered} 
            onClick={() => applyEqPreset && applyEqPreset('FLAT')}
            className={`btn-backlit px-1 h-4 w-[32px] min-w-[32px] max-w-[32px] flex-shrink-0 text-[6px] font-bold flex items-center justify-center ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} ${powered && eqMode === 'FLAT' ? 'active' : ''}`}
            style={{ '--boot-delay': '0.7s' } as React.CSSProperties}
            title="Reset All Faders to 0dB"
          >
            FLAT
          </button>
        </div>
      </div>

      {/* 7 Band Fader Rockers */}
      <div className="flex items-center justify-between gap-1 max-w-[460px] mx-auto px-1 flex-shrink-0">
        <div className={`text-[7.5px] font-mono font-bold flex flex-col justify-between h-13 text-right py-0.5 transition-colors ${powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-700'}`}>
          <span>+12</span>
          <span>0</span>
          <span>-12</span>
        </div>

        {EQ_BANDS.map((band, idx) => {
          const val = eq[band] || 0;
          const bandDelay = 0.5 + idx * 0.05;
          return (
            <div key={band} className="flex flex-col items-center flex-1 min-w-[48px] max-w-[56px]">
              {/* Static center dot / spacing marker */}
              <span className="text-[6px] font-mono h-2.5 flex items-center justify-center mb-0.5 text-zinc-600 select-none">
                ·
              </span>

              {/* Rocker switch with backlit translucent illumination */}
              <div 
                className={`rocker-container backlit-rocker ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} w-8 h-10 border border-[#000] shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex-shrink-0`}
                style={{ '--boot-delay': `${bandDelay}s` } as React.CSSProperties}
              >
                <button 
                  onClick={() => adjustEq(band, 1)} 
                  disabled={!powered} 
                  className={`rocker-half backlit-half ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} flex-1 flex items-center justify-center text-[7px] font-bold`}
                  style={{ '--boot-delay': `${bandDelay}s` } as React.CSSProperties}
                  title={`Boost ${BAND_LABELS[band]}`}
                >
                  <span className={powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-600'}>
                    ▲
                  </span>
                </button>
                <div className={`h-[2px] bg-gradient-to-r from-[#050505] via-[#2a2a2a] to-[#050505] border-y border-[#000]`}></div>
                <button 
                  onClick={() => adjustEq(band, -1)} 
                  disabled={!powered} 
                  className={`rocker-half backlit-half ${powered ? 'lit' : ''} ${isBooting ? 'booting' : ''} flex-1 flex items-center justify-center text-[7px] font-bold`}
                  style={{ '--boot-delay': `${bandDelay + 0.02}s` } as React.CSSProperties}
                  title={`Cut ${BAND_LABELS[band]}`}
                >
                  <span className={powered ? 'text-[var(--color-lcd-primary)]' : 'text-zinc-600'}>
                    ▼
                  </span>
                </button>
              </div>

              {/* Backlit Band Frequency Label */}
              <span 
                className={`text-[6.5px] font-mono font-bold mt-0.5 tracking-tighter transition-all duration-300 eq-band-label ${powered ? 'lit text-[var(--color-lcd-primary)]' : 'text-zinc-600'}`}
                style={{ opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.4 }}
              >
                {BAND_LABELS[band]}
              </span>
            </div>
          );
        })}

        <div 
          className={`text-[7.5px] font-mono font-bold flex flex-col justify-between h-13 text-left py-0.5 transition-colors eq-band-label ${powered ? 'lit text-[var(--color-lcd-primary)]' : 'text-zinc-700'}`}
          style={{ opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.4 }}
        >
          <span>dB</span>
          <span>—</span>
          <span>dB</span>
        </div>
      </div>
    </div>
  );
};
