"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
  helperText?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  helperText
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  return (
    <div className={`w-full relative flex flex-col`} ref={containerRef}>
      {label && (
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 select-none">
          {label}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold hover:bg-slate-100/50 hover:border-slate-350 focus:outline-none focus:ring-4 focus:ring-[#045598]/10 focus:border-[#045598] transition-all text-left cursor-pointer ${className}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] z-55 max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left cursor-pointer hover:bg-slate-50 transition-colors ${
                    isSelected ? 'text-[#045598] bg-slate-50 font-bold' : 'text-slate-750 font-semibold'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#045598] flex-shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}

      {helperText && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
