import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const hasBgClass = /\bbg-/.test(className);
  return (
    <div
      onClick={onClick}
      className={`${hasBgClass ? '' : 'bg-white'} border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
