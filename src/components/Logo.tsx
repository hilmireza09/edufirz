import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  variant?: 'default' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ className = "", width = 150, height = 30, variant = 'default' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 150 60" 
      width={width} 
      height={height} 
      className={className}
      preserveAspectRatio="xMinYMid meet"
    >
      <text x="20" y="40" fontFamily="'Segoe UI', 'Roboto', Arial, sans-serif" fontSize="40" fontWeight="bold">
        <tspan fill={variant === 'light' ? '#ffffff' : '#0056b3'}>Edu</tspan>
        <tspan fill={variant === 'light' ? '#ffffff' : '#333333'}>Firz</tspan>
      </text>
    </svg>
  );
};
