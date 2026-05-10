'use client';

import { createContext, useContext } from 'react';

const SettingsModeContext = createContext(false);

export function useSettingsMode() {
  return useContext(SettingsModeContext);
}

export function SettingsModeProvider({ children }) {
  return <SettingsModeContext.Provider value={true}>{children}</SettingsModeContext.Provider>;
}
