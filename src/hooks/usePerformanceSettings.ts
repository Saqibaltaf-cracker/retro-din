/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

export interface PerformanceSettings {
  // Master switch for low-end devices
  lowEndMode: boolean;

  // Granular settings - Expanded Framerates up to 240Hz+ / Uncapped (0)
  fpsLimit: number;
  cassetteLedBeep: boolean; // Cassette LED Whitish Bright Neon Red Beeping rhythm toggle
  canvasGlow: boolean;
  lowResCanvas: boolean;
  disableLeatherSvgFilter: boolean;
  simplifiedDisplayOnIdle: boolean;
  enableSoundFx: boolean;
  reduceMotion: boolean;
  mobileAutoFit: boolean;
  touchAssist: boolean;
  vintageSilver: boolean; // Vintage Silver Aluminum Hi-Fi Chassis Edition

  // Display & Visualizer Controls
  displayMode: 'oled' | 'matrix'; // OLED (smooth phosphor lines) vs MATRIX (single-color dot matrix)
  screenBrightness: number; // 0.25 to 1.0 (25% to 100%)
  glassReflection: 'none' | 'subtle' | 'high';
  analogWarmth: boolean; // Vacuum tube saturation
  tapeHiss: boolean; // Analog cassette tape hiss floor
  autoCarPlayLandscape: boolean; // Rotate to landscape switches straight to CarPlay mode
}

export interface DeviceDiagnostics {
  isMobile: boolean;
  isLowEnd: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  hasTouch: boolean;
  browserTier: 'Low-Spec Device' | 'Mid-Range Device' | 'High-Performance PC';
}

const STORAGE_KEY = 'retro_din_perf_settings_v1';

export function detectDevice(): DeviceDiagnostics {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowEnd: false,
      hardwareConcurrency: 4,
      deviceMemory: null,
      devicePixelRatio: 1,
      screenWidth: 1280,
      screenHeight: 800,
      hasTouch: false,
      browserTier: 'Mid-Range Device'
    };
  }

  const isMobile =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || null;
  const dpr = window.devicePixelRatio || 1;
  const hasTouch = navigator.maxTouchPoints ? navigator.maxTouchPoints > 0 : false;

  const isLowEnd = isMobile || cores <= 4 || (memory !== null && memory <= 4);

  let browserTier: 'Low-Spec Device' | 'Mid-Range Device' | 'High-Performance PC' = 'Mid-Range Device';
  if (cores <= 4 || (memory !== null && memory <= 4)) {
    browserTier = 'Low-Spec Device';
  } else if (cores >= 8 && (memory === null || memory >= 8) && !isMobile) {
    browserTier = 'High-Performance PC';
  }

  return {
    isMobile,
    isLowEnd,
    hardwareConcurrency: cores,
    deviceMemory: memory,
    devicePixelRatio: dpr,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    hasTouch,
    browserTier
  };
}

export function getDefaultSettings(isLowEnd: boolean): PerformanceSettings {
  if (isLowEnd) {
    return {
      lowEndMode: true,
      fpsLimit: 30,
      cassetteLedBeep: true,
      canvasGlow: false,
      lowResCanvas: true,
      disableLeatherSvgFilter: true,
      simplifiedDisplayOnIdle: true,
      enableSoundFx: true,
      reduceMotion: false,
      mobileAutoFit: true,
      touchAssist: true,
      vintageSilver: false,
      displayMode: 'oled',
      screenBrightness: 1.0,
      glassReflection: 'subtle',
      analogWarmth: false,
      tapeHiss: false,
      autoCarPlayLandscape: true
    };
  }

  return {
    lowEndMode: false,
    fpsLimit: 60,
    cassetteLedBeep: true,
    canvasGlow: true,
    lowResCanvas: false,
    disableLeatherSvgFilter: false,
    simplifiedDisplayOnIdle: true,
    enableSoundFx: true,
    reduceMotion: false,
    mobileAutoFit: true,
    touchAssist: false,
    vintageSilver: false,
    displayMode: 'oled',
    screenBrightness: 1.0,
    glassReflection: 'subtle',
    analogWarmth: true,
    tapeHiss: false,
    autoCarPlayLandscape: true
  };
}

