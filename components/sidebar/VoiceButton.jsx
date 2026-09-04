'use client';

import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function VoiceButton({
  voiceState,
  isListening,
  isRecording,
  isSpeaking,
  isProcessing,
  isActive,
  isSupported,
  onToggle,
  size = 'sm',
}) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    default: 'h-10 w-10',
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(sizeClasses[size], 'text-muted-foreground')}
        title="Voice not supported"
        disabled
      >
        <MicOff className={iconSize} />
      </Button>
    );
  }

  if (isSpeaking) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size],
          'text-violet-400'
        )}
        title="Stop audio"
        onClick={onToggle}
      >
        <span className="text-xs">⏹</span>
      </Button>
    );
  }

  if (isProcessing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(sizeClasses[size], 'text-muted-foreground')}
        title="Processing..."
        disabled
      >
        <div className={cn(
          'rounded-full border-2 border-blue-400 border-t-transparent animate-spin',
          iconSize
        )} />
      </Button>
    );
  }

  if (isActive) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size],
          'text-red-400 bg-red-400/10'
        )}
        title="Stop listening"
        onClick={onToggle}
      >
        <Mic className={iconSize} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        'text-muted-foreground hover:text-foreground'
      )}
      title="Voice chat"
      onClick={onToggle}
    >
      <Mic className={iconSize} />
    </Button>
  );
}
