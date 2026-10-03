import React from 'react';
import { OFFICIAL_LOGO_PATH } from '../../lib/branding';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  inverted = false,
}) => {
  // Pure 1:1 aspect ratio preserving official badge
  const sizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official circular logo - preserves 1:1 aspect ratio, exact colors & quality */}
      <img
        src={OFFICIAL_LOGO_PATH}
        alt="Fahad's Tutorial Official Logo"
        className={`${sizes[size]} shrink-0 object-contain rounded-full shadow-2xs`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes('images.jpg')) {
            target.src = '/assets/images.jpg';
          }
        }}
      />
      {showSubtitle && (
        <div className="flex flex-col border-l border-slate-300 dark:border-slate-700 pl-3">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-xs uppercase ${inverted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              FAHAD'S TUTORIAL
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${inverted ? 'text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              SSP Management System
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
