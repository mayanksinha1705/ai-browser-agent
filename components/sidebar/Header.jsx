'use client';

import { MoreVertical, PanelRightOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

/**
 * Minimal, clean header matching the reference design:
 *  - No big logo, no title text
 *  - Only small icon buttons in the top-right:
 *      - ThemeToggle    (cycle light / dark / system)
 *      - MoreVertical   (overflow / options)
 *      - PanelRightOpen (pop-out / dock right)
 *      - X              (close / hide sidebar)
 */
export function Header({ onMinimize }) {
  return (
    <div className="sticky top-0 z-40 bg-background">
      <div className="flex items-center justify-end gap-1 px-3 py-2.5">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Pop out"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onMinimize}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}