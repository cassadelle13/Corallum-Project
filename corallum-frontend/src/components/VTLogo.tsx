import React from 'react';

interface VTLogoProps {
  size?: number;
  className?: string;
}

export const VTLogo: React.FC<VTLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle background - white circle on black background */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="white"
        stroke="none"
      />
      
      {/* Letter V - left diagonal stroke (thick, wide) */}
      <path
        d="M 20 25 L 30 75 L 50 75"
        fill="none"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Letter V - right diagonal stroke */}
      <path
        d="M 80 25 L 70 75 L 50 75"
        fill="none"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Letter T - vertical stroke (passes behind left V, in front of right V) */}
      {/* Left part - behind V */}
      <path
        d="M 50 20 L 50 40"
        fill="none"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Right part - in front of V */}
      <path
        d="M 50 40 L 50 75"
        fill="none"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Letter T - horizontal stroke with subtle curve and serifs */}
      {/* Main horizontal bar with curve */}
      <path
        d="M 25 30 Q 50 25 75 30"
        fill="none"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Left serif - pointed inward */}
      <path
        d="M 25 30 L 23 27 L 25 25 L 27 27 Z"
        fill="black"
      />
      
      {/* Right serif - pointed inward */}
      <path
        d="M 75 30 L 77 27 L 75 25 L 73 27 Z"
        fill="black"
      />
    </svg>
  );
};
