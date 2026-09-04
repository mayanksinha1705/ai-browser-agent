'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      className="fixed right-0 top-1/2 -translate-y-1/2 h-24 w-12 rounded-l-lg rounded-r-none bg-gradient-to-b from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 shadow-lg flex flex-col items-center justify-center gap-1 z-50"
    >
      <Sparkles className="h-5 w-5 text-white" />
      <span className="text-xs font-semibold text-white writing-mode-vertical">
        AI
      </span>
    </Button>
  );
}
