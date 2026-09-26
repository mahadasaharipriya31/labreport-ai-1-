import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'subtle';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
          variant === 'subtle'
            ? 'px-2.5 py-1.5 bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700'
            : variant === 'full'
            ? 'px-3 py-2 bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-2xs'
            : 'px-2.5 py-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
        }`}
        title="Change Language"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-sm leading-none">{currentLanguageOption.flag}</span>
        <span className="hidden sm:inline font-bold">
          {variant === 'compact' ? currentLanguageOption.code.toUpperCase() : currentLanguageOption.nativeName}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Language / اختر اللغة
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-blue-50/70 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 font-bold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{lang.label}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
