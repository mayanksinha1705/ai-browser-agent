import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-width';

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, value]);

  return [value, setValue];
}

export function useSidebarWidth(defaultWidth = 400) {
  return useLocalStorage(STORAGE_KEY, defaultWidth);
}
