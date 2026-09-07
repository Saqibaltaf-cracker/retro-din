/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { useStereo, VisualizerMode, StereoTheme } from './useStereo';
import { PerformanceSettings } from './usePerformanceSettings';
import { RecoverySettingItem } from '../components/AndroidRecoveryMenu';

const ALL_VISUALIZERS: { id: VisualizerMode; label: string }[] = [
  { id: 'FIRE_SPECTRUM', label: 'FIRE SPECTRUM' },
  { id: 'BARS', label: 'SPECTRUM BARS' },
  { id: 'PEAK_FALL', label: 'PEAK FALL' },
  { id: 'OSCILLOSCOPE', label: 'OSCILLOSCOPE' },
  { id: 'ANALOG_VU', label: 'ANALOG VU METERS' },
  { id: 'DOT_MATRIX', label: 'DOT MATRIX LED' },
  { id: 'TUNNEL', label: '3D RETRO TUNNEL' },
  { id: 'RETRO_CASSETTE', label: 'RETRO CASSETTE' },
  { id: 'JDM_CAR_DOTS', label: 'DRIFT MATRIX 1' },
  { id: 'JDM_TANDEM_DOTS', label: 'TANDEM MATRIX 2' },
  { id: 'JDM_CAR_OLED', label: 'JDM DRIFT OLED' },
  { id: 'SERENE_JAPAN', label: 'MT FUJI RETRO' },
  { id: 'DISC', label: 'DISC OPTICAL' }
];

const ALL_THEMES: { id: StereoTheme; label: string }[] = [
  { id: 'pink', label: 'JDM MAGENTA' },
  { id: 'green', label: 'NIGHT RUNNER GREEN' },
  { id: 'amber', label: 'RETRO AMBER' },
  { id: 'cyan', label: 'ICE CYAN' },
  { id: 'blue', label: 'ALPINE BLUE' },
  { id: 'full-blue', label: 'COBALT BLUE' },
  { id: 'ice-blue', label: 'ARCTIC ICE' },
  { id: 'purple', label: 'VIOLET DRIFT' },
  { id: 'sunset', label: '80S SUNSET' },
  { id: 'red', label: 'REDLINE' },
  { id: 'ruby', label: 'RUBY VELVET' },
  { id: 'orange', label: 'STAGE TACHO ORANGE' },
  { id: 'gold', label: '24K GOLD' },
  { id: 'yellow', label: 'HIGH-BEAM YELLOW' },
  { id: 'mint', label: 'MINT CONDITION' },
  { id: 'laser-lime', label: 'LASER LIME' },
  { id: 'white', label: 'PURE VFD WHITE' },
  { id: 'vintage-silver', label: 'CHROME SILVER' }
];

interface UseRecoverySettingsParams {
  stereo: ReturnType<typeof useStereo>;
  perfSettings: PerformanceSettings;
  updateSetting: <K extends keyof PerformanceSettings>(key: K, value: PerformanceSettings[K]) => void;
  toggleLowEndMode: () => void;
  resetDefaults: () => void;
}

