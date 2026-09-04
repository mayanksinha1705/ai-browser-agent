'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Mic, Volume2, Loader2 } from 'lucide-react';

export function AudioBars({ levels, isActive, barCount = 20, direction = 'horizontal' }) {
  const safeLevels = levels && levels.length > 0 ? levels : new Array(barCount).fill(0);
  const displayLevels = safeLevels.slice(0, barCount);

  return (
    <div
      className={cn(
        'flex items-end justify-center gap-[3px]',
        direction === 'vertical' ? 'h-16' : 'h-5'
      )}
    >
      {displayLevels.map((level, i) => {
        const normalizedLevel = isActive ? Math.max(4, level / 100 * (direction === 'vertical' ? 60 : 100) / 100) : 0.04;
        const baseHeight = direction === 'vertical' ? 4 : 4;

        return (
          <motion.div
            key={i}
            className={cn(
              'rounded-full transition-colors',
              direction === 'vertical' ? 'w-[3px]' : 'h-full w-[3px]',
              isActive ? 'bg-blue-400' : 'bg-muted-foreground/20'
            )}
            style={{
              height: direction === 'vertical' ? `${baseHeight + (isActive ? level / 100 * 56 : 0)}px` : '100%',
              opacity: direction === 'vertical' ? undefined : Math.max(0.3, level / 100),
            }}
            animate={{
              height: direction === 'vertical'
                ? `${baseHeight + (isActive ? level / 100 * 56 : 0)}px`
                : '100%',
              opacity: direction === 'vertical'
                ? undefined
                : isActive
                  ? Math.max(0.3, level / 100)
                  : 0.2,
            }}
            transition={{
              duration: 0.08,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

export default function VoiceCircleOverlay({ voiceState, audioLevels, streamingResponse, onCancel }) {
  const isActive = voiceState === 'listening' || voiceState === 'recording';
  const isSpeaking = voiceState === 'speaking' || voiceState === 'streaming';
  const isProcessing = voiceState === 'processing';

  const showOverlay = isActive || isSpeaking || isProcessing;

  if (!showOverlay) return null;

  const IconSet = {
    listening: { icon: Mic, color: 'text-red-400', label: 'Listening...' },
    recording: { icon: Mic, color: 'text-red-400', label: 'Listening...' },
    processing: { icon: Loader2, color: 'text-blue-400', label: 'Processing...' },
    speaking: { icon: Volume2, color: 'text-violet-400', label: 'Speaking...' },
    streaming: { icon: Volume2, color: 'text-violet-400', label: 'Speaking...' },
  };

  const config = IconSet[voiceState] || { icon: Mic, color: 'text-muted-foreground', label: 'Voice Agent' };

  return (
    <motion.div
      className="absolute inset-0 z-[10] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex flex-col items-center justify-center gap-5 p-4">
        {/* Cancel button */}
        <motion.button
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full border border-border/40 bg-background hover:bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground z-[20]"
          onClick={onCancel}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          title="Cancel voice agent"
        >
          <X className="h-3 w-3" />
        </motion.button>

        {/* Central circle with animated waveform */}
        <motion.div
          className="relative flex h-22 w-22 items-center justify-center rounded-full"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Concentric pulse rings */}
          {(isActive || isSpeaking) && (
            <>
              <motion.div
                className={cn(
                  'absolute rounded-full border',
                  isActive ? 'border-red-400/30' : 'border-violet-400/30'
                )}
                initial={{ width: 40, height: 40, opacity: 0.5 }}
                animate={{
                  width: [40, 88, 40],
                  height: [40, 88, 40],
                  opacity: [0.5, 0.1, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className={cn(
                  'absolute rounded-full border',
                  isActive ? 'border-red-400/20' : 'border-violet-400/20'
                )}
                initial={{ width: 60, height: 60, opacity: 0.3 }}
                animate={{
                  width: [60, 80, 60],
                  height: [60, 80, 60],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
              />
            </>
          )}

          {/* Inner core circle with icon */}
          <motion.div
            className={cn(
              'relative z-10 h-12 w-12 rounded-full flex items-center justify-center',
              isActive
                ? 'bg-red-400/20'
                : isSpeaking
                  ? 'bg-violet-400/20'
                  : 'bg-blue-400/20'
            )}
            animate={
              isActive
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 0 0px rgba(239, 68, 68, 0.3)',
                      '0 0 0 4px rgba(239, 68, 68, 0)',
                      '0 0 0 0px rgba(239, 68, 68, 0.3)',
                    ],
                  }
                : isSpeaking
                  ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0px rgba(136, 83, 239, 0.3)',
                        '0 0 0 6px rgba(136, 83, 239, 0)',
                        '0 0 0 0px rgba(136, 83, 239, 0.3)',
                      ],
                    }
                  : {}
            }
            transition={{
              duration: isActive ? 1.5 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className={config.color}
              animate={isProcessing ? { rotate: 360 } : {}}
              transition={isProcessing ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              <config.icon className="h-5 w-5" />
            </motion.div>
          </motion.div>

          {/* Audio bars arranged in a semicircle below the circle */}
          {(isActive || isSpeaking) && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <AudioBars
                levels={audioLevels}
                isActive={isActive || isSpeaking}
                barCount={16}
                direction="vertical"
              />
            </div>
          )}
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {config.label}
        </motion.p>

        {streamingResponse && (
          <motion.div
            className="max-w-[240px] text-center text-xs text-muted-foreground/70"
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
