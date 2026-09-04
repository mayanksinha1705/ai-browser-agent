'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Send, FileText, Image as ImageIcon } from 'lucide-react';
import { VoiceResponse } from '@/components/sidebar/VoiceResponse';

function TypingIndicator() {
  return (
    <div className="flex mb-3 justify-start">
      <div className="flex items-center gap-0.5 text-muted-foreground/50 text-xs">
        <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-duration:1.4s] [animation-delay:-0.16s]" />
        <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-duration:1.4s] [animation-delay:-0.32s]" />
        <div className="w-1 h-1 rounded-full bg-current animate-bounce [animation-duration:1.4s] [animation-delay:-0.48s]" />
      </div>
    </div>
  );
}

function LaptopResults({ data }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-muted-foreground mb-2">
        Found {data.length} laptops:
      </p>
      {data.map((laptop, index) => (
        <div
          key={index}
          className="border border-border/30 rounded-lg p-3 text-sm"
        >
          <div className="flex items-start justify-between mb-1">
            <span className="font-medium">
              {index + 1}. {laptop.name}
            </span>
            <span className="text-emerald-400 font-medium">{laptop.price}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{laptop.specs}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400">★ {laptop.rating}</span>
            <a href={laptop.link} className="text-primary hover:underline">
              View →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'mb-3 animate-slide-up',
        isUser ? 'flex justify-end' : 'flex justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%]',
          isUser
            ? 'ml-auto'
            : 'border border-border/30 bg-secondary/20 rounded-lg'
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 px-3 pt-2">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">PAROKSH</span>
          </div>
        )}
        {message.image && (
          <img
            src={message.image}
            alt="Uploaded"
            className="max-w-full max-h-32 rounded mb-1 border border-border/30"
          />
        )}
        {message.file && (
          <div className="flex items-center gap-2 bg-secondary/20 rounded px-2 py-1 mb-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="text-muted-foreground">{message.file.name}</span>
          </div>
        )}
        <p className={cn(
          'text-sm break-words',
          isUser ? 'px-3 py-2' : 'px-3 pb-2'
        )}>
          {message.content}
        </p>
        {message.result && message.result.type === 'laptop-comparison' && (
          <LaptopResults data={message.result.data} />
        )}
      </div>
    </div>
  );
}

export function ChatInterface({ messages, isTyping = false, voiceAgent }) {
  const messagesEndRef = useRef(null);

  const scrollToEnd = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToEnd();
    });
  }, [messages, isTyping, voiceAgent?.streamingResponse]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        scrollToEnd();
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!messages || messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 py-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <VoiceResponse
          text={voiceAgent?.streamingResponse}
          isVisible={voiceAgent?.state === 'streaming' || voiceAgent?.isSpeaking}
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