export function useRecoverySettings({
  stereo,
  perfSettings,
  updateSetting,
  toggleLowEndMode,
  resetDefaults
}: UseRecoverySettingsParams) {
  const [setupMenuIndex, setSetupMenuIndex] = useState(0);

  const recoveryItems: RecoverySettingItem[] = useMemo(() => [
    {
      id: 'displayMode',
      label: 'DISPLAY MODE',
      value: (perfSettings.displayMode ?? 'oled').toUpperCase(),
      onNext: () => {
        const next = (perfSettings.displayMode === 'matrix') ? 'oled' : 'matrix';
        updateSetting('displayMode', next);
        stereo.showToast(`DISP: ${next.toUpperCase()}`);
      },
      onPrev: () => {
        const next = (perfSettings.displayMode === 'matrix') ? 'oled' : 'matrix';
        updateSetting('displayMode', next);
        stereo.showToast(`DISP: ${next.toUpperCase()}`);
      }
    },
    {
      id: 'brightness',
      label: 'SCREEN BRIGHTNESS',
      value: `${Math.round((perfSettings.screenBrightness ?? 1.0) * 100)}%`,
      onNext: () => {
        const steps = [0.25, 0.5, 0.75, 1.0];
        const cur = perfSettings.screenBrightness ?? 1.0;
        const curIdx = steps.findIndex(s => Math.abs(s - cur) < 0.05);
        const next = steps[(curIdx + 1) % steps.length];
        updateSetting('screenBrightness', next);
        stereo.showToast(`BRIGHTNESS: ${Math.round(next * 100)}%`);
      },
      onPrev: () => {
        const steps = [0.25, 0.5, 0.75, 1.0];
        const cur = perfSettings.screenBrightness ?? 1.0;
        const curIdx = steps.findIndex(s => Math.abs(s - cur) < 0.05);
        const prev = steps[(curIdx - 1 + steps.length) % steps.length];
        updateSetting('screenBrightness', prev);
        stereo.showToast(`BRIGHTNESS: ${Math.round(prev * 100)}%`);
      }
    },
    {
      id: 'fpsLimit',
      label: 'REFRESH RATE',
      value: (perfSettings.fpsLimit === 0 || (perfSettings.fpsLimit ?? 60) >= 240) ? 'MAX (UNCAPPED)' : `${perfSettings.fpsLimit ?? 60} HZ`,
      onNext: () => {
        const rates = [30, 60, 120, 0];
        const cur = perfSettings.fpsLimit ?? 60;
        const curIdx = rates.indexOf(cur);
        const next = rates[(curIdx + 1) % rates.length];
        updateSetting('fpsLimit', next);
        stereo.showToast(`FPS: ${next === 0 ? 'MAX' : next}`);
      },
      onPrev: () => {
        const rates = [30, 60, 120, 0];
        const cur = perfSettings.fpsLimit ?? 60;
        const curIdx = rates.indexOf(cur);
        const prev = rates[(curIdx - 1 + rates.length) % rates.length];
        updateSetting('fpsLimit', prev);
        stereo.showToast(`FPS: ${prev === 0 ? 'MAX' : prev}`);
      }
    },
    {
      id: 'chassis',
      label: 'CHASSIS FINISH',
      value: perfSettings.vintageSilver ? 'VINTAGE SILVER' : 'BLACK ANODIZED',
      onNext: () => {
        const next = !perfSettings.vintageSilver;
        updateSetting('vintageSilver', next);
        if (next) {
          stereo.setTheme('blue');
          stereo.setDimmerLevel(1);
          stereo.setBacklitLevel(0);
        }
        stereo.showToast(`CHASSIS: ${next ? 'SILVER' : 'BLACK'}`);
      },
      onPrev: () => {
        const next = !perfSettings.vintageSilver;
        updateSetting('vintageSilver', next);
        if (next) {
          stereo.setTheme('blue');
          stereo.setDimmerLevel(1);
          stereo.setBacklitLevel(0);
        }
        stereo.showToast(`CHASSIS: ${next ? 'SILVER' : 'BLACK'}`);
      }
    },
    {
      id: 'glassReflection',
      label: 'GLASS REFLECTION',
      value: (perfSettings.glassReflection ?? 'subtle').toUpperCase(),
      onNext: () => {
        const modes: ('none' | 'subtle' | 'high')[] = ['none', 'subtle', 'high'];
        const cur = perfSettings.glassReflection ?? 'subtle';
        const curIdx = modes.indexOf(cur);
        const next = modes[(curIdx + 1) % modes.length];
        updateSetting('glassReflection', next);
        stereo.showToast(`LENS: ${next.toUpperCase()}`);
      },
      onPrev: () => {
        const modes: ('none' | 'subtle' | 'high')[] = ['none', 'subtle', 'high'];
        const cur = perfSettings.glassReflection ?? 'subtle';
        const curIdx = modes.indexOf(cur);
        const prev = modes[(curIdx - 1 + modes.length) % modes.length];
        updateSetting('glassReflection', prev);
        stereo.showToast(`LENS: ${prev.toUpperCase()}`);
      }
    },
    {
      id: 'visualizer',
      label: 'ACTIVE VISUALIZER',
      value: ALL_VISUALIZERS.find(v => v.id === stereo.visualizerMode)?.label || stereo.visualizerMode.replace('_', ' '),
      onNext: () => {
        const curIdx = ALL_VISUALIZERS.findIndex(v => v.id === stereo.visualizerMode);
        const next = ALL_VISUALIZERS[(curIdx + 1) % ALL_VISUALIZERS.length];
        stereo.setVisualizerMode(next.id);
        stereo.showToast(`VIS: ${next.label}`);
      },
      onPrev: () => {
        const curIdx = ALL_VISUALIZERS.findIndex(v => v.id === stereo.visualizerMode);
        const prev = ALL_VISUALIZERS[(curIdx - 1 + ALL_VISUALIZERS.length) % ALL_VISUALIZERS.length];
        stereo.setVisualizerMode(prev.id);
        stereo.showToast(`VIS: ${prev.label}`);
      }
    },
    {
      id: 'tubeWarmth',
      label: 'VACUUM TUBE PREAMP',
      value: perfSettings.analogWarmth ? 'ENGAGED (+3dB WARMTH)' : 'BYPASS (CLEAN)',
      onNext: () => {
        const next = !perfSettings.analogWarmth;
        updateSetting('analogWarmth', next);
        stereo.showToast(`TUBE: ${next ? 'ENGAGED' : 'BYPASS'}`);
      },
      onPrev: () => {
        const next = !perfSettings.analogWarmth;
        updateSetting('analogWarmth', next);
        stereo.showToast(`TUBE: ${next ? 'ENGAGED' : 'BYPASS'}`);
      }
    },
    {
      id: 'tapeHiss',
      label: 'CASSETTE SIMULATION',
      value: perfSettings.tapeHiss ? 'ENGAGED (BIAS & HISS)' : 'BYPASS (CLEAN)',
      onNext: () => {
        const next = !perfSettings.tapeHiss;
        updateSetting('tapeHiss', next);
        stereo.showToast(`TAPE SIM: ${next ? 'ENGAGED' : 'BYPASS'}`);
      },
      onPrev: () => {
        const next = !perfSettings.tapeHiss;
        updateSetting('tapeHiss', next);
        stereo.showToast(`TAPE SIM: ${next ? 'ENGAGED' : 'BYPASS'}`);
      }
    },
    {
      id: 'ecoSaver',
      label: 'ECO SAVER MODE',
      value: perfSettings.lowEndMode ? 'ON (30 FPS ECO)' : 'OFF (60+ FPS)',
      onNext: () => {
        toggleLowEndMode();
        stereo.showToast(`ECO: ${!perfSettings.lowEndMode ? 'ON' : 'OFF'}`);
      },
      onPrev: () => {
        toggleLowEndMode();
        stereo.showToast(`ECO: ${!perfSettings.lowEndMode ? 'ON' : 'OFF'}`);
      }
    },
    {
      id: 'carplayRotate',
      label: 'CARPLAY ROTATE',
      value: (perfSettings.autoCarPlayLandscape ?? true) ? 'AUTO LANDSCAPE' : 'MANUAL ONLY',
      onNext: () => {
        const next = !(perfSettings.autoCarPlayLandscape ?? true);
        updateSetting('autoCarPlayLandscape', next);
        stereo.showToast(`CARPLAY: ${next ? 'AUTO' : 'MANUAL'}`);
      },
      onPrev: () => {
        const next = !(perfSettings.autoCarPlayLandscape ?? true);
        updateSetting('autoCarPlayLandscape', next);
        stereo.showToast(`CARPLAY: ${next ? 'AUTO' : 'MANUAL'}`);
      }
    },
    {
      id: 'theme',
      label: 'COLOR THEME',
      value: ALL_THEMES.find(t => t.id === stereo.theme)?.label || stereo.theme.toUpperCase(),
      onNext: () => {
        const curIdx = ALL_THEMES.findIndex(t => t.id === stereo.theme);
        const next = ALL_THEMES[(curIdx + 1) % ALL_THEMES.length];
        stereo.setTheme(next.id);
        stereo.showToast(`THEME: ${next.label}`);
      },
      onPrev: () => {
        const curIdx = ALL_THEMES.findIndex(t => t.id === stereo.theme);
        const prev = ALL_THEMES[(curIdx - 1 + ALL_THEMES.length) % ALL_THEMES.length];
        stereo.setTheme(prev.id);
        stereo.showToast(`THEME: ${prev.label}`);
      }
    },
    {
      id: 'factoryReset',
      label: 'RESTORE DEFAULTS',
      value: 'PRESS FF TO RESTORE',
      onNext: () => {
        resetDefaults();
        stereo.showToast('FACTORY DEFAULTS RESTORED');
      },
      onPrev: () => {
        resetDefaults();
        stereo.showToast('FACTORY DEFAULTS RESTORED');
      }
    },
    {
      id: 'rebootExit',
      label: 'REBOOT / EXIT SETUP',
      value: 'PRESS FF TO EXIT',
      onNext: () => {
        stereo.setShowSetupMenu(false);
        stereo.showToast('SYSTEM REBOOTED // READY');
      },
      onPrev: () => {
        stereo.setShowSetupMenu(false);
        stereo.showToast('SYSTEM REBOOTED // READY');
      }
    }
  ], [perfSettings, stereo, updateSetting, toggleLowEndMode, resetDefaults]);

  const handleSetupAction = useCallback((action: 'UP' | 'DOWN' | 'NEXT' | 'PREV') => {
    if (action === 'DOWN') {
      setSetupMenuIndex(prev => (prev + 1) % recoveryItems.length);
    } else if (action === 'UP') {
      setSetupMenuIndex(prev => (prev - 1 + recoveryItems.length) % recoveryItems.length);
    } else if (action === 'NEXT') {
      recoveryItems[setupMenuIndex]?.onNext();
    } else if (action === 'PREV') {
      recoveryItems[setupMenuIndex]?.onPrev();
    }
  }, [recoveryItems, setupMenuIndex]);

  return {
    setupMenuIndex,
    setSetupMenuIndex,
    recoveryItems,
    handleSetupAction
  };
}
