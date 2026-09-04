'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Mic, Volume2, Loader2 } from 'lucide-react';

function OrbWaveform({ levels, isActive, barCount = 40 }) {
  const safeLevels = levels && levels.length > 0 ? levels : new Array(barCount).fill(0);
  const displayLevels = safeLevels.slice(0, barCount);

  return (
    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-end justify-center gap-[1px] h-10">
      {displayLevels.map((level, i) => {
        const height = isActive ? Math.max(2, level / 100 * 36) : 2;
        const centerIdx = barCount / 2;
        const distanceFromCenter = Math.abs(i - centerIdx);
        const opacity = Math.max(0.3, 1 - distanceFromCenter / centerIdx);

        return (
          <motion.div
            key={i}
            className={cn(
              'w-[2px] rounded-full transition-all',
              isActive ? 'bg-blue-400' : 'bg-muted-foreground/20'
            )}
            style={{
              height: `${height}px`,
              opacity: isActive ? opacity : 0.2,
            }}
            animate={{
              height: `${height}px`,
              opacity: isActive ? opacity : 0.2,
            }}
            transition={{ duration: 0.06, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

function OrbRings({ isActive, color = 'red' }) {
  const ringColors = {
    red: 'border-red-400/25',
    violet: 'border-violet-400/25',
    blue: 'border-blue-400/25',
  };

  return (
    <motion.div
      className="absolute inset-[-4px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn('absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full', ringColors[color])}
        initial={{ width: 48, height: 48, opacity: 0.6, x: '50%', y: '50%', translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: [48, 88, 48],
          height: [48, 88, 48],
          opacity: [0.6, 0.1, 0.6],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={cn('absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full', ringColors[color])}
        initial={{ width: 64, height: 64, opacity: 0.3 }}
        animate={{
          width: [64, 76, 64],
          height: [64, 76, 64],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.4,
        }}
      />
    </motion.div>
  );
}

function OrbParticles({ isActive, color = 'red' }) {
  if (!isActive) return null;

  return (
    <div className="absolute -inset-4 pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60) * Math.PI / 180;
        const radius = 44;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const delay = i * 0.3;
        const colorClass = color === 'red' ? 'bg-red-400' : color === 'violet' ? 'bg-violet-400' : 'bg-blue-400';

        return (
          <motion.div
            key={i}
            className={cn('absolute h-1 w-1 rounded-full', colorClass)}
            style={{ left: `calc(50% + ${x}px - 2px)`, top: `calc(50% + ${y}px - 2px)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              x: [0, Math.cos(angle + Math.PI) * 8, 0],
              y: [0, Math.sin(angle + Math.PI) * 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
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

  const ringColor = isActive ? 'red' : isSpeaking ? 'violet' : 'blue';

  let label = 'Voice Agent';
  let Icon = Mic;
  let iconColor = 'text-muted-foreground';
  let pulseColor = 'red';

  if (isActive) {
    label = 'Listening...';
    Icon = Mic;
    iconColor = 'text-red-400';
    pulseColor = 'red';
  } else if (isSpeaking) {
    label = 'Speaking...';
    Icon = Volume2;
    iconColor = 'text-violet-400';
    pulseColor = 'violet';
  } else if (isProcessing) {
    label = 'Processing...';
    Icon = Loader2;
    iconColor = 'text-blue-400';
    pulseColor = 'blue';
  }

  return (
    <motion.div
      className="absolute inset-0 z-[10] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex flex-col items-center justify-center gap-6 p-4">
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

        {/* Orb container */}
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Concentric rings */}
          <OrbRings isActive={isActive || isSpeaking || isProcessing} color={ringColor} />

          {/* Particles */}
          <OrbParticles isActive={isActive || isSpeaking || isProcessing} color={pulseColor} />

          {/* Waveform */}
          <OrbWaveform
            levels={audioLevels}
            isActive={isActive || isSpeaking}
          />

          {/* Central orb */}
          <motion.div
            className={cn(
              'relative z-10 h-14 w-14 rounded-full flex items-center justify-center',
              isActive
                ? 'bg-red-400/10'
                : isSpeaking
                  ? 'bg-violet-400/10'
                  : 'bg-blue-400/10'
            )}
            animate={
              isActive || isSpeaking
                ? {
                    boxShadow: [
                      '0 0 0 0px rgba(239, 68, 68, 0.4)',
                      '0 0 0 6px rgba(239, 68, 68, 0)',
                      '0 0 0 0px rgba(239, 68, 68, 0.4)',
                    ],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              animate={isProcessing ? { rotate: 360 } : {}}
              transition={isProcessing ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              <Icon className={cn('h-6 w-6', iconColor)} />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {label}
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
