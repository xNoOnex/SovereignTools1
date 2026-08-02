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

  // Apply CSS Variables on Root whenever settings change
  useEffect(() => {
    localStorage.setItem('sovereign_app_pin', pin);
    localStorage.setItem('sovereign_app_mode', mode);
    localStorage.setItem('sovereign_font_size', fontSize);
    localStorage.setItem('sovereign_theme_color', themeColor);
    localStorage.setItem('sovereign_autodelete_enabled', String(autoDeleteEnabled));
    localStorage.setItem('sovereign_autodelete_days', String(autoDeleteDays));

    const root = document.documentElement;

    // Font Scaling
    if (fontSize === 'small') root.style.fontSize = '13px';
    else if (fontSize === 'large') root.style.fontSize = '17px';
    else root.style.fontSize = '15px';

    // Theme Color Palettes
    if (themeColor === 'amber') {
      root.style.setProperty('--accent-color', '#f59e0b');
      root.style.setProperty('--accent-text', '#fbbf24');
      root.style.setProperty('--accent-bg-subtle', 'rgba(245, 158, 11, 0.15)');
      root.style.setProperty('--accent-border', 'rgba(245, 158, 11, 0.4)');
    } else if (themeColor === 'emerald') {
      root.style.setProperty('--accent-color', '#10b981');
      root.style.setProperty('--accent-text', '#34d399');
      root.style.setProperty('--accent-bg-subtle', 'rgba(16, 185, 129, 0.15)');
      root.style.setProperty('--accent-border', 'rgba(16, 185, 129, 0.4)');
    } else if (themeColor === 'purple') {
      root.style.setProperty('--accent-color', '#a855f7');
      root.style.setProperty('--accent-text', '#c084fc');
      root.style.setProperty('--accent-bg-subtle', 'rgba(168, 85, 247, 0.15)');
      root.style.setProperty('--accent-border', 'rgba(168, 85, 247, 0.4)');
    } else {
      root.style.setProperty('--accent-color', '#06b6d4');
      root.style.setProperty('--accent-text', '#22d3ee');
      root.style.setProperty('--accent-bg-subtle', 'rgba(6, 182, 212, 0.15)');
      root.style.setProperty('--accent-border', 'rgba(6, 182, 212, 0.4)');
    }
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
