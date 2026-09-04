'use client';

import { useState, useEffect } from 'react';
import { FloatingChatWindow } from '@/components/sidebar/FloatingChatWindow';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { LAPTOP_SEARCH_FLOW } from '@/lib/laptop-search-flow';

const LAPTOP_KEYWORDS = [
  'laptop',
  'laptops',
  'notebook',
  'gaming laptop',
  'find laptop',
  'best laptop',
  'buy laptop',
];

const DELAY_BETWEEN_STEPS = 600;

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [isTaskRunning, setIsTaskRunning] = useState(false);

  const voiceAgent = useVoiceAgent({
    onResponse: (transcript) => {
      const userMsg = { role: 'user', content: transcript, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);

      if (isLaptopQuery(transcript)) {
        runLaptopSearch(transcript);
      } else {
        setTimeout(() => {
          const agentMsg = {
            role: 'agent',
            content: "I'm PAROKSH, your AI browser agent. How can I help you today?",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, agentMsg]);
        }, 800);
      }
    },
  });

  const isLaptopQuery = (text) => {
    const lower = text.toLowerCase();
    return LAPTOP_KEYWORDS.some((kw) => lower.includes(kw));
  };

  const runLaptopSearch = async (query) => {
    const flow = LAPTOP_SEARCH_FLOW;
    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    const okMsg = { role: 'agent', content: 'ok', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg, okMsg]);
    setIsTaskRunning(true);

    for (let i = 0; i < flow.steps.length; i++) {
      setCurrentStep(flow.steps[i]);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_STEPS));
    }

    setCurrentStep(null);
    setIsTaskRunning(false);

    const agentMsg = {
      role: 'agent',
      content: 'I found the best laptops under ₹70,000 for gaming:',
      result: flow.result,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, agentMsg]);
  };

  const handleSendMessage = (text) => {
    if (isLaptopQuery(text)) {
      runLaptopSearch(text);
      return;
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const agentMsg = {
        role: 'agent',
        content: "I'm PAROKSH, your AI browser agent. How can I help you today?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 800);
  };

  const handleSendImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const userMsg = {
        role: 'user',
        content: 'Uploaded an image',
        image: e.target.result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setTimeout(() => {
        const agentMsg = {
          role: 'agent',
          content: 'I received your image. To analyze it, please connect a backend that supports image processing.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const handleSendFile = (file) => {
    const userMsg = {
      role: 'user',
      content: `Uploaded file: ${file.name}`,
      file: { name: file.name, size: file.size, type: file.type },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const agentMsg = {
        role: 'agent',
        content: `I've received your file "${file.name}". How would you like me to process it?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1000);
  };

  const handleNewSession = () => {
    setMessages([]);
    setCurrentStep(null);
    setIsTaskRunning(false);
    voiceAgent.stopSpeaking();
  };

  const handleStop = () => {
    setIsTaskRunning(false);
    setCurrentStep(null);
  };

  return (
    <FloatingChatWindow
      messages={messages}
      onSendMessage={handleSendMessage}
      onSendImage={handleSendImage}
      onSendFile={handleSendFile}
      onNewSession={handleNewSession}
      currentStep={currentStep}
      isTaskRunning={isTaskRunning}
      onStop={handleStop}
      voiceAgent={voiceAgent}
    />
  );
}
