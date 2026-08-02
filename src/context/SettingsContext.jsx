import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [pin, setPin] = useState(() => localStorage.getItem('sovereign_app_pin') || '1234');
  const [mode, setMode] = useState(() => localStorage.getItem('sovereign_app_mode') || 'easy');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('sovereign_font_size') || 'medium');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('sovereign_theme_color') || 'cyan');
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(() => localStorage.getItem('sovereign_autodelete_enabled') === 'true');
  const [autoDeleteDays, setAutoDeleteDays] = useState(() => Number(localStorage.getItem('sovereign_autodelete_days')) || 15);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sovereign_app_pin', pin);
    localStorage.setItem('sovereign_app_mode', mode);
    localStorage.setItem('sovereign_font_size', fontSize);
    localStorage.setItem('sovereign_theme_color', themeColor);
    localStorage.setItem('sovereign_autodelete_enabled', String(autoDeleteEnabled));
    localStorage.setItem('sovereign_autodelete_days', String(autoDeleteDays));
  }, [pin, mode, fontSize, themeColor, autoDeleteEnabled, autoDeleteDays]);

  // Theme Color Utility Classes
  const themeClasses = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500', badge: 'bg-cyan-950 text-cyan-400 border-cyan-800' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', badge: 'bg-amber-950 text-amber-400 border-amber-800' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', badge: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500', badge: 'bg-purple-950 text-purple-400 border-purple-800' }
  };

  const currentTheme = themeClasses[themeColor] || themeClasses.cyan;

  // Font Scaling Utility Classes
  const fontClasses = {
    small: 'text-[11px] leading-snug',
    medium: 'text-xs leading-normal',
    large: 'text-sm leading-relaxed'
  };

  const currentFont = fontClasses[fontSize] || fontClasses.medium;

  return (
    <SettingsContext.Provider value={{
      pin, setPin,
      mode, setMode,
      fontSize, setFontSize, currentFont,
      themeColor, setThemeColor, currentTheme,
      autoDeleteEnabled, setAutoDeleteEnabled,
      autoDeleteDays, setAutoDeleteDays,
      isSettingsOpen, setIsSettingsOpen
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
