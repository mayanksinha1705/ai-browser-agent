'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function VoiceResponse({ text, isVisible }) {
  if (!isVisible || !text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-4 my-2"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 grid place-items-center">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        </div>
        <div className="bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 max-w-[80%]">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-medium text-blue-400">Speaking</span>
            <span className="text-xs text-muted-foreground">
              {text}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {text && (
          <motion.div
            className="mt-1 ml-8 text-xs text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="inline-block h-3 w-3 border border-muted-foreground/30 rounded-full animate-spin mr-1" />
            Streaming...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
