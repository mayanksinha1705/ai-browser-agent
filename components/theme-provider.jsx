'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider {...props} enableSystem>
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider, useNextTheme as useTheme };