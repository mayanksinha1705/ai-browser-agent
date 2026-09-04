'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from '@/components/sidebar/ChatHeader';
import { ResizeHandles } from '@/components/sidebar/ResizeHandle';
import { EmptyState } from '@/components/sidebar/EmptyState';
import { ChatInterface } from '@/components/sidebar/ChatInterface';
import { AgentExecutionPanel } from '@/components/sidebar/AgentExecutionPanel';
import { InputComposer } from '@/components/sidebar/InputComposer';
import VoiceCircleOverlay from '@/components/sidebar/VoiceVisualizer';import { useDraggable } from '@/hooks/useDraggable';
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

  const handleDragStart = (e) => {
    if (isResizing) return;
    startDrag(e, headerRef);
  };

  const handleResizeStart = (e, direction) => {
    if (isDragging) return;
    startResize(e, direction);
  };

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
  };

  const handleResetSize = () => {
    setSize({ width: WINDOW_SIZE.DEFAULT.W, height: WINDOW_SIZE.DEFAULT.H });
  };

  const showEmptyState = messages.length === 0;

  const effectivePos = {
    x: position.x + positionAdjust.x,
    y: position.y + positionAdjust.y,
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

  return (
    <motion.div
      className="fixed z-[9999]"
      style={{
        left: effectivePos.x,
        top: isMaximized ? 8 : effectivePos.y,
        width: `${size.width}px`,
        height: isMaximized ? 'calc(100vh - 16px)' : `${size.height}px`,
        maxHeight: isMaximized ? 'calc(100vh - 16px)' : 'none',
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div
        className="relative h-full flex flex-col rounded-xl border border-border/30 bg-background overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header / Drag Bar */}
        <div
          ref={headerRef}
          className="cursor-grab active:cursor-grabbing border-b border-border/30"
          onMouseDown={handleDragStart}
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

        {/* Resize Handles */}
        <ResizeHandles
          onResizeStart={handleResizeStart}
          isResizing={isResizing}
        />

        {/* Voice Circle Overlay (inside window, not fullscreen) */}
        <VoiceCircleOverlay
          voiceState={voiceAgent?.state}
          audioLevels={voiceAgent?.audioLevels}
          streamingResponse={voiceAgent?.streamingResponse}
          onCancel={() => voiceAgent?.toggleListening()}
        />

        {/* Content Area */}
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
