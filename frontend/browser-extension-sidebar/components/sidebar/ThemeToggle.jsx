'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

/**
 * Theme toggle button for switching between light, dark, and system themes.
 * Renders an icon-only button suitable for use in the sidebar header.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a neutral icon until mounted.
  const current = mounted ? theme ?? 'system' : 'system';
  const effective = mounted ? resolvedTheme ?? theme : 'system';

  const cycle = () => {
    if (current === 'light') setTheme('dark');
    else if (current === 'dark') setTheme('system');
    else setTheme('light');
  };

  const label =
    current === 'system'
      ? `System theme (${effective === 'dark' ? 'dark' : 'light'})`
      : current === 'dark'
      ? 'Dark theme'
      : 'Light theme';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={cycle}
      title={label}
      aria-label={`Switch theme (current: ${label})`}
    >
      {mounted && effective === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}