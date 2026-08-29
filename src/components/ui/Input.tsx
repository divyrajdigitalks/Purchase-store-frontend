import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  actionRight?: React.ReactNode;
}

export function Input({ label, helperText, actionRight, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-200">
          {label}
        </label>
        {actionRight && <div>{actionRight}</div>}
      </div>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-500 text-white ${className}`}
        {...props}
      />
      {helperText && (
        <p className="mt-1.5 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
