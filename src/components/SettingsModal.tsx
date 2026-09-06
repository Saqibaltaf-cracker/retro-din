/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Gauge,
  Smartphone,
  Cpu,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { PerformanceSettings, DeviceDiagnostics } from '../hooks/usePerformanceSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PerformanceSettings;
  diagnostics: DeviceDiagnostics;
  updateSetting: <K extends keyof PerformanceSettings>(key: K, value: PerformanceSettings[K]) => void;
  toggleLowEndMode: () => void;
  applyPreset: (preset: 'low' | 'balanced' | 'high' | 'ultra' | 'max') => void;
  autoOptimize: () => void;
  resetDefaults: () => void;
  onSelectChassis?: (silver: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  diagnostics,
  updateSetting,
  toggleLowEndMode,
  applyPreset,
  autoOptimize,
  resetDefaults,
  onSelectChassis
}) => {
  const [activeTab, setActiveTab] = useState<'chassis' | 'perf' | 'mobile' | 'specs'>('chassis');

  if (!isOpen) return null;

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleChassisSelect = (silver: boolean) => {
    if (onSelectChassis) {
      onSelectChassis(silver);
    } else {
      updateSetting('vintageSilver', silver);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-lg flex flex-col rounded-xl border bg-[#0d0e13] text-zinc-200 shadow-2xl overflow-hidden"
        style={{
          borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.35)',
          boxShadow: '0 0 20px rgba(var(--color-lcd-primary-rgb), 0.15), 0 20px 40px rgba(0,0,0,0.95)'
        }}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-[#12141a]">
          <div className="flex items-center gap-2">
            <span
              className="text-xs sm:text-sm font-bold tracking-wider uppercase font-mono"
              style={{ color: 'var(--color-lcd-primary)' }}
            >
              SETTINGS
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
              {settings.vintageSilver ? 'SILVER' : 'BLACK'} · {settings.fpsLimit === 0 ? 'MAX FPS' : `${settings.fpsLimit} FPS`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={autoOptimize}
              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1"
              title="Auto-optimize for this hardware"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Tab Navigation */}
        <div className="px-4 sm:px-5 py-2 border-b border-white/10 bg-[#0a0b0e] flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chassis')}
            className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-mono uppercase font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chassis'
                ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.15)]'
                : 'border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Chassis</span>
          </button>

          <button
            onClick={() => setActiveTab('perf')}
            className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-mono uppercase font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'perf'
                ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.15)]'
                : 'border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Gauge className="w-3 h-3" />
            <span>Performance</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-mono uppercase font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.15)]'
                : 'border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-mono uppercase font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.15)]'
                : 'border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Hardware</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {/* TAB 1: CHASSIS */}
          {activeTab === 'chassis' && (
            <div className="grid grid-cols-2 gap-3">
              {/* Classic Black */}
              <button
                type="button"
                onClick={() => handleChassisSelect(false)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  !settings.vintageSilver
                    ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-700 inline-block shadow-inner" />
                    <span className="font-mono text-xs font-bold text-zinc-100">Classic Black</span>
                  </div>
                  {!settings.vintageSilver && <Check className="w-4 h-4 text-sky-400" />}
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Matte Anodized</span>
              </button>

              {/* Vintage Silver */}
              <button
                type="button"
                onClick={() => handleChassisSelect(true)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  settings.vintageSilver
                    ? 'border-zinc-200 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 shadow-[0_0_14px_rgba(255,255,255,0.2)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-zinc-200 to-zinc-400 border border-white inline-block shadow-sm" />
                    <span className="font-mono text-xs font-bold text-zinc-100">Vintage Silver</span>
                  </div>
                  {settings.vintageSilver && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[10px] font-mono text-zinc-300">Brushed Aluminum</span>
              </button>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === 'perf' && (
            <div className="space-y-3">
              {/* Presets Row */}
              <div className="flex items-center justify-between gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
                {[
                  { key: 'low', label: 'Eco 20', fps: 20 },
                  { key: 'balanced', label: 'Bal 30', fps: 30 },
                  { key: 'high', label: '60 FPS', fps: 60 },
                  { key: 'ultra', label: '144 FPS', fps: 144 },
                  { key: 'max', label: 'Max', fps: 0 }
                ].map(p => {
                  const isActive = (p.fps === 0 ? (settings.fpsLimit === 0 || settings.fpsLimit >= 240) : settings.fpsLimit === p.fps);
                  return (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p.key as any)}
                      className={`flex-1 py-1.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Minimal Settings Rows */}
              <div className="space-y-1.5 text-xs font-mono">
                {/* Low-End Mode */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Low-End Mode</span>
                  <button
                    onClick={toggleLowEndMode}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.lowEndMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {settings.lowEndMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Framerate Limit */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Framerate Limit</span>
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10">
                    {[30, 60, 120, 144, 0].map(fps => (
                      <button
                        key={fps}
                        onClick={() => updateSetting('fpsLimit', fps)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] cursor-pointer ${
                          settings.fpsLimit === fps
                            ? 'bg-white/25 text-white font-bold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {fps === 0 ? 'MAX' : fps}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cassette LED Beep Rhythm */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Cassette LED Rhythm</span>
                  <button
                    onClick={() => updateSetting('cassetteLedBeep', !settings.cassetteLedBeep)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.cassetteLedBeep
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {settings.cassetteLedBeep ? 'PULSE' : 'SOLID'}
                  </button>
                </div>

                {/* Canvas Glow Blur */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Canvas Phosphor Glow</span>
                  <button
                    onClick={() => updateSetting('canvasGlow', !settings.canvasGlow)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.canvasGlow
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {settings.canvasGlow ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Leather SVG Filter */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Leather Texture Filter</span>
                  <button
                    onClick={() => updateSetting('disableLeatherSvgFilter', !settings.disableLeatherSvgFilter)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.disableLeatherSvgFilter
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {settings.disableLeatherSvgFilter ? 'BYPASS' : 'FULL'}
                  </button>
                </div>

                {/* Idle Saver */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-zinc-300">Idle Power Saver</span>
                  <button
                    onClick={() => updateSetting('simplifiedDisplayOnIdle', !settings.simplifiedDisplayOnIdle)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      settings.simplifiedDisplayOnIdle
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {settings.simplifiedDisplayOnIdle ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLS & MOBILE */}
          {activeTab === 'mobile' && (
            <div className="space-y-1.5 text-xs font-mono">
              {/* Fullscreen Button */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-zinc-300">Fullscreen Mode</span>
                <button
                  onClick={handleToggleFullscreen}
                  className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold cursor-pointer hover:bg-sky-500/30 transition-colors flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>TOGGLE</span>
                </button>
              </div>

              {/* Mobile Auto-Fit */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-zinc-300">Responsive Auto-Fit</span>
                <button
                  onClick={() => updateSetting('mobileAutoFit', !settings.mobileAutoFit)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    settings.mobileAutoFit
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10'
                  }`}
                >
                  {settings.mobileAutoFit ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Touch Target Assist */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-zinc-300">Touch Target Assist</span>
                <button
                  onClick={() => updateSetting('touchAssist', !settings.touchAssist)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    settings.touchAssist
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10'
                  }`}
                >
                  {settings.touchAssist ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Click SFX */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-zinc-300">Relay & Click SFX</span>
                <button
                  onClick={() => updateSetting('enableSoundFx', !settings.enableSoundFx)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    settings.enableSoundFx
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10'
                  }`}
                >
                  {settings.enableSoundFx ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: HARDWARE SPECS */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">Device</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.isMobile ? 'Mobile' : 'Desktop'}</div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">CPU Cores</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.hardwareConcurrency} Logical</div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">RAM</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.deviceMemory ? `${diagnostics.deviceMemory} GB` : 'Standard'}</div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">Resolution</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.screenWidth} × {diagnostics.screenHeight}</div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">Pixel Ratio</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.devicePixelRatio}x</div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.03] border border-white/5">
                <div className="text-zinc-500 text-[9px] uppercase">Touch</div>
                <div className="text-zinc-200 font-bold mt-0.5">{diagnostics.hasTouch ? 'Supported' : 'No'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer Actions */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#0a0b0e] border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-white/5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white font-bold transition-colors cursor-pointer border border-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
