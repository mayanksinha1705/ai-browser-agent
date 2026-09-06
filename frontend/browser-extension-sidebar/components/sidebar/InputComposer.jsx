'use client';

import { Image, Paperclip, Send, Mic, MicOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceButton } from '@/components/sidebar/VoiceButton';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export function InputComposer({
  onSend,
  onSendImage,
  onSendFile,
  disabled,
  voiceAgent,
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const { isListening: webSpeechListening, transcript, toggleListening, isSupported: speechSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !input) {
      setInput(transcript);
    }
  }, [transcript, input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend?.(input.trim());
    setInput('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) onSendFile?.(file);
    e.target.value = '';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) onSendImage?.(file);
    e.target.value = '';
  };

  const isInputEmpty = !input.trim() && !voiceAgent?.isListening;

  return (
    <div className="p-3 border-t border-border/20">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-xl border border-border/40 bg-secondary/10">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceAgent?.isListening ? 'Listening...' : 'Type a message...'}
            disabled={disabled || voiceAgent?.isListening}
            rows={1}
            className="min-h-[40px] max-h-32 w-full resize-none bg-transparent border-0 px-3 pt-2.5 pb-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-between px-2">
            {/* Left: Photo, File, Mic */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-blue-400 opacity-50"
                title="Upload photo (disabled - no backend)"
                disabled={true}
              >
                <Image className="h-4 w-4" />
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="*"
                hidden
                onChange={handleFileUpload}
              />
            </div>

            {/* Right: Mic + Send */}
            <div className="flex items-center gap-1">
              {voiceAgent && (
                <VoiceButton
                  voiceState={voiceAgent.state}
                  isListening={voiceAgent.isListening}
                  isRecording={voiceAgent.isRecording}
                  isSpeaking={voiceAgent.isSpeaking}
                  isProcessing={voiceAgent.isProcessing}
                  isActive={voiceAgent.isActive}
                  isSupported={voiceAgent.isSupported}
                  onToggle={voiceAgent.toggleListening}
                  size="sm"
                />
              )}

              <Button
                type="submit"
                size="icon"
                disabled={isInputEmpty || disabled}
                className={cn(
                  'h-8 w-8 rounded-full',
                  'bg-slate-800 hover:bg-slate-700 text-white',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                title="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
