import React from 'react';

interface CarPlayIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Authentic Apple CarPlay in-dash display glyph.
 * Uses currentColor to inherit backlighting and theme colors seamlessly.
 */
export const CarPlayIcon: React.FC<CarPlayIconProps> = ({ 
  className = "w-3 h-3", 
  style 
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Automotive in-dash display rounded bezel */}
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      {/* CarPlay signature left-side circular home button */}
      <circle cx="6.8" cy="12" r="2" strokeWidth="1.6" />
      {/* Infotainment dashboard cards & app layout */}
      <line x1="11.8" y1="8.8" x2="18.5" y2="8.8" strokeWidth="1.6" />
      <line x1="11.8" y1="12" x2="16.2" y2="12" strokeWidth="1.6" />
      <line x1="11.8" y1="15.2" x2="18.5" y2="15.2" strokeWidth="1.6" />
    </svg>
  );
};
