import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [pin, setPin] = useState(() => localStorage.getItem('sovereign_app_pin') || '1234');
  const [mode, setMode] = useState(() => localStorage.getItem('sovereign_app_mode') || 'easy'); // Default set to 'easy'
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

  return (
    <SettingsContext.Provider value={{
      pin, setPin,
      mode, setMode,
      fontSize, setFontSize,
      themeColor, setThemeColor,
      autoDeleteEnabled, setAutoDeleteEnabled,
      autoDeleteDays, setAutoDeleteDays,
      isSettingsOpen, setIsSettingsOpen
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
