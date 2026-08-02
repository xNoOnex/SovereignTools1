import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('sovereign_mode') || 'EXPERT');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('sovereign_accent') || 'cyan');
  const [textSize, setTextSize] = useState(() => localStorage.getItem('sovereign_text') || 'Medium');

  return (
    <SettingsContext.Provider value={{ mode, setMode, accentColor, setAccentColor, textSize, setTextSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return { mode: 'EXPERT', setMode: () => {}, accentColor: 'cyan', setAccentColor: () => {}, textSize: 'Medium', setTextSize: () => {} };
  }
  return context;
};
