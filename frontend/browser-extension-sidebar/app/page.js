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
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'extension') {
      setIsEmbedded(true);
      document.documentElement.setAttribute('data-embed', 'extension');
    }
  }, []);

  // ---- Persistent state + active-tab wiring (side panel mode) ----
  useEffect(() => {
    if (!isEmbedded) return;
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

    const isExtensionContext = typeof chrome.runtime?.id === 'string';

    // Restore persisted state.
    if (isExtensionContext) {
      chrome.runtime.sendMessage({ type: 'paroksh/load-state' }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.state?.messages) setMessages(res.state.messages);
        if (typeof res?.state?.isTaskRunning === 'boolean') setIsTaskRunning(res.state.isTaskRunning);
      });
    }

    // Listen for active-tab changes from the background.
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'paroksh/active-tab') return;
      // We can use this later to auto-attach page context to the conversation.
    };
    window.addEventListener('message', onMessage);

    // Persist state on changes (debounced).
    let saveTimer = null;
    const persist = () => {
      if (!isExtensionContext) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'paroksh/save-state',
          state: { messages, isTaskRunning },
        });
      }, 400);
    };

    // Initial active-tab broadcast.
    if (isExtensionContext) {
      chrome.runtime.sendMessage({ type: 'paroksh/get-active-tab' }, () => {
        void chrome.runtime.lastError;
      });
    }

    const unsub = () => window.removeEventListener('message', onMessage);
    return () => { unsub(); clearTimeout(saveTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbedded]);

  // Persist on every state change.
  useEffect(() => {
    if (!isEmbedded) return;
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    chrome.runtime.sendMessage({
      type: 'paroksh/save-state',
      state: { messages, isTaskRunning },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isTaskRunning, isEmbedded]);

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
      isEmbedded={isEmbedded}
    />
  );
}
