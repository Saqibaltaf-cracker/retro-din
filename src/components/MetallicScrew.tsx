import React from 'react';

interface Props {
  size?: number;
  rotation?: number;
  className?: string;
}

/**
 * Realistic Machined Metallic Chassis Screw
 * Features:
 * - Counter-sunk bevel with high-contrast specular metallic gradient
 * - Concentric brushed circular reflections (steel / titanium look)
 * - Authentic 3D cross-slot with deep shadow and highlight bevel
 */
export const MetallicScrew: React.FC<Props> = ({ 
  size = 14, 
  rotation = 35, 
  className = '' 
}) => {
  return (
    <div 
      className={`relative rounded-full flex items-center justify-center select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'radial-gradient(circle at 35% 35%, #e8ecf1 0%, #a8b0bc 30%, #5d6470 65%, #2a2e37 95%, #181a20 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -1.5px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,1)',
        border: '1px solid #1a1d24'
      }}
      title="Metallic Mounting Hardware"
    >
      {/* Outer Machined Bevel Ring */}
      <div 
        className="absolute inset-[1.5px] rounded-full pointer-events-none"
        style={{
          background: 'conic-gradient(from 45deg, #d8dee9, #6d7582, #f0f4f8, #59616e, #e2e8f0, #4c5360, #f8fafc, #646c7a, #d8dee9)',
          boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.6)'
        }}
      />

      {/* Recessed Center Socket Base */}
      <div 
        className="absolute inset-[3px] rounded-full flex items-center justify-center pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #383e4a 0%, #1c2028 100%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)'
        }}
      >
        {/* Cross Head Slots rotated at specific mechanical angle */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Horizontal Slot */}
          <div 
            className="absolute rounded-[0.5px]"
            style={{
              width: `${Math.max(4, size * 0.55)}px`,
              height: `${Math.max(1.2, size * 0.16)}px`,
              background: 'linear-gradient(180deg, #090a0d 0%, #151820 60%, #303642 100%)',
              boxShadow: '0 0.5px 0.5px rgba(255,255,255,0.4), inset 0 0.5px 1px #000'
            }}
          />
          {/* Vertical Slot */}
          <div 
            className="absolute rounded-[0.5px]"
            style={{
              height: `${Math.max(4, size * 0.55)}px`,
              width: `${Math.max(1.2, size * 0.16)}px`,
              background: 'linear-gradient(90deg, #090a0d 0%, #151820 60%, #303642 100%)',
              boxShadow: '0.5px 0 0.5px rgba(255,255,255,0.4), inset 0.5px 0 1px #000'
            }}
          />
          {/* Center Philips Indentation Depth */}
          <div 
            className="absolute w-[2px] h-[2px] rounded-full bg-[#050608] shadow-[0_0_1px_#000]"
          />
        </div>
      </div>
    </div>
  );
};
