import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  powered: boolean;
  bootDelay?: number;
  isBooting?: boolean;
  onChange: (val: number) => void;
  size?: number;
}

export const RotaryDial: React.FC<Props> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  powered,
  bootDelay = 0,
  isBooting = false,
  onChange,
  size = 66
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);

  // Map value to angle (-135 deg to +135 deg, 270 deg range)
  const norm = (value - min) / (max - min);
  const angle = -135 + norm * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!powered) return;
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !powered) return;
    const dy = startYRef.current - e.clientY;
    const range = max - min;
    const sensitivity = 120; // pixels for full range
    const deltaVal = (dy / sensitivity) * range;
    let nextVal = Math.round((startValRef.current + deltaVal) / step) * step;
    nextVal = Math.max(min, Math.min(max, nextVal));
    onChange(nextVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!powered) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const nextVal = Math.max(min, Math.min(max, value + delta));
    onChange(nextVal);
  };

  // Generate perimeter tick lines for fine adjustment: 31 precision light dots spanning -135° to +135° in 9° increments
  const ticks = useMemo(() => {
    const arr = [];
    const count = 31;
    const stepDeg = 270 / (count - 1); // 9 degrees per dot
    for (let i = 0; i < count; i++) {
      const tAngle = -135 + i * stepDeg;
      const isCenter = i === 15; // 0 deg center detent
      const isMajor = i % 5 === 0; // -135, -90, -45, 0, 45, 90, 135
      arr.push({ angle: tAngle, isCenter, isMajor, index: i });
    }
    return arr;
  }, []);

  return (
    <div 
      className="flex flex-col items-center select-none my-1"
      style={{
        '--boot-delay': `${bootDelay}s`
      } as React.CSSProperties}
    >
      {/* Static Label */}
      <div className="flex items-center justify-center w-full px-0.5 mb-0.5">
        <span className={`text-[7.5px] font-label font-bold tracking-wider transition-all duration-300 ${
          powered 
            ? 'text-[var(--color-lcd-primary)] drop-shadow-[0_0_2px_var(--color-lcd-primary)]' 
            : 'text-zinc-600'
        }`}>
          {label}
        </span>
      </div>

      {/* Outer Dial Assembly with Tick Ring */}
      <div 
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`rotary-dial-housing relative flex items-center justify-center cursor-grab active:cursor-grabbing rounded-full touch-none group ${
          isBooting ? 'booting-dial' : ''
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'radial-gradient(circle at center, #0a0a0c 0%, #151619 80%, #08090a 100%)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,0.9), 0 0 1px #000',
          border: '1px solid #1a1a1e'
        }}
        title={`Rotate to adjust ${label} (${value}${unit})`}
      >
        {/* Circular Perimeter Fine Adjustment Light Dots */}
        {ticks.map((t, i) => {
          const isPassed = t.angle <= angle + 0.5;
          return (
            <div
              key={i}
              className="absolute pointer-events-none origin-bottom flex flex-col items-center"
              style={{
                height: `${size / 2 - 2}px`,
                width: '3px',
                bottom: `${size / 2}px`,
                transform: `rotate(${t.angle}deg)`
              }}
            >
              <div 
                className={`rounded-full transition-all duration-150 ${
                  t.isCenter 
                    ? 'w-[2.5px] h-[3.5px]' 
                    : t.isMajor 
                      ? 'w-[2px] h-[2.5px]' 
                      : 'w-[1.5px] h-[1.5px]'
                } ${
                  powered && isPassed
                    ? 'bg-[var(--color-lcd-primary)] shadow-[0_0_3.5px_var(--color-lcd-primary)] rotary-led-active'
                    : (powered ? 'bg-zinc-700/70' : 'bg-zinc-800/80')
                }`}
                style={{
                  opacity: powered && isPassed ? 'var(--backlight-multiplier, 1)' : undefined
                }}
              />
            </div>
          );
        })}

        {/* Machined Brushed Metal Dial Body */}
        <div 
          className="rotary-dial-knob relative rounded-full flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{
            width: `${size - 18}px`,
            height: `${size - 18}px`,
            background: `
              repeating-radial-gradient(circle at center, transparent 0, transparent 1.2px, rgba(0,0,0,0.15) 1.6px, transparent 2.2px),
              conic-gradient(
                from 0deg,
                #181a20 0deg,
                #2e323c 30deg,
                #444a56 50deg,
                #1c1e24 85deg,
                #2b2f38 120deg,
                #3a3f4b 150deg,
                #484f5c 170deg,
                #17191e 205deg,
                #292d36 240deg,
                #3c414d 270deg,
                #4a515f 290deg,
                #1b1d22 325deg,
                #181a20 360deg
              )
            `,
            boxShadow: '0 4px 10px rgba(0,0,0,0.95), inset 0 1px 1.5px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.85)',
            border: '1.5px solid #252830',
            transform: `rotate(${angle}deg)`
          }}
        >
          {/* Milled Outer Knurling Chamfer */}
          <div 
            className="rotary-dial-knurl absolute inset-[1.5px] rounded-full"
            style={{
              background: 'repeating-conic-gradient(from 0deg, #2b2f38 0deg 2.5deg, #0e1013 2.5deg 5deg)',
              opacity: 0.45,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)'
            }}
          />

          {/* Precision Machined Brushed Metal Face */}
          <div 
            className="rotary-dial-face absolute inset-[3.5px] rounded-full"
            style={{
              background: `
                repeating-radial-gradient(circle at center, transparent 0, transparent 1.5px, rgba(0,0,0,0.12) 1.8px, transparent 2.5px),
                conic-gradient(
                  from 45deg,
                  #1f2229 0deg,
                  #363b46 40deg,
                  #181a20 90deg,
                  #303440 135deg,
                  #454c59 180deg,
                  #15171d 225deg,
                  #2d313c 270deg,
                  #474e5b 315deg,
                  #1f2229 360deg
                )
              `,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.8)'
            }}
          />

          {/* Recessed Indicator Notch / Illuminated Jewel Pip */}
          <div 
            className="absolute top-[3px] rounded-full transition-all rotary-notch"
            style={{
              width: '2.5px',
              height: `${(size - 18) * 0.32}px`,
              background: powered 
                ? 'var(--color-lcd-primary)' 
                : '#14161a',
              boxShadow: powered 
                ? '0 0 calc(4px * var(--backlight-multiplier, 1)) var(--color-lcd-primary), 0 0 1px #fff' 
                : 'inset 0 1px 2px rgba(0,0,0,0.9)',
              border: '0.5px solid rgba(0,0,0,0.8)',
              opacity: powered ? 'var(--backlight-multiplier, 1)' : 0.4,
              zIndex: 10
            }}
          />

          {/* Center Spun Metal Cap */}
          <div 
            className="rotary-center-cap absolute rounded-full"
            style={{
              width: `${Math.round(size * 0.22)}px`,
              height: `${Math.round(size * 0.22)}px`,
              background: 'conic-gradient(from 180deg, #1c1e25 0deg, #353a46 45deg, #16181f 90deg, #2f333f 135deg, #434957 180deg, #14161c 225deg, #2b303a 270deg, #3d4350 315deg, #1c1e25 360deg)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 1.5px 4px rgba(0,0,0,0.85)',
              border: '1px solid #20232b',
              zIndex: 5
            }}
          />
        </div>
      </div>
    </div>
  );
};
