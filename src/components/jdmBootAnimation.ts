/**
 * JDM Carrozzeria CQ-TX5500 Display Engine
 * 
 * Includes:
 * - drawPoweredOffDisplay: Smoked OLED standby glass
 * - drawJdmBootAnimation: 5-second Cherry Blossom clip with Japanese Welcome ("ようこそ") in pure white
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  danger: string;
  primaryOff: string;
  secondaryOff: string;
  dangerOff: string;
}

export function hexToRgba(hex: string, alpha: number): string {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return `rgba(0, 229, 255, ${alpha})`;
}

/**
 * Powered Off Display: Deep smoked OLED glass with subtle unlit subpixel matrix
 */
export function drawPoweredOffDisplay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: ThemeColors,
  _theme?: string
) {
  ctx.save();

  // Pure deep OLED black
  ctx.fillStyle = '#020304';
  ctx.fillRect(0, 0, width, height);

  // Optical glass perimeter bezel
  ctx.strokeStyle = '#0e1117';
  ctx.lineWidth = 1;
  ctx.strokeRect(3.5, 3.5, width - 7, height - 7);

  // Faint unlit OLED subpixel grid
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let y = 6; y < height - 6; y += 4) {
    for (let x = 6; x < width - 6; x += 4) {
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }

  // Subtle glass reflection
  const reflGrad = ctx.createLinearGradient(0, 0, width, height * 0.7);
  reflGrad.addColorStop(0, 'rgba(255, 255, 255, 0.025)');
  reflGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.008)');
  reflGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * JDM Cherry Blossom Boot Animation with Japanese Welcome (ようこそ) in pure white
 * Duration: 5000ms
 * Displays only welcome in Japanese in white over the cherry blossom video clip.
 */
export function drawJdmBootAnimation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bootElapsed: number,
  colors: ThemeColors,
  dimmerLevel: number,
  theme?: string,
  bootVideo?: HTMLVideoElement | null
) {
  ctx.save();

  // 1. Deep OLED Canvas Base
  ctx.fillStyle = '#060307';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Cherry Blossom Video Frame
  if (bootVideo && bootVideo.readyState >= 2) {
    ctx.drawImage(bootVideo, 0, 0, width, height);
  }

  // 3. Cinematic contrast overlay for crisp legibility and dimmer integration
  const darkAlpha = 0.30 + (1 - dimmerLevel) * 0.55;
  ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
  ctx.fillRect(0, 0, width, height);

  // 4. Subtle OLED raster scanlines for authentic retro-digital panel feel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let y = 0; y < height; y += 2) {
    ctx.fillRect(0, y, width, 0.7);
  }

  // 5. 5-Second (5000ms) Boot Timing:
  // - 0 to 800ms: Smooth fade-in
  // - 800ms to 4200ms: Solid luminous display
  // - 4200ms to 5000ms: Gentle fade-out transition
  let textAlpha = 1;
  let scale = 1;
  if (bootElapsed < 800) {
    const t = Math.max(0, bootElapsed / 800);
    // Smooth quadratic ease-out
    textAlpha = t * (2 - t);
    scale = 0.94 + 0.06 * textAlpha;
  } else if (bootElapsed > 4200) {
    const t = Math.min(1, Math.max(0, (bootElapsed - 4200) / 800));
    textAlpha = Math.max(0, 1 - t * t);
    scale = 1 + 0.04 * t;
  }

  // 6. Over it display ONLY "Welcome" in Japanese in white ("ようこそ")
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = textAlpha * dimmerLevel;

  // Japanese Welcome Typography
  ctx.font = '700 28px "Noto Sans JP", "Hiragino Sans", "Meiryo", "Yu Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Luminous white bloom aura
  ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowBlur = 12 * dimmerLevel;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ようこそ', 0, 0);

  // Core crisp white layer
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ようこそ', 0, 0);

  ctx.restore();

  ctx.restore();
}
