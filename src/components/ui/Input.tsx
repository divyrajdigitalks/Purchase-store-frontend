import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  actionRight?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Input({ label, helperText, actionRight, icon, id, className = '', ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
          {actionRight && <div>{actionRight}</div>}
        </div>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full ${icon ? 'pl-9' : 'px-3'} py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium text-sm shadow-xs ${className}`}
          {...props}
        />
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  );
}
