'use client';

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AgentExecutionPanel({ currentStep, onStop }) {
  if (!currentStep) return null;

  return (
    <div className="mx-4 my-3 px-3 py-2 border border-border/30 rounded-lg text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
        <span>{currentStep.label || currentStep}</span>
      </div>
    </div>
  );
}
