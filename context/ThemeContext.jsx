import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const LIGHT = {
  mode: 'light',
  bg:        '#F8FAFC',
  surface:   '#FFFFFF',
  surface2:  '#F1F5F9',
  border:    '#E2E8F0',
  text:      '#0F172A',
  subtext:   '#64748B',
  accent:    '#2563EB',
  accentB:   '#1D4ED8',
  green:     '#10B981',
  amber:     '#F59E0B',
  pink:      '#EC4899',
  cardGrad:  ['#2563EB', '#1D4ED8'],
  glassBg:   'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  statusBar: 'dark-content',
};

export const DARK = {
  mode: 'dark',
  bg:        '#020617',
  surface:   '#0F172A',
  surface2:  '#1E293B',
  border:    '#334155',
  text:      '#F8FAFC',
  subtext:   '#94A3B8',
  accent:    '#3B82F6',
  accentB:   '#60A5FA',
  green:     '#10B981',
  amber:     '#F59E0B',
  pink:      '#EC4899',
  cardGrad:  ['#1E3A8A', '#0F172A'],
  glassBg:   'rgba(15, 23, 42, 0.75)',
  glassBorder: 'rgba(51, 65, 85, 0.5)',
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
