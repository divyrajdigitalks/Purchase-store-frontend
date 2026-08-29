import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'checkbox-' + Math.random().toString(36).substr(2, 9));

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        className="h-4 w-4 rounded border-white/20 bg-black/30 text-purple-600 focus:ring-purple-500/50 focus:ring-offset-gray-900 transition-all cursor-pointer accent-purple-500"
        {...props}
      />
      <label htmlFor={checkboxId} className="ml-2 block text-sm text-gray-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}
