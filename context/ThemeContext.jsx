import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const LIGHT = {
  mode: 'light',
  bg:        '#F8FAFC',
  surface:   '#FFFFFF',
  surface2:  '#F1F5F9',
  border:    '#E2E8F0',
  text:      '#1E293B',
  subtext:   '#94A3B8',
  accent:    '#6366F1',
  accentB:   '#2563EB',
  green:     '#10B981',
  amber:     '#F59E0B',
  pink:      '#EC4899',
  cardGrad:  ['#6366F1', '#8B5CF6'],
  statusBar: 'dark-content',
};

export const DARK = {
  mode: 'dark',
  bg:        '#0D0D0D',
  surface:   '#1A1A1A',
  surface2:  '#242424',
  border:    '#2A2A2A',
  text:      '#F1F5F9',
  subtext:   '#64748B',
  accent:    '#7C3AED',
  accentB:   '#2563EB',
  green:     '#10B981',
  amber:     '#F59E0B',
  pink:      '#EC4899',
  cardGrad:  ['#4C1D95', '#1E1B4B'],
  statusBar: 'light-content',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
