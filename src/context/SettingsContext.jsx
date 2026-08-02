import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('sovereign_mode') || 'EXPERT');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('sovereign_accent') || 'cyan');

  return (
    <SettingsContext.Provider value={{ mode, setMode, accentColor, setAccentColor }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    // Failsafe: if a component calls this outside the provider, don't crash.
    return { mode: 'EXPERT', setMode: () => {}, accentColor: 'cyan', setAccentColor: () => {} };
  }
  return context;
};
