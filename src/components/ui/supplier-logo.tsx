import React from 'react';
import { cn } from '@/lib/utils';
import { getLocalLogoForSupplier } from '@/lib/supplierLogos';

interface SupplierLogoProps {
  name: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

// Generate a consistent color based on company name
const generateColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good contrast
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Extract initials from company name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

// Logos that are white and need black background
const whiteLogos = [
  'parts on demand',
  'partzpro', 
  'sybridge',
  'cosine',
  'delva',
  'forecast',
  'forecast3d',
  'craftcloud',
  '3erp',
  'fathom',
  'imaterialise',
  'i.materialise',
  'oceanz',
  'treatstock',
  'norra am',
  'norra additive',
  'norraadditive',
  'norraam'
];

const shouldUseBlackBackground = (name: string): boolean => {
  const nameLower = name.toLowerCase();
  return whiteLogos.some(logo => nameLower.includes(logo));
};

const SupplierLogo: React.FC<SupplierLogoProps> = ({ 
  name, 
  logoUrl, 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-24 h-24 text-xl'
  };

  const initials = getInitials(name);
  const useBlackBg = shouldUseBlackBackground(name);
  const backgroundColor = useBlackBg ? '#000000' : '#f5f5f5';
  const textColor = useBlackBg ? '#ffffff' : '#000000';

  // Priority: Local logo > Database URL > Initials
  const localLogo = getLocalLogoForSupplier(name);
  
  // Extract actual logo URL value - handle string, null, undefined, and malformed objects
  let actualLogoUrl: string | undefined;
  if (logoUrl) {
    if (typeof logoUrl === 'string' && logoUrl.trim() !== '' && logoUrl !== 'undefined') {
      actualLogoUrl = logoUrl;
    } else if (typeof logoUrl === 'object' && logoUrl !== null) {
      const urlValue = (logoUrl as any).value;
      if (typeof urlValue === 'string' && urlValue !== 'undefined' && urlValue.trim() !== '') {
        actualLogoUrl = urlValue;
      }
    }
  }
  
  // Use local logo if available, otherwise use database URL
  const finalLogoUrl = localLogo || actualLogoUrl;

  // Use logo if available (local or database)
  if (finalLogoUrl) {
    return (
      <div className={cn(
        'rounded-lg overflow-hidden flex items-center justify-center p-1',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
      >
        <img
          src={finalLogoUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Fallback to generated logo if image fails to load - SECURE: No innerHTML
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              // Safe: Create DOM element programmatically to prevent XSS
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full rounded-lg flex items-center justify-center font-semibold';
              fallback.style.backgroundColor = backgroundColor;
              fallback.style.color = textColor;
              fallback.textContent = initials; // textContent auto-escapes, preventing XSS
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  }


  // Generated logo with initials
  return (
    <div 
      className={cn(
        'rounded-lg flex items-center justify-center font-semibold shadow-sm',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor, color: textColor }}
    >
      {initials}
    </div>
  );
};

export default SupplierLogo;