export function usePerformanceSettings() {
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics>(() => detectDevice());

  const [settings, setSettings] = useState<PerformanceSettings>(() => {
    const initialDiag = detectDevice();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...getDefaultSettings(initialDiag.isLowEnd),
          ...parsed,
          // Always start in black theme by default as requested
          vintageSilver: false
        };
      }
    } catch (e) {
      // ignore
    }
    return getDefaultSettings(initialDiag.isLowEnd);
  });

  // Keep device diagnostics fresh on resize
  useEffect(() => {
    const onResize = () => {
      setDiagnostics(detectDevice());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }

    // Apply audio engine low-end FFT optimizations
    try {
      const engine = AudioEngine.getInstance();
      if (engine.analyser) {
        engine.analyser.fftSize = settings.lowEndMode || settings.fpsLimit <= 30 ? 128 : 512;
      }
    } catch (e) {}

    // Apply document class for CSS optimization overrides
    if (settings.lowEndMode) {
      document.documentElement.classList.add('low-end-mode');
      document.body.classList.add('low-end-mode');
    } else {
      document.documentElement.classList.remove('low-end-mode');
      document.body.classList.remove('low-end-mode');
    }

    // Apply Vintage Silver chassis attribute
    if (settings.vintageSilver) {
      document.documentElement.setAttribute('data-chassis', 'silver');
    } else {
      document.documentElement.removeAttribute('data-chassis');
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof PerformanceSettings>(key: K, value: PerformanceSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const toggleLowEndMode = useCallback(() => {
    setSettings(prev => {
      const nextLowEnd = !prev.lowEndMode;
      if (nextLowEnd) {
        return {
          ...prev,
          lowEndMode: true,
          fpsLimit: 30,
          canvasGlow: false,
          lowResCanvas: true,
          disableLeatherSvgFilter: true,
          simplifiedDisplayOnIdle: true
        };
      } else {
        return {
          ...prev,
          lowEndMode: false,
          fpsLimit: 60,
          canvasGlow: true,
          lowResCanvas: false,
          disableLeatherSvgFilter: false,
          simplifiedDisplayOnIdle: true
        };
      }
    });
  }, []);

  const applyPreset = useCallback((preset: 'low' | 'balanced' | 'high' | 'ultra' | 'max') => {
    if (preset === 'low') {
      setSettings(prev => ({
        ...prev,
        lowEndMode: true,
        fpsLimit: 20,
        canvasGlow: false,
        lowResCanvas: true,
        disableLeatherSvgFilter: true,
        simplifiedDisplayOnIdle: true,
        reduceMotion: true,
        touchAssist: true
      }));
    } else if (preset === 'balanced') {
      setSettings(prev => ({
        ...prev,
        lowEndMode: true,
        fpsLimit: 30,
        canvasGlow: false,
        lowResCanvas: true,
        disableLeatherSvgFilter: true,
        simplifiedDisplayOnIdle: true,
        reduceMotion: false,
        touchAssist: true
      }));
    } else if (preset === 'high') {
      setSettings(prev => ({
        ...prev,
        lowEndMode: false,
        fpsLimit: 60,
        canvasGlow: true,
        lowResCanvas: false,
        disableLeatherSvgFilter: false,
        simplifiedDisplayOnIdle: true,
        reduceMotion: false
      }));
    } else if (preset === 'ultra') {
      // 144 Hz Gaming Monitors
      setSettings(prev => ({
        ...prev,
        lowEndMode: false,
        fpsLimit: 144,
        canvasGlow: true,
        lowResCanvas: false,
        disableLeatherSvgFilter: false,
        simplifiedDisplayOnIdle: false,
        reduceMotion: false
      }));
    } else {
      // 240 Hz / Native Uncapped Gaming Display
      setSettings(prev => ({
        ...prev,
        lowEndMode: false,
        fpsLimit: 240,
        canvasGlow: true,
        lowResCanvas: false,
        disableLeatherSvgFilter: false,
        simplifiedDisplayOnIdle: false,
        reduceMotion: false
      }));
    }
  }, []);

  const autoOptimize = useCallback(() => {
    const diag = detectDevice();
    const optimal = getDefaultSettings(diag.isLowEnd);
    setSettings(optimal);
  }, []);

  const resetDefaults = useCallback(() => {
    const diag = detectDevice();
    setSettings(getDefaultSettings(diag.isLowEnd));
  }, []);

  return {
    settings,
    diagnostics,
    updateSetting,
    toggleLowEndMode,
    applyPreset,
    autoOptimize,
    resetDefaults
  };
}
