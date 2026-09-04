'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export function ChatHeader({
  agentStatus,
  isDragging,
  onMaximize,
  isMaximized,
  onClose,
  onResetSize,
  onNewSession,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [settingsOpen]);

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-3 w-3 text-blue-400" />
        PAROKSH
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="New session"
          onClick={onNewSession}
        >
          <Plus className="h-3 w-3" />
        </Button>

        <div className="relative" ref={settingsRef}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 text-muted-foreground hover:text-foreground',
              settingsOpen && 'bg-secondary/30'
            )}
            title="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <Settings className="h-3 w-3" />
          </Button>

          {settingsOpen && (
            <div className="absolute right-0 top-8 z-[100] w-40 rounded border border-border/30 bg-background py-1 shadow-lg">
              <div className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-secondary/30 text-left"
                  onClick={() => { onResetSize?.(); setSettingsOpen(false); }}
                >
                  Reset size
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-secondary/30 text-left"
                  onClick={() => { onMaximize?.(); setSettingsOpen(false); }}
                >
                  {isMaximized ? 'Restore' : 'Maximize'}
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive text-left"
                  onClick={() => { onClose?.(); setSettingsOpen(false); }}
                >
                  Close
                </button>
                <div className="border-t border-border/20 my-1 px-3">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
