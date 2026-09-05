import React from 'react';

/**
 * High-Definition Pure Black Automotive Leather Background
 * Features:
 * - Deep, uniform pure black / charcoal automotive leather tone (no vignette or darkening at edges)
 * - Seamless micro-pebble leather texture and procedural SVG bump mapping
 * - Completely clean surface without stitches, seams, or vignette effects
 */
export const LeatherBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0a0c]">
      {/* 1. Base Uniform Deep Black / Charcoal Matte Surface */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: '#0c0d10'
        }}
      />

      {/* 2. Seamless Micro-Pebble Leather Grain Pattern (Evenly Distributed) */}
      <div 
        className="absolute inset-0 w-full h-full opacity-70 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.6'%3E%3Cpath d='M0 0h2v2H0V0zm6 3h2v2H6V3zm8-2h2v2h-2V1zm10 2h2v2h-2V3zM3 8h2v2H3V8zm12 2h2v2h-2v-2zm12-1h2v2h-2V9zM7 14h2v2H7v-2zm14 1h2v2h-2v-2zM1 18h2v2H1v-2zm10 2h2v2h-2v-2zm16-1h2v2h-2v-2zM5 24h2v2H5v-2zm13 1h2v2h-2v-2zm9-3h2v2h-2v-2zM9 29h2v2H9v-2zm14 1h2v2h-2v-2z'/%3E%3C/g%3E%3Cg fill='%23ffffff' fill-opacity='0.12'%3E%3Cpath d='M1 1h1v1H1V1zm6 3h1v1H7V4zm8-2h1v1h-1V2zm10 2h1v1h-1V4zM4 9h1v1H4V9zm12 2h1v1h-1v-1zm12-1h1v1h-1v-1zM8 15h1v1H8v-1zm14 1h1v1h-1v-1zM2 19h1v1H2v-1zm10 2h1v1h-1v-1zm16-1h1v1h-1v-1zM6 25h1v1H6v-1zm13 1h1v1h-1v-1zm9-3h1v1h-1v-1zM10 30h1v1h-1v-1zm14 1h1v1h-1v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '16px 16px'
        }}
      />

      {/* 3. Procedural SVG Bump-Mapped Full-Grain Leather Filter */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-35 mix-blend-soft-light pointer-events-none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id="black-leather-bump" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.75" 
            numOctaves="4" 
            stitchTiles="stitch" 
            result="noise" 
          />
          <feDiffuseLighting 
            in="noise" 
            lightingColor="#ffffff" 
            surfaceScale="1.8" 
            result="light"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComponentTransfer in="light" result="contrastedLight">
            <feFuncR type="linear" slope="1.0" intercept="0" />
            <feFuncG type="linear" slope="1.0" intercept="0" />
            <feFuncB type="linear" slope="1.0" intercept="0" />
          </feComponentTransfer>
          <feBlend mode="multiply" in="SourceGraphic" in2="contrastedLight" />
        </filter>
        <rect width="100%" height="100%" fill="#4a4d52" filter="url(#black-leather-bump)" />
      </svg>

      {/* 4. Fine Organic Secondary Leather Pores */}
      <div 
        className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.7'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px'
        }}
      />
    </div>
  );
};
