import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { VisualizerMode } from '../hooks/useStereo';
import { drawJdmBootAnimation, drawPoweredOffDisplay } from './jdmBootAnimation';

interface Props {
  engine: AudioEngine;
  powered: boolean;
  dimmerLevel: number;
  isBooting?: boolean;
  isYtPlaying?: boolean;
  playing?: boolean;
  theme?: string;
  visualizerMode?: VisualizerMode;
  fpsLimit?: 60 | 30 | 20;
  canvasGlow?: boolean;
  lowEndMode?: boolean;
  simplifiedDisplayOnIdle?: boolean;
}

export const SpectrumAnalyzer: React.FC<Props> = ({ 
  engine, 
  powered, 
  dimmerLevel, 
  isBooting = false, 
  isYtPlaying = false, 
  playing = false, 
  theme,
  visualizerMode = 'FIRE_SPECTRUM',
  fpsLimit = 60,
  canvasGlow = true,
  lowEndMode = false,
  simplifiedDisplayOnIdle = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bootStartTimeRef = useRef<number>(0);
  const prevBootingRef = useRef<boolean>(false);

  // VU meter ballistic needle values
  const vuLeftRef = useRef(0);
  const vuRightRef = useRef(0);

  // Hardware-accelerated video playback elements mounted directly in DOM
  const driftVideoRef = useRef<HTMLVideoElement | null>(null);
  const tandemVideoRef = useRef<HTMLVideoElement | null>(null);
  const sereneVideoRef = useRef<HTMLVideoElement | null>(null);
  const bootVideoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 64;
    offscreen.height = 32;
    offscreenCanvasRef.current = offscreen;

    [driftVideoRef, tandemVideoRef, sereneVideoRef, bootVideoRef].forEach(ref => {
      if (ref.current) {
        ref.current.muted = true;
        ref.current.volume = 0;
      }
    });

    return () => {
      offscreenCanvasRef.current = null;
    };
  }, []);

  // Performance optimization: only play videos when actively required by the current mode
  useEffect(() => {
    const needsBoot = isBooting;
    const needsDrift = visualizerMode === 'JDM_CAR_DOTS' || visualizerMode === 'JDM_CAR_OLED';
    const needsTandem = visualizerMode === 'JDM_TANDEM_DOTS';
    const needsSerene = visualizerMode === 'SERENE_JAPAN';

    const manageVideo = (ref: React.RefObject<HTMLVideoElement | null>, shouldPlay: boolean) => {
      const v = ref.current;
      if (!v) return;
      if (shouldPlay && powered) {
        if (v.paused) {
          v.play().catch(() => {});
        }
      } else {
        if (!v.paused) {
          v.pause();
        }
      }
    };

    manageVideo(bootVideoRef, needsBoot);
    manageVideo(driftVideoRef, needsDrift);
    manageVideo(tandemVideoRef, needsTandem);
    manageVideo(sereneVideoRef, needsSerene);
  }, [isBooting, visualizerMode, powered]);

  useEffect(() => {
    if (isBooting && !prevBootingRef.current) {
      bootStartTimeRef.current = performance.now();
    }
    prevBootingRef.current = isBooting;
  }, [isBooting]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const numBands = 32;
    const segmentsPerBand = 16; 

    let peakHold = new Array(numBands).fill(0);
    let peakHoldTime = new Array(numBands).fill(0);

    const getThemeColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const primary = computedStyle.getPropertyValue('--color-lcd-primary').trim() || '#4af04a';
      const secondary = computedStyle.getPropertyValue('--color-lcd-secondary').trim() || '#ff9900';
      const danger = computedStyle.getPropertyValue('--color-lcd-danger').trim() || '#ff3333';
      const primaryOff = computedStyle.getPropertyValue('--color-lcd-primary-off').trim() || '#122a12';
      const secondaryOff = computedStyle.getPropertyValue('--color-lcd-secondary-off').trim() || '#331a00';
      const dangerOff = computedStyle.getPropertyValue('--color-lcd-danger-off').trim() || '#3a1010';
      return { primary, secondary, danger, primaryOff, secondaryOff, dangerOff };
    };

    const hexToRgba = (hex: string, alpha: number) => {
      let c: any;
      if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length === 3){
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
      }
      return `rgba(74, 240, 74, ${alpha})`;
    };

    const allowGlow = canvasGlow && !lowEndMode;
    const isLowEndVideo = lowEndMode;

    const renderDotMatrixFromVideo = (
      v: HTMLVideoElement | null,
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      offscreen: HTMLCanvasElement | null,
      effectiveDimmer: number,
      now: number
    ) => {
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, width, height);

      const cols = isLowEndVideo ? 32 : 64;
      const rows = isLowEndVideo ? 16 : 32;
      const startX = 4;
      const startY = 4;
      const gridW = width - 8;
      const gridH = height - 8;
      const pitchX = gridW / cols;
      const pitchY = gridH / rows;

      let rendered = false;
      if (offscreen && v && v.readyState >= 2) {
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          try {
            offCtx.drawImage(v, 0, 0, cols, rows);
            const frame = offCtx.getImageData(0, 0, cols, rows);
            const data = frame.data;

            for (let r = 0; r < rows; r++) {
              const py = startY + r * pitchY + pitchY / 2;
              for (let c = 0; c < cols; c++) {
                const px = startX + c * pitchX + pitchX / 2;
                const idx = (r * cols + c) * 4;
                const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
                const intensity = Math.min(1.0, lum * 1.15);

                if (intensity > 0.14) {
                  const dotRadius = Math.max(0.6, Math.min(1.8, intensity * 1.7));
                  const dotAlpha = Math.min(1, intensity * 1.25) * effectiveDimmer;
                  ctx.fillStyle = hexToRgba(colors.primary, dotAlpha);
                  if (intensity > 0.68 && allowGlow) {
                    ctx.shadowColor = colors.primary;
                    ctx.shadowBlur = 3 * effectiveDimmer;
                  } else {
                    ctx.shadowBlur = 0;
                  }
                  ctx.beginPath();
                  ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                } else {
                  ctx.fillStyle = hexToRgba(colors.primaryOff, 0.12 * effectiveDimmer);
                  ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
                }
              }
            }
            rendered = true;
          } catch (e) {}
        }
      }

      if (!rendered) {
        const sweepCol = Math.floor((now * 0.04) % (cols + 12)) - 6;
        for (let r = 0; r < rows; r++) {
          const py = startY + r * pitchY + pitchY / 2;
          for (let c = 0; c < cols; c++) {
            const px = startX + c * pitchX + pitchX / 2;
            const dist = Math.abs(c - sweepCol);
            if (dist <= 2) {
              const sweepAlpha = (1 - dist / 3) * 0.45 * effectiveDimmer;
              ctx.fillStyle = hexToRgba(colors.primary, sweepAlpha);
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = hexToRgba(colors.primaryOff, 0.12 * effectiveDimmer);
              ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
            }
          }
        }
      }
    };

    let colors = getThemeColors();
    let frameCounter = 0;
    let lastDrawTime = 0;
    const targetFps = fpsLimit !== undefined ? fpsLimit : (lowEndMode ? 30 : 60);
    // If targetFps <= 0: uncapped native monitor refresh rate (e.g. 144Hz, 240Hz, 360Hz)
    const frameInterval = targetFps > 0 ? 1000 / targetFps : 0;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      const now = performance.now();

      if (frameInterval > 0) {
        const elapsed = now - lastDrawTime;
        if (elapsed < frameInterval - 1.5) {
          return;
        }
        lastDrawTime = now - (elapsed % frameInterval);
      }

      frameCounter++;
      if (frameCounter % 30 === 0) {
        colors = getThemeColors();
      }

      const width = canvas.width;
      const height = canvas.height;

      // When powered off: render authentic dense field of small dots instead of big cubes
      if (!powered) {
        // If simplified display on idle is on, throttle powered-off redraws to save CPU
        if (frameCounter > 2 && simplifiedDisplayOnIdle && (frameCounter % 10 !== 0)) {
          return;
        }
        ctx.clearRect(0, 0, width, height);
        drawPoweredOffDisplay(ctx, width, height, colors, theme);
        return;
      }

      // Idle throttling when not playing and not booting
      const isAudioActive = playing || isYtPlaying || isBooting;
      if (!isAudioActive && simplifiedDisplayOnIdle && (frameCounter % 3 !== 0)) {
        return; // Conserves battery when paused
      }

      ctx.clearRect(0, 0, width, height);

      const bandWidth = (width / numBands) - 1.5;
      const segmentHeight = (height / segmentsPerBand) - 1;

      let dataArray = new Uint8Array(numBands);
      let rawWaveData = new Uint8Array(128);

      if (powered && !isBooting) {
        let isRealAudio = false;
        if (engine.analyser) {
          const binCount = engine.analyser.frequencyBinCount;
          const rawData = new Uint8Array(binCount);
          engine.analyser.getByteFrequencyData(rawData);
          engine.analyser.getByteTimeDomainData(rawWaveData);
          const sampleRate = engine.context?.sampleRate || 44100;
          const nyquist = sampleRate / 2;

          const minFreq = 28;
          const maxFreq = 16000;

          let totalEnergy = 0;
          for (let i = 0; i < numBands; i++) {
            const fLow = minFreq * Math.pow(maxFreq / minFreq, i / numBands);
            const fHigh = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / numBands);

            const binLow = Math.max(0, Math.min(binCount - 1, Math.floor((fLow / nyquist) * binCount)));
            const binHigh = Math.max(binLow + 1, Math.min(binCount, Math.ceil((fHigh / nyquist) * binCount)));

            let sum = 0;
            let count = 0;
            for (let b = binLow; b < binHigh; b++) {
              sum += rawData[b];
              count++;
            }
            let avg = count > 0 ? (sum / count) : 0;
            // Calibrated tilt and headroom to prevent slamming into the top ceiling at max volume
            const headroomFactor = 0.82;
            const tilt = Math.pow((i + 1) / numBands, 0.32) * 1.25;
            const boosted = Math.min(235, Math.floor(avg * tilt * headroomFactor));

            dataArray[i] = boosted;
            totalEnergy += boosted;
          }
          if (totalEnergy > 60) {
            isRealAudio = true;
          }
        }

        // FAKE VISUALIZER ON YT STREAM & SILENT STREAMS WHEN PLAYING
        if ((isYtPlaying || (playing && !isRealAudio)) && playing) {
          const beatTime = (now % 476) / 476; 
          const kickImpact = Math.pow(Math.max(0, 1 - beatTime * 2.6), 2.2); 
          const isSnareBeat = ((now % 952) > 476);
          const snareImpact = isSnareBeat ? Math.pow(Math.max(0, 1 - ((now % 476) / 476) * 3.0), 1.6) : 0;
          const hihatPulse = Math.sin(now * 0.04) > 0.2 ? 0.75 + 0.25 * Math.sin(now * 0.09) : 0.2;

          for (let i = 0; i < numBands; i++) {
            const normPos = i / numBands; 
            let bandVal = 0;

            if (normPos < 0.25) {
              const bassLine = 0.45 + 0.45 * Math.sin(now * 0.006 + i * 0.6);
              bandVal = (kickImpact * 140) + (bassLine * 65);
            } else if (normPos < 0.65) {
              const melody = 0.45 + 0.45 * Math.sin(now * 0.008 + i * 0.75) * Math.cos(now * 0.004 - i * 0.35);
              bandVal = (snareImpact * 115) + (melody * 90);
            } else {
              const sparkle = 0.35 + 0.45 * Math.sin(now * 0.018 + i * 1.2);
              bandVal = (hihatPulse * 85) + (sparkle * 70);
            }

            let eqFactor = 1;
            if (engine && typeof engine.getEqGain === 'function') {
              if (i < 4) eqFactor = Math.max(0.3, 1 + engine.getEqGain(63) / 16);
              else if (i < 9) eqFactor = Math.max(0.3, 1 + engine.getEqGain(125) / 16);
              else if (i < 14) eqFactor = Math.max(0.3, 1 + engine.getEqGain(250) / 16);
              else if (i < 19) eqFactor = Math.max(0.3, 1 + engine.getEqGain(500) / 16);
              else if (i < 24) eqFactor = Math.max(0.3, 1 + engine.getEqGain(1000) / 16);
              else if (i < 28) eqFactor = Math.max(0.3, 1 + engine.getEqGain(3500) / 16);
              else eqFactor = Math.max(0.3, 1 + engine.getEqGain(10000) / 16);
            }

            const jitter = (Math.sin(now * 0.045 + i * 9.2) * 8);
            dataArray[i] = Math.min(230, Math.max(10, Math.floor((bandVal + jitter) * eqFactor * 0.82)));
          }

          for (let w = 0; w < 128; w++) {
            const wave = Math.sin(now * 0.02 + w * 0.16) * 48 * (0.6 + kickImpact * 0.45)
                       + Math.sin(now * 0.05 + w * 0.38) * 22;
            rawWaveData[w] = Math.min(255, Math.max(0, Math.floor(128 + wave)));
          }
        }
      }

      // Boot animation: Cherry blossom clip with Japanese Welcome (ようこそ) in pure white (5 seconds)
      if (isBooting && powered) {
        if (driftVideoRef.current && !driftVideoRef.current.paused) driftVideoRef.current.pause();
        if (tandemVideoRef.current && !tandemVideoRef.current.paused) tandemVideoRef.current.pause();
        if (sereneVideoRef.current && !sereneVideoRef.current.paused) sereneVideoRef.current.pause();
        if (bootVideoRef.current && bootVideoRef.current.paused) {
          bootVideoRef.current.play().catch(() => {});
        }
        const bootElapsed = now - bootStartTimeRef.current;
        drawJdmBootAnimation(ctx, width, height, bootElapsed, colors, dimmerLevel, theme, bootVideoRef.current);
        return;
      } else {
        if (bootVideoRef.current && !bootVideoRef.current.paused) {
          bootVideoRef.current.pause();
        }
      }

      // Synchronize video playback with visualizer modes
      const needsDrift = powered && !isBooting && visualizerMode === 'JDM_CAR_DOTS';
      const needsTandem = powered && !isBooting && (visualizerMode === 'JDM_TANDEM_DOTS' || visualizerMode === 'JDM_CAR_OLED');
      const needsSerene = powered && !isBooting && visualizerMode === 'SERENE_JAPAN';

      if (driftVideoRef.current) {
        const dv = driftVideoRef.current;
        if (needsDrift) {
          if (dv.paused) dv.play().catch(() => {});
        } else if (!dv.paused) {
          dv.pause();
        }
      }

      if (tandemVideoRef.current) {
        const tv = tandemVideoRef.current;
        if (needsTandem) {
          if (tv.paused) tv.play().catch(() => {});
        } else if (!tv.paused) {
          tv.pause();
        }
      }

      if (sereneVideoRef.current) {
        const sv = sereneVideoRef.current;
        if (needsSerene) {
          if (sv.paused) sv.play().catch(() => {});
        } else if (!sv.paused) {
          sv.pause();
        }
      }

      const effectiveDimmer = dimmerLevel;
      const isRgb = theme === 'rgb';

      // Audio spectral energy averages for reactive visualizers
      const bassAvg = ((dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3]) / (4 * 255));
      const midAvg = ((dataArray[8] + dataArray[9] + dataArray[10] + dataArray[11]) / (4 * 255));
      const highAvg = ((dataArray[20] + dataArray[21] + dataArray[22] + dataArray[23]) / (4 * 255));

      // Dynamic RGB rainbow color generator for spectrum bands
      const getBandRgb = (bandIdx: number, segIdx: number = 0) => {
        const baseHue = ((bandIdx / numBands) * 310 + (frameCounter * 0.75)) % 360;
        const segHue = (baseHue + segIdx * 3.5) % 360;
        const isTop = segIdx >= 13;
        const isMid = segIdx >= 10;
        return {
          on: `hsl(${segHue}, 100%, ${isTop ? '75%' : isMid ? '65%' : '52%'})`,
          off: `hsl(${segHue}, 35%, 10%)`,
          peak: `hsl(${(segHue + 20) % 360}, 100%, 82%)`,
          glow: `hsl(${segHue}, 100%, 55%)`
        };
      };

      // ==========================================
      // VISUALIZER MODES
      // ==========================================

      // MODE 1: OSCILLOSCOPE
      if (visualizerMode === 'OSCILLOSCOPE') {
        // Grid background
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.08)' : colors.primaryOff;
        ctx.lineWidth = 0.5;
        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        // Crosshair reticle
        for (let gx = 20; gx < width; gx += 20) {
          ctx.beginPath();
          ctx.moveTo(gx, height / 2 - 3);
          ctx.lineTo(gx, height / 2 + 3);
          ctx.stroke();
        }

        if (powered) {
          if (isRgb) {
            const grad = ctx.createLinearGradient(0, 0, width, 0);
            const phase = (frameCounter * 1.5) % 360;
            grad.addColorStop(0, `hsl(${phase % 360}, 100%, 60%)`);
            grad.addColorStop(0.2, `hsl(${(phase + 60) % 360}, 100%, 60%)`);
            grad.addColorStop(0.4, `hsl(${(phase + 120) % 360}, 100%, 60%)`);
            grad.addColorStop(0.6, `hsl(${(phase + 180) % 360}, 100%, 60%)`);
            grad.addColorStop(0.8, `hsl(${(phase + 240) % 360}, 100%, 60%)`);
            grad.addColorStop(1, `hsl(${(phase + 300) % 360}, 100%, 60%)`);
            ctx.strokeStyle = grad;
            ctx.shadowColor = `hsl(${phase % 360}, 100%, 60%)`;
          } else {
            ctx.strokeStyle = hexToRgba(colors.primary, effectiveDimmer);
            ctx.shadowColor = colors.primary;
          }
          ctx.shadowBlur = 6;
          ctx.lineWidth = 1.8;
          ctx.beginPath();

          const sliceWidth = width / 64;
          let x = 0;
          for (let i = 0; i < 64; i++) {
            const v = (rawWaveData[i * 2] || 128) / 128.0;
            const y = (v * height) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        return;
      }

      // MODE 2: DUAL ANALOG VU METERS
      if (visualizerMode === 'ANALOG_VU') {
        // Calculate average energy for L (bands 0..15) and R (bands 16..31)
        let sumL = 0;
        let sumR = 0;
        for (let i = 0; i < 16; i++) sumL += dataArray[i];
        for (let i = 16; i < 32; i++) sumR += dataArray[i];
        const targetL = powered ? (sumL / (16 * 255)) : 0;
        const targetR = powered ? (sumR / (16 * 255)) : 0;

        // Needle ballistic physics (fast attack, smooth decay)
        vuLeftRef.current += (targetL - vuLeftRef.current) * (targetL > vuLeftRef.current ? 0.35 : 0.12);
        vuRightRef.current += (targetR - vuRightRef.current) * (targetR > vuRightRef.current ? 0.35 : 0.12);

        const meterWidth = (width - 6) / 2;
        const meters = [
          { label: 'CH-L', val: vuLeftRef.current, x: 2, isRight: false },
          { label: 'CH-R', val: vuRightRef.current, x: meterWidth + 4, isRight: true }
        ];

        meters.forEach(m => {
          // Dynamic colors in RGB mode
          const meterPrimary = isRgb 
            ? (m.isRight ? '#ff3388' : '#00e5ff') 
            : colors.primary;
          const meterDanger = isRgb ? '#ffff33' : colors.danger;
          const meterBorder = isRgb ? 'rgba(255, 255, 255, 0.1)' : colors.primaryOff;

          // Meter border & arc face
          ctx.strokeStyle = meterBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(m.x, 4, meterWidth, height - 8);

          // Arc scale
          const pivotX = m.x + meterWidth / 2;
          const pivotY = height - 6;
          const radius = meterWidth * 0.72;

          // Dial marks: -20, -10, -5, -3, 0, +3 dB
          const minAngle = -Math.PI * 0.75;
          const maxAngle = -Math.PI * 0.25;

          ctx.strokeStyle = hexToRgba(meterPrimary, 0.4);
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, radius, minAngle, maxAngle);
          ctx.stroke();

          // Redline overload zone
          ctx.strokeStyle = meterDanger;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, radius, maxAngle - (maxAngle - minAngle) * 0.2, maxAngle);
          ctx.stroke();

          // Label
          ctx.fillStyle = hexToRgba(meterPrimary, effectiveDimmer);
          ctx.font = '7px monospace';
          ctx.fillText(m.label, m.x + 4, 14);
          ctx.fillText('VU', m.x + meterWidth - 16, 14);

          // Needle
          if (powered) {
            const needleAngle = minAngle + Math.min(1, Math.max(0, m.val * 1.25)) * (maxAngle - minAngle);
            const tipX = pivotX + Math.cos(needleAngle) * (radius - 2);
            const tipY = pivotY + Math.sin(needleAngle) * (radius - 2);

            const needleColor = m.val > 0.8 ? meterDanger : hexToRgba(meterPrimary, effectiveDimmer);
            ctx.strokeStyle = needleColor;
            ctx.shadowColor = needleColor;
            ctx.shadowBlur = 4;
            ctx.lineWidth = 1.2;

            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Needle pivot cap
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        return;
      }

      // MODE 3: DOT MATRIX (Small circular phosphor dots)
      if (visualizerMode === 'DOT_MATRIX') {
        const dotR = 1.6;
        for (let i = 0; i < numBands; i++) {
          const cx = i * (bandWidth + 1.5) + bandWidth / 2 + 1;
          const val = dataArray[i];
          // Calibrated headroom to prevent sticking to the top ceiling
          const litSegments = powered ? Math.min(segmentsPerBand - 1, Math.floor((val / 255) * segmentsPerBand * 0.86)) : 0;

          for (let j = 0; j < segmentsPerBand; j++) {
            const cy = height - (j * (segmentHeight + 1)) - segmentHeight / 2 - 1;
            const isLit = j < litSegments;

            let dotColor: string;
            let dotColorOff: string;

            if (isRgb) {
              const rgbInfo = getBandRgb(i, j);
              dotColor = rgbInfo.on;
              dotColorOff = rgbInfo.off;
            } else {
              dotColor = j >= 13 ? colors.danger : (j >= 10 ? colors.secondary : colors.primary);
              dotColorOff = j >= 13 ? colors.dangerOff : (j >= 10 ? colors.secondaryOff : colors.primaryOff);
            }

            // Bright vivid illumination on upper rows
            ctx.fillStyle = isLit ? (isRgb ? dotColor : hexToRgba(dotColor, Math.min(1.0, effectiveDimmer * (j >= 10 ? 1.15 : 1.0)))) : (isRgb ? dotColorOff : hexToRgba(dotColorOff, 0.4));
            ctx.shadowColor = isLit ? dotColor : 'transparent';
            ctx.shadowBlur = isLit ? (j >= 10 ? 4.5 : 3) : 0;
            ctx.beginPath();
            ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
            ctx.fill();

            if (isLit) {
              ctx.shadowBlur = 0;
              ctx.fillStyle = hexToRgba('#ffffff', (j >= 10 ? 0.75 : 0.5) * effectiveDimmer);
              ctx.beginPath();
              ctx.arc(cx, cy, 0.75, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.shadowBlur = 0;
        return;
      }

      // MODE 4: FIRE SPECTRUM
      if (visualizerMode === 'FIRE_SPECTRUM') {
        for (let i = 0; i < numBands; i++) {
          const x = i * (bandWidth + 1.5) + 1;
          const val = dataArray[i];
          // Calibrated flame height so sparks have breathing room at top and don't slam the ceiling
          const litHeight = powered ? (val / 255) * (height * 0.84) : 0;

          if (litHeight > 0) {
            const grad = ctx.createLinearGradient(0, height, 0, height - litHeight);
            if (isRgb) {
              const bHue = ((i / numBands) * 310 + frameCounter) % 360;
              grad.addColorStop(0, `hsl(${bHue}, 100%, 50%)`);
              grad.addColorStop(0.55, `hsl(${(bHue + 35) % 360}, 100%, 60%)`);
              grad.addColorStop(0.9, `hsl(${(bHue + 70) % 360}, 100%, 75%)`);
              grad.addColorStop(1, '#ffffff');
              ctx.shadowColor = `hsl(${bHue}, 100%, 60%)`;
            } else {
              grad.addColorStop(0, hexToRgba(colors.primary, effectiveDimmer));
              grad.addColorStop(0.55, hexToRgba(colors.secondary, effectiveDimmer));
              grad.addColorStop(0.9, hexToRgba(colors.danger, effectiveDimmer));
              grad.addColorStop(1, '#ffffff');
              ctx.shadowColor = colors.secondary;
            }

            ctx.fillStyle = grad;
            ctx.shadowBlur = 5;
            ctx.fillRect(x, height - litHeight, bandWidth, litHeight);

            // Flickering flame tip spark
            if (Math.random() > 0.4) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, height - litHeight - (Math.random() * 4 + 1), bandWidth, 1.5);
            }
          }
        }
        ctx.shadowBlur = 0;
        return;
      }

      // MODE 5: DISC - SPINNING OPTICAL DISC WITH AUDIO GROOVES & LASER READOUT
      if (visualizerMode === 'DISC') {
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) * 0.46;
        const spinAngle = frameCounter * (playing ? 0.05 : 0.008);
        const effectiveDimmer = Math.max(0.4, dimmerLevel);

        // Background subtle guide grid
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.06)' : hexToRgba(colors.primaryOff, 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.stroke();

        // Left & Right stereo spectrum bars flanking the disc
        const flankBars = 6;
        for (let b = 0; b < flankBars; b++) {
          const lVal = (dataArray[b] / 255) * (height - 8);
          const rVal = (dataArray[numBands - 1 - b] / 255) * (height - 8);
          const barW = 3;
          const lx = 8 + b * 5;
          const rx = width - 8 - flankBars * 5 + b * 5;

          const lColor = isRgb ? `hsl(${b * 30 + (frameCounter * 2) % 360}, 100%, 60%)` : hexToRgba(colors.primary, effectiveDimmer * 0.85);
          const rColor = isRgb ? `hsl(${b * 30 + 180 + (frameCounter * 2) % 360}, 100%, 60%)` : hexToRgba(colors.primary, effectiveDimmer * 0.85);

          // Left bar
          ctx.fillStyle = hexToRgba(colors.primaryOff, 0.25);
          ctx.fillRect(lx, 4, barW, height - 8);
          ctx.fillStyle = lColor;
          ctx.fillRect(lx, height - 4 - lVal, barW, lVal);

          // Right bar
          ctx.fillStyle = hexToRgba(colors.primaryOff, 0.25);
          ctx.fillRect(rx, 4, barW, height - 8);
          ctx.fillStyle = rColor;
          ctx.fillRect(rx, height - 4 - rVal, barW, rVal);
        }

        // Concentric Audio Grooves that pulsate with bass & volume
        const grooveCount = 5;
        const bassAvg = (dataArray[0] + dataArray[1] + dataArray[2]) / (3 * 255);
        for (let g = 1; g <= grooveCount; g++) {
          const gr = (maxR / (grooveCount + 1)) * g + (g === 1 ? bassAvg * 3 : 0);
          ctx.beginPath();
          ctx.arc(cx, cy, gr, 0, Math.PI * 2);
          const grooveHue = (g * 45 + frameCounter) % 360;
          ctx.strokeStyle = isRgb ? `hsla(${grooveHue}, 100%, 65%, 0.45)` : hexToRgba(colors.primary, 0.35 * effectiveDimmer);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Radial Spectrum Rays shooting outward from spindle to rim
        const numRays = 24;
        for (let r = 0; r < numRays; r++) {
          const rayAngle = spinAngle + (r / numRays) * Math.PI * 2;
          const dataIdx = Math.floor((r / numRays) * numBands);
          const rayEnergy = dataArray[dataIdx] / 255;
          const innerR = maxR * 0.22;
          const rayLen = innerR + (maxR - innerR) * (0.15 + rayEnergy * 0.85);

          const x1 = cx + Math.cos(rayAngle) * innerR;
          const y1 = cy + Math.sin(rayAngle) * innerR;
          const x2 = cx + Math.cos(rayAngle) * rayLen;
          const y2 = cy + Math.sin(rayAngle) * rayLen;

          const rayHue = (r * 15 + frameCounter * 1.5) % 360;
          ctx.strokeStyle = isRgb 
            ? `hsl(${rayHue}, 100%, ${rayEnergy > 0.7 ? '75%' : '55%'})` 
            : hexToRgba(rayEnergy > 0.75 ? colors.secondary : colors.primary, Math.max(0.2, rayEnergy) * effectiveDimmer);
          ctx.lineWidth = rayEnergy > 0.6 ? 1.6 : 1.0;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Sparkle pip at tip of high-energy rays
          if (rayEnergy > 0.65) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x2, y2, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Strobe Timing Dots around the outer rim (mimicking Technics/Pioneer turntable rim)
        const strobeDots = 36;
        for (let s = 0; s < strobeDots; s++) {
          const sAngle = spinAngle * 1.5 + (s / strobeDots) * Math.PI * 2;
          const sx = cx + Math.cos(sAngle) * (maxR - 1);
          const sy = cy + Math.sin(sAngle) * (maxR - 1);
          const isStrobeAccent = s % 4 === 0;

          ctx.fillStyle = isRgb 
            ? `hsl(${((s / strobeDots) * 360 + frameCounter) % 360}, 100%, 70%)` 
            : hexToRgba(colors.primary, (isStrobeAccent ? 0.95 : 0.45) * effectiveDimmer);
          ctx.beginPath();
          ctx.arc(sx, sy, isStrobeAccent ? 1.3 : 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center Spindle Clamp
        ctx.fillStyle = '#060709';
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isRgb ? '#ffffff' : colors.primary;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center brass/chrome pip
        ctx.fillStyle = isRgb ? `hsl(${frameCounter % 360}, 100%, 70%)` : colors.secondary;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Laser Optical Pickup Head with glowing reading diode
        const laserAngle = Math.PI * 0.22 + Math.sin(frameCounter * 0.03) * 0.08;
        const laserDist = maxR * (0.45 + (bassAvg * 0.35));
        const lx = cx + Math.cos(laserAngle) * laserDist;
        const ly = cy + Math.sin(laserAngle) * laserDist;

        // Laser pickup arm guide line
        ctx.strokeStyle = hexToRgba('#ffffff', 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + maxR + 12, cy - maxR * 0.4);
        ctx.lineTo(lx, ly);
        ctx.stroke();

        // Bright laser pickup diode dot
        ctx.fillStyle = '#ff2233';
        ctx.shadowColor = '#ff2233';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lx, ly, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return;
      }

      // MODE 6: TUNNEL - 3D PERSPECTIVE CYBER WIREFRAME ROAD & AUDIO RADAR
      if (visualizerMode === 'TUNNEL') {
        const vpX = width / 2;
        const vpY = height * 0.42;
        const effectiveDimmer = Math.max(0.4, dimmerLevel);
        const bassLevel = (dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3]) / (4 * 255);

        // Infinite Horizon Line
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.2)' : hexToRgba(colors.primaryOff, 0.45);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, vpY);
        ctx.lineTo(width, vpY);
        ctx.stroke();

        // Perspective Depth Grid Lines (Radiating from Vanishing Point down to bottom)
        const gridCols = 14;
        for (let c = -gridCols / 2; c <= gridCols / 2; c++) {
          const bottomX = vpX + c * (width / (gridCols - 2)) * 1.6;
          ctx.beginPath();
          ctx.moveTo(vpX, vpY);
          ctx.lineTo(bottomX, height);
          const lineHue = (c * 20 + frameCounter * 1.5) % 360;
          ctx.strokeStyle = isRgb ? `hsla(${lineHue}, 100%, 65%, 0.35)` : hexToRgba(colors.primary, 0.3 * effectiveDimmer);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        // Perspective Transverse Grid Rungs (Moving toward screen with audio wave undulation)
        const rungs = 9;
        const speed = playing ? (0.04 + bassLevel * 0.05) : 0.01;
        const offset = (frameCounter * speed) % 1;

        for (let r = 0; r < rungs; r++) {
          const t = (r + offset) / rungs; // 0 (near horizon) to 1 (near bottom)
          const py = vpY + Math.pow(t, 2.2) * (height - vpY);
          const rungSpan = width * Math.pow(t, 1.2) * 1.5;
          const leftX = vpX - rungSpan / 2;
          const rightX = vpX + rungSpan / 2;

          // Audio waviness across rung
          ctx.beginPath();
          const wavePoints = 24;
          for (let p = 0; p <= wavePoints; p++) {
            const px = leftX + (p / wavePoints) * rungSpan;
            const freqIdx = Math.min(numBands - 1, Math.floor((p / wavePoints) * numBands));
            const audioAmp = (dataArray[freqIdx] / 255) * 14 * t;
            const waveY = py - audioAmp * Math.sin((p / wavePoints) * Math.PI);
            if (p === 0) ctx.moveTo(px, waveY);
            else ctx.lineTo(px, waveY);
          }

          const rungHue = (r * 35 + frameCounter * 2) % 360;
          ctx.strokeStyle = isRgb 
            ? `hsl(${rungHue}, 100%, ${60 + t * 25}%)` 
            : hexToRgba(t > 0.7 ? colors.secondary : colors.primary, (0.3 + t * 0.7) * effectiveDimmer);
          ctx.lineWidth = 0.8 + t * 1.4;
          ctx.stroke();
        }

        // Expanding Bass Vector Ring from Horizon
        const ringScale = (frameCounter * (playing ? 0.06 : 0.015) + bassLevel) % 1;
        const ringW = ringScale * width * 0.75;
        const ringH = ringScale * height * 0.6;
        ctx.strokeStyle = isRgb ? `hsl(${frameCounter % 360}, 100%, 75%)` : hexToRgba(colors.secondary, (1 - ringScale) * effectiveDimmer);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(vpX, vpY, ringW / 2, ringH / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3D Audio Floating Vector Stars
        const starCount = 18;
        for (let s = 0; s < starCount; s++) {
          const starSeed = (s * 9301 + 49297) % 233280;
          const angle = (starSeed / 233280) * Math.PI * 2;
          const starProgress = ((frameCounter * (0.02 + (s % 3) * 0.01) + s / starCount) % 1);
          const starDist = Math.pow(starProgress, 1.8) * (width * 0.45);
          const sx = vpX + Math.cos(angle) * starDist;
          const sy = vpY + Math.sin(angle) * starDist * 0.6;

          if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
            ctx.fillStyle = isRgb ? `hsl(${(s * 40 + frameCounter * 3) % 360}, 100%, 80%)` : '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, 0.6 + starProgress * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        return;
      }

      // MODE 7: RETRO_CASSETTE - VINTAGE 80S/90S JDM DUAL TAPE REEL & MAGNETIC HEAD VISUALIZER
      if (visualizerMode === 'RETRO_CASSETTE') {
        const effectiveDimmer = Math.max(0.4, dimmerLevel);

        // Cassette Shell Bevel & Window Frame
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.18)' : hexToRgba(colors.primaryOff, 0.5);
        ctx.lineWidth = 1;
        ctx.strokeRect(26, 6, width - 52, height - 12);
        
        // Chamfered inner viewing window
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.28)' : hexToRgba(colors.primary, 0.3 * effectiveDimmer);
        ctx.strokeRect(32, 12, width - 64, height - 24);

        // Vintage VFD Tape Info Badges
        ctx.fillStyle = isRgb ? 'rgba(255, 255, 255, 0.8)' : hexToRgba(colors.primary, 0.7 * effectiveDimmer);
        ctx.font = '6.5px monospace';
        ctx.fillText('CrO2 [TYPE II] HIGH BIAS', 36, 22);
        ctx.fillText('DOLBY B·C NR', width - 88, 22);

        // Side Vertical LED Ladder VU Meters
        const ladderSegments = 14;
        const ladderW = 8;
        const ladderH = (height - 24) / ladderSegments;
        const litL = Math.floor((bassAvg * 1.3) * ladderSegments);
        const litR = Math.floor(((midAvg * 0.7 + highAvg * 0.6) * 1.3) * ladderSegments);

        for (let s = 0; s < ladderSegments; s++) {
          const sy = height - 14 - (s + 1) * ladderH;
          const isLitL = s < litL;
          const isLitR = s < litR;
          
          let segColor = colors.primary;
          let segColorOff = colors.primaryOff;
          if (s >= 11) {
            segColor = colors.danger;
            segColorOff = colors.dangerOff;
          } else if (s >= 8) {
            segColor = colors.secondary;
            segColorOff = colors.secondaryOff;
          }

          // Left meter bar
          ctx.fillStyle = isLitL 
            ? (isRgb ? `hsl(${s * 18 + frameCounter}, 100%, 65%)` : hexToRgba(segColor, effectiveDimmer))
            : (isRgb ? 'rgba(255, 255, 255, 0.05)' : hexToRgba(segColorOff, 0.35));
          ctx.fillRect(8, sy, ladderW, ladderH - 1.5);

          // Right meter bar
          ctx.fillStyle = isLitR 
            ? (isRgb ? `hsl(${s * 18 + 140 + frameCounter}, 100%, 65%)` : hexToRgba(segColor, effectiveDimmer))
            : (isRgb ? 'rgba(255, 255, 255, 0.05)' : hexToRgba(segColorOff, 0.35));
          ctx.fillRect(width - 16, sy, ladderW, ladderH - 1.5);
        }

        // Mechanical Tape Counter Readout in the Center Top
        const tapeTicks = Math.floor((frameCounter * (playing ? 0.35 : 0.02)) % 9999);
        const counterStr = String(tapeTicks).padStart(4, '0');
        const isFwdBlink = playing && Math.floor(frameCounter / 12) % 2 === 0;

        ctx.fillStyle = isRgb ? `hsl(${frameCounter % 360}, 100%, 75%)` : hexToRgba(colors.secondary, effectiveDimmer);
        ctx.font = '7.5px monospace';
        ctx.fillText(`TAPE: ${counterStr}`, width / 2 - 28, 23);
        if (isFwdBlink) {
          ctx.fillStyle = isRgb ? '#ffffff' : hexToRgba(colors.danger, effectiveDimmer);
          ctx.fillText('▶▶', width / 2 + 20, 23);
        }

        // Dual Spools Geometry
        const leftSpoolX = 86;
        const rightSpoolX = width - 86;
        const spoolY = 64;
        const maxTapeRadius = 28;
        const minTapeRadius = 14;

        // Dynamic tape transfer animation
        const transferProgress = ((frameCounter * (playing ? 0.0006 : 0.00008)) % 1);
        const leftTapeRadius = minTapeRadius + (1 - transferProgress) * (maxTapeRadius - minTapeRadius);
        const rightTapeRadius = minTapeRadius + transferProgress * (maxTapeRadius - minTapeRadius);

        // Rotation angles
        const baseSpeed = playing ? (0.04 + bassAvg * 0.04) : 0.005;
        const leftRot = (frameCounter * baseSpeed * (minTapeRadius / leftTapeRadius));
        const rightRot = (frameCounter * baseSpeed * (minTapeRadius / rightTapeRadius));

        // Helper to draw a detailed cassette tape spool
        const drawSpool = (cx: number, cy: number, tapeR: number, rotAngle: number) => {
          // 1. Wound Tape Pancake
          const tapeGrad = ctx.createRadialGradient(cx, cy, minTapeRadius - 1, cx, cy, tapeR);
          if (isRgb) {
            tapeGrad.addColorStop(0, '#1a1020');
            tapeGrad.addColorStop(0.5, '#2d1838');
            tapeGrad.addColorStop(1, '#110c14');
          } else {
            tapeGrad.addColorStop(0, '#1c1510');
            tapeGrad.addColorStop(0.6, '#281c12');
            tapeGrad.addColorStop(1, '#0e0b08');
          }
          ctx.fillStyle = tapeGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, tapeR, 0, Math.PI * 2);
          ctx.fill();

          // Magnetic tape concentric wind ridges
          ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.07)' : hexToRgba(colors.primary, 0.12 * effectiveDimmer);
          ctx.lineWidth = 0.5;
          for (let r = minTapeRadius + 3; r < tapeR - 1; r += 3) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 2. Hub Body
          ctx.fillStyle = '#0a0d12';
          ctx.beginPath();
          ctx.arc(cx, cy, minTapeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isRgb ? `hsl(${(rotAngle * 50) % 360}, 100%, 70%)` : hexToRgba(colors.primary, 0.6 * effectiveDimmer);
          ctx.lineWidth = 1;
          ctx.stroke();

          // 3. 3-Prong Drive Spoke Teeth
          const prongs = 3;
          for (let p = 0; p < prongs; p++) {
            const pAngle = rotAngle + (p / prongs) * Math.PI * 2;
            const toothLength = minTapeRadius * 0.78;
            const tx = cx + Math.cos(pAngle) * toothLength;
            const ty = cy + Math.sin(pAngle) * toothLength;

            ctx.strokeStyle = isRgb ? '#ffffff' : hexToRgba(colors.primary, effectiveDimmer);
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(pAngle) * 4, cy + Math.sin(pAngle) * 4);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Tooth triangular driving notch
            ctx.fillStyle = isRgb ? `hsl(${((p * 120) + frameCounter * 2) % 360}, 100%, 65%)` : colors.secondary;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. Center Spindle Hole
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.4)' : hexToRgba(colors.primaryOff, 0.6);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        };

        // Draw Left & Right Spools
        drawSpool(leftSpoolX, spoolY, leftTapeRadius, leftRot);
        drawSpool(rightSpoolX, spoolY, rightTapeRadius, rightRot);

        // Guide Rollers (Tape Turn Corners)
        const leftRollerX = 54;
        const rightRollerX = width - 54;
        const rollerY = 100;
        const headY = 105;

        // Draw guide rollers
        [leftRollerX, rightRollerX].forEach((rx, idx) => {
          ctx.fillStyle = '#1e242c';
          ctx.beginPath();
          ctx.arc(rx, rollerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isRgb ? '#ffffff' : colors.primary;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fillStyle = isRgb ? `hsl(${(frameCounter * 3 + idx * 180) % 360}, 100%, 70%)` : colors.secondary;
          ctx.beginPath();
          ctx.arc(rx, rollerY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Center Tape Read Head Bracket (Permalloy Head)
        const headX = width / 2;
        ctx.fillStyle = '#14171d';
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.4)' : hexToRgba(colors.primary, 0.5 * effectiveDimmer);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX - 16, headY + 12);
        ctx.lineTo(headX - 12, headY - 3);
        ctx.lineTo(headX + 12, headY - 3);
        ctx.lineTo(headX + 16, headY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Magnetic Head Gap Line & Azimuth Indicator
        ctx.strokeStyle = isRgb ? '#ff2a6d' : colors.danger;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX, headY - 3);
        ctx.lineTo(headX, headY + 8);
        ctx.stroke();

        // Magnetic Tape Ribbon Running Between Spools, Rollers, and Head
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.7)' : hexToRgba(colors.secondary, 0.8 * effectiveDimmer);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(leftSpoolX - leftTapeRadius * 0.8, spoolY + leftTapeRadius * 0.5);
        ctx.lineTo(leftRollerX, rollerY);
        ctx.lineTo(headX - 12, headY);
        ctx.stroke();

        // Active Audio Waveform along the Magnetic Tape Gap at the Read Head
        ctx.beginPath();
        const wavePoints = 24;
        const waveSpan = 24;
        for (let w = 0; w <= wavePoints; w++) {
          const wx = (headX - 12) + (w / wavePoints) * waveSpan;
          const waveAmp = (rawWaveData[w * 4] - 128) / 128;
          const wy = headY + waveAmp * (playing ? 5.5 : 0.8) * (0.8 + bassAvg * 0.6);
          if (w === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = isRgb ? `hsl(${frameCounter % 360}, 100%, 75%)` : colors.danger;
        ctx.shadowColor = isRgb ? '#ff0055' : colors.danger;
        ctx.shadowBlur = playing ? 5 : 0;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Head to right roller and spool
        ctx.strokeStyle = isRgb ? 'rgba(255, 255, 255, 0.7)' : hexToRgba(colors.secondary, 0.8 * effectiveDimmer);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(headX + 12, headY);
        ctx.lineTo(rightRollerX, rollerY);
        ctx.lineTo(rightSpoolX + rightTapeRadius * 0.8, spoolY + rightTapeRadius * 0.5);
        ctx.stroke();

        // Tape Head Reading Flux Sparkles on Beats
        if (playing && bassAvg > 0.45) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(headX, headY - 1, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        return;
      }

      // MODE: JDM_CAR_DOTS (1-Colour Dot-Matrix from the original drift video - Clean, no text or overlays)
      if (visualizerMode === 'JDM_CAR_DOTS') {
        const v = driftVideoRef.current;
        const offscreen = offscreenCanvasRef.current;
        renderDotMatrixFromVideo(v, ctx, width, height, offscreen, effectiveDimmer, now);
        return;
      }

      // MODE: JDM_TANDEM_DOTS (1-Colour Dot-Matrix from YouTube tandem drift edit - Clean, no text or overlays)
      if (visualizerMode === 'JDM_TANDEM_DOTS') {
        const v = tandemVideoRef.current;
        const offscreen = offscreenCanvasRef.current;
        renderDotMatrixFromVideo(v, ctx, width, height, offscreen, effectiveDimmer, now);
        return;
      }

      // MODE: JDM_CAR_OLED (Full OLED Coloured Drift Video - Clean, no text or overlays)
      if (visualizerMode === 'JDM_CAR_OLED') {
        const v = tandemVideoRef.current || driftVideoRef.current;

        // Pure OLED Black base
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Draw crisp drift video filling the display
        if (v && v.readyState >= 2) {
          ctx.drawImage(v, 0, 0, width, height);
        } else {
          // Responsive standby glow during initial buffering
          const pulse = (Math.sin(now * 0.003) * 0.5 + 0.5) * 0.15;
          ctx.fillStyle = `rgba(30, 40, 55, ${pulse * effectiveDimmer})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Natural hardware dimmer integration (no text, no gauges, no visualizers on top)
        if (effectiveDimmer < 1) {
          ctx.fillStyle = `rgba(0, 0, 0, ${(1 - effectiveDimmer) * 0.75})`;
          ctx.fillRect(0, 0, width, height);
        }

        return;
      }

      // MODE: SERENE_JAPAN (Serene Mount Fuji panoramic footage - clean, pristine, no text, no heavy effects)
      if (visualizerMode === 'SERENE_JAPAN') {
        const sv = sereneVideoRef.current;

        // Pure OLED Black base
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Draw crisp serene Mount Fuji video filling the display
        if (sv && sv.readyState >= 2) {
          ctx.drawImage(sv, 0, 0, width, height);
        } else {
          // Responsive serene twilight standby glow during initial buffering
          const pulse = (Math.sin(now * 0.002) * 0.5 + 0.5) * 0.12;
          ctx.fillStyle = `rgba(20, 35, 60, ${pulse * effectiveDimmer})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Natural hardware dimmer integration (no text, no visualizer effects)
        if (effectiveDimmer < 1) {
          ctx.fillStyle = `rgba(0, 0, 0, ${(1 - effectiveDimmer) * 0.75})`;
          ctx.fillRect(0, 0, width, height);
        }

        return;
      }
      for (let i = 0; i < numBands; i++) {
        const x = i * (bandWidth + 1.5) + 1;
        const val = dataArray[i]; 
        
        // Calibrated headroom (0.86) to prevent visualizer bars from continuously slamming the top at max volume
        const targetSegments = (powered && !isBooting) 
          ? Math.min(segmentsPerBand - 1, Math.floor((val / 255) * segmentsPerBand * 0.86)) 
          : 0;
        
        // Peak hold physics
        if (!isBooting) {
          if (targetSegments >= peakHold[i]) {
            peakHold[i] = targetSegments;
            peakHoldTime[i] = visualizerMode === 'PEAK_FALL' ? 24 : 16;
          } else {
            if (peakHoldTime[i] > 0) {
              peakHoldTime[i]--;
            } else {
              peakHold[i] = Math.max(0, peakHold[i] - (visualizerMode === 'PEAK_FALL' ? 0.2 : 0.35));
            }
          }
        }

        const litSegments = targetSegments;

        for (let j = 0; j < segmentsPerBand; j++) {
          const y = height - (j * (segmentHeight + 1)) - segmentHeight - 1;
          
          let isLit = j < litSegments;
          const isPeak = Math.floor(peakHold[i]) === j && powered && peakHold[i] > 0;
          
          let colorOff: string;
          let colorOn: string;

          if (isRgb) {
            const rgbInfo = getBandRgb(i, j);
            colorOn = rgbInfo.on;
            colorOff = rgbInfo.off;
          } else if (j >= 13) {
            colorOff = colors.dangerOff;
            // Enhanced brightness multiplier for upper segments to banish dimness
            colorOn = hexToRgba(colors.danger, Math.min(1.0, effectiveDimmer * 1.15));
          } else if (j >= 10) {
            colorOff = colors.secondaryOff;
            colorOn = hexToRgba(colors.secondary, Math.min(1.0, effectiveDimmer * 1.1));
          } else {
            colorOff = colors.primaryOff;
            colorOn = hexToRgba(colors.primary, effectiveDimmer);
          }

          if (visualizerMode === 'PEAK_FALL') {
            // Peak fall mode highlights falling laser dots with bright illuminated bars
            if (isPeak) {
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 6;
              ctx.shadowColor = isRgb ? colorOn : (j >= 13 ? colors.danger : colorOn);
              ctx.fillRect(x, y, bandWidth, segmentHeight);
            } else if (isLit) {
              ctx.fillStyle = isRgb ? colorOn : hexToRgba(colorOn, 0.88);
              ctx.shadowBlur = allowGlow ? (j >= 10 ? 3.5 : 2) : 0;
              ctx.shadowColor = colorOn;
              ctx.fillRect(x, y, bandWidth, segmentHeight);
              if (j >= 10 && allowGlow) {
                ctx.fillStyle = hexToRgba('#ffffff', (j >= 13 ? 0.4 : 0.25) * effectiveDimmer);
                ctx.fillRect(x, y, bandWidth, 1);
              }
            } else {
              ctx.fillStyle = colorOff;
              ctx.shadowBlur = 0;
              ctx.fillRect(x, y, bandWidth, segmentHeight);
            }
          } else {
            // Standard Classic BARS: Upper segments get vivid phosphor glow and crisp highlight
            ctx.fillStyle = (isLit || isPeak) ? colorOn : colorOff;
            ctx.shadowBlur = (isLit || isPeak && allowGlow) ? (isPeak ? 6 : (isRgb ? 4 : (j >= 11 ? 5 : 3))) : 0;
            ctx.shadowColor = (isLit || isPeak && allowGlow) ? (isPeak ? '#ffffff' : (j >= 13 ? colors.danger : colorOn)) : 'transparent';
            ctx.fillRect(x, y, bandWidth, segmentHeight);

            // Fluorescent crisp highlight on upper lit segments (j >= 10) so they stand out brightly
            if (isLit && j >= 10 && allowGlow) {
              ctx.fillStyle = hexToRgba('#ffffff', (j >= 13 ? 0.45 : 0.28) * effectiveDimmer);
              ctx.fillRect(x, y, bandWidth, 1);
            }
          }
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [engine, powered, dimmerLevel, isBooting, isYtPlaying, playing, theme, visualizerMode, fpsLimit, canvasGlow, lowEndMode, simplifiedDisplayOnIdle]);

  return (
    <>
      <video
        ref={driftVideoRef}
        src="/jdm_drift_original.mp4"
        muted
        loop
        playsInline
        preload="none"
        className="hidden"
        style={{ display: 'none' }}
      />
      <video
        ref={tandemVideoRef}
        src="/jdm_tandem_clip.mp4"
        muted
        loop
        playsInline
        preload="none"
        className="hidden"
        style={{ display: 'none' }}
      />
      <video
        ref={sereneVideoRef}
        src="/serene_japan.mp4"
        muted
        loop
        playsInline
        preload="none"
        className="hidden"
        style={{ display: 'none' }}
      />
      <video
        ref={bootVideoRef}
        src="/cherry_blossom.mp4"
        muted
        loop
        playsInline
        preload="none"
        className="hidden"
        style={{ display: 'none' }}
      />
      <canvas 
        ref={canvasRef} 
        width={270} 
        height={134} 
        className="w-full h-full block"
      />
    </>
  );
};
