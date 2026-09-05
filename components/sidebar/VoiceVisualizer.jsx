'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export default function VoiceCircleOverlay({ voiceState, audioLevels, streamingResponse, onCancel }) {
  const isActive = voiceState === 'listening' || voiceState === 'recording';
  const isSpeaking = voiceState === 'speaking' || voiceState === 'streaming';
  const isProcessing = voiceState === 'processing';

  const showOverlay = isActive || isSpeaking || isProcessing;
  if (!showOverlay) return null;

  let label = 'Voice Agent';

  if (isActive) {
    label = 'Listening...';
  } else if (isSpeaking) {
    label = 'Speaking...';
  } else if (isProcessing) {
    label = 'Processing...';
  }

  return (
    <motion.div
      className="absolute inset-0 z-[10] flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex flex-col items-center justify-center gap-5 p-4">
        {/* Cancel button */}
        <motion.button
          className="absolute top-2 right-2 h-6 w-6 rounded-full border border-white/20 bg-black/60 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white z-[20]"
          onClick={onCancel}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          title="Cancel voice agent"
        >
          <X className="h-3 w-3" />
        </motion.button>

        {/* CSS Orb - smaller for extension */}
        <div className="orb" style={{
          width: 120,
          height: 120,
        }}>
          <div className="aura" />
          <div className="core" />
          <div className="ring" style={{ width: 160, height: 160 }} />
          <div className="particles">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {/* No center icon - mic button in input bar is enough */}
        </div>

        <motion.p
          className="text-sm text-white/80"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {label}
        </motion.p>

        {streamingResponse && (
          <motion.div
            className="max-w-[260px] text-center text-xs text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {streamingResponse}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
