'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ChatHeader } from '@/components/sidebar/ChatHeader';
import { ResizeHandles } from '@/components/sidebar/ResizeHandle';
import { EmptyState } from '@/components/sidebar/EmptyState';
import { ChatInterface } from '@/components/sidebar/ChatInterface';
import { AgentExecutionPanel } from '@/components/sidebar/AgentExecutionPanel';
import { InputComposer } from '@/components/sidebar/InputComposer';
import { ThemeToggle } from '@/components/sidebar/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import VoiceCircleOverlay from '@/components/sidebar/VoiceVisualizer';
import { useDraggable } from '@/hooks/useDraggable';
import { useResizable } from '@/hooks/useResizable';
import { WINDOW_SIZE, AGENT_STATUS } from '@/lib/constants';

export function FloatingChatWindow({
  messages,
  onSendMessage,
  onSendImage,
  onSendFile,
  onNewSession,
  currentStep,
  isTaskRunning,
  onStop,
  voiceAgent,
  isEmbedded = false,
}) {
  const headerRef = useRef(null);

  const {
    position,
    setPosition,
    isDragging,
    startDrag,
  } = useDraggable();

  const {
    size,
    setSize,
    isResizing,
    startResize,
    positionAdjust,
  } = useResizable();

  const [isMaximized, setIsMaximized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [preMaximize, setPreMaximize] = useState(null);

  // Send resize updates to parent (content script) in embedded mode
  const notifyParentResize = useCallback((width, height) => {
    if (isEmbedded && typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'updateSize', width, height }, '*');
    }
  }, [isEmbedded]);

  const handleDragStart = (e) => {
    if (isResizing) return;
    startDrag(e, headerRef);
  };

  const handleResizeStart = (e, direction) => {
    if (isDragging) return;
    startResize(e, direction);
  };

  // Notify parent when size changes in embedded mode
  useEffect(() => {
    if (isEmbedded) {
      notifyParentResize(size.width, size.height);
    }
  }, [size.width, size.height, isEmbedded, notifyParentResize]);

  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      if (preMaximize) {
        setPosition({ ...preMaximize.position });
        setSize({ ...preMaximize.size });
      }
    } else {
      setPreMaximize({ position: { ...position }, size: { ...size } });
      setIsMaximized(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (isEmbedded && typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'paroksh/hide' }, '*');
    }
  };

  const handleResetSize = () => {
    setSize({ width: WINDOW_SIZE.DEFAULT.W, height: WINDOW_SIZE.DEFAULT.H });
  };

  const showEmptyState = messages.length === 0;

  // Sync the extension chrome (content-script header/frame background) with
  // the app theme so the whole floating window matches light/dark.
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!isEmbedded || typeof window === 'undefined') return;
    window.parent.postMessage(
      { type: 'paroksh/theme', theme: resolvedTheme || 'dark' },
      '*'
    );
  }, [isEmbedded, resolvedTheme]);

  // In embedded/extension mode the chat fills the iframe exactly —
  // no floating offsets, no outer chrome, no drag/resize.
  const effectivePos = {
    x: isEmbedded ? 0 : position.x + positionAdjust.x,
    y: isEmbedded ? 0 : position.y + positionAdjust.y,
  };

  if (!isVisible) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] cursor-pointer"
        onClick={() => setIsVisible(true)}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-10 w-10 rounded-full border border-border/40 bg-background flex items-center justify-center text-xs font-medium"
        >
          AI
        </motion.div>
      </div>
    );
  }

  if (isEmbedded) {
    // In embedded mode the iframe is hosted, dragged, and resized by the
    // extension's content script. The React app fills the container and
    // communicates size changes back to the content script.
    return (
      <div className="relative z-[1] w-full h-full flex flex-col overflow-hidden bg-background">
        {/* Embedded toolbar: New session + theme toggle (window chrome
            lives in the content script, so this row replaces ChatHeader) */}
        <div className="flex items-center justify-end gap-0.5 px-2 py-1 border-b border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Start a new session (clears the conversation)"
            onClick={onNewSession}
          >
            <Plus className="h-3 w-3" />
            New session
          </Button>
          <ThemeToggle size="compact" />
        </div>

        <VoiceCircleOverlay
          voiceState={voiceAgent?.state}
          audioLevels={voiceAgent?.audioLevels}
          streamingResponse={voiceAgent?.streamingResponse}
          onCancel={() => voiceAgent?.toggleListening()}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showEmptyState ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex items-center justify-center"
              >
                <EmptyState userName="UDAY" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ChatInterface messages={messages} voiceAgent={voiceAgent} />

                {isTaskRunning && currentStep && (
                  <AgentExecutionPanel currentStep={currentStep} onStop={onStop} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <InputComposer
            onSend={onSendMessage}
            onSendImage={onSendImage}
            onSendFile={onSendFile}
            disabled={isTaskRunning}
            voiceAgent={voiceAgent}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed z-[9999]"
      style={{
        left: isEmbedded ? 0 : effectivePos.x,
        top: isEmbedded ? 0 : (isMaximized ? 8 : effectivePos.y),
        width: isEmbedded ? '100%' : `${size.width}px`,
        height: isEmbedded ? '100%' : (isMaximized ? 'calc(100vh - 16px)' : `${size.height}px`),
        maxHeight: isEmbedded ? 'none' : (isMaximized ? 'calc(100vh - 16px)' : 'none'),
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div
        className={'relative h-full flex flex-col overflow-hidden ' + (isEmbedded ? 'bg-background' : 'rounded-xl border border-border/30 bg-background')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          ref={headerRef}
          className={'border-b border-border/30 ' + (isEmbedded ? '' : 'cursor-grab active:cursor-grabbing')}
          onMouseDown={isEmbedded ? undefined : handleDragStart}
        >
          <ChatHeader
            agentStatus={AGENT_STATUS.READY}
            isDragging={isDragging}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
            onClose={handleClose}
            onResetSize={handleResetSize}
            onNewSession={onNewSession}
          />
        </div>

        {!isEmbedded && (
          <ResizeHandles
            onResizeStart={handleResizeStart}
            isResizing={isResizing}
          />
        )}

        <VoiceCircleOverlay
          voiceState={voiceAgent?.state}
          audioLevels={voiceAgent?.audioLevels}
          streamingResponse={voiceAgent?.streamingResponse}
          onCancel={() => voiceAgent?.toggleListening()}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showEmptyState ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex items-center justify-center"
              >
                <EmptyState userName="UDAY" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ChatInterface messages={messages} voiceAgent={voiceAgent} />

                {isTaskRunning && currentStep && (
                  <AgentExecutionPanel currentStep={currentStep} onStop={onStop} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <InputComposer
            onSend={onSendMessage}
            onSendImage={onSendImage}
            onSendFile={onSendFile}
            disabled={isTaskRunning}
            voiceAgent={voiceAgent}
          />
        </div>
      </div>
    </motion.div>
  );
}
