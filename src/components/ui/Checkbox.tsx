import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'checkbox-' + Math.random().toString(36).substring(2, 9));

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        className="h-4 w-4 rounded border-slate-300 bg-white text-[#045598] focus:ring-2 focus:ring-[#045598]/20 transition-all cursor-pointer accent-[#045598]"
        {...props}
      />
      <label htmlFor={checkboxId} className="ml-2 block text-xs font-bold text-slate-800 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}
