/**
 * @file Card.tsx
 * @description React component for rendering Card UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      {...props}
      className={`bg-white/80 backdrop-blur-sm shadow-glass rounded-2xl border border-white/50 p-4 sm:p-6 md:p-8 hover:shadow-premium transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;