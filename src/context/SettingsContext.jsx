import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [mode, setMode] = useState('BASIC');
  const [accentColor, setAccentColor] = useState('cyan');
  const [textSize, setTextSize] = useState(1); // 0: Small, 1: Normal, 2: Large

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', accentColor);
    root.setAttribute('data-text-scale', textSize);
  }, [accentColor, textSize]);

  return (
    <SettingsContext.Provider value={{ mode, setMode, accentColor, setAccentColor, textSize, setTextSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
