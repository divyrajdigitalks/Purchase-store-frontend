import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  actionRight?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Input({ label, helperText, actionRight, icon, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        {actionRight && <div>{actionRight}</div>}
      </div>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#045598] focus:bg-white focus:ring-4 focus:ring-[#045598]/10 outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm ${className}`}
          {...props}
        />
      </div>
      {helperText && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
