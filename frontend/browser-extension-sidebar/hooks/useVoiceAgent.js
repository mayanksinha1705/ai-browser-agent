import { useState, useRef, useCallback, useEffect } from 'react';

export const VOICE_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  STREAMING: 'streaming',
};

export function useVoiceAgent(options = {}) {
  const {
    vadThreshold = 12,
    onTranscript = () => {},
    numBars = 16,
  } = options;

  const [state, setState] = useState(VOICE_STATE.IDLE);
  const [audioLevels, setAudioLevels] = useState(new Array(numBars).fill(0));
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const speakingUtteranceRef = useRef(null);
  const toggleStateRef = useRef(false);

  // Hydration-safe capability detection: the first client render MUST match the
  // SSR HTML (where real browser APIs don't exist), so we optimistically assume
  // support and re-evaluate after mount. Checking capabilities during render
  // caused a server/client mismatch ("Voice chat" vs "Voice not supported").
  const [voiceSupported, setVoiceSupported] = useState(true);

  useEffect(() => {
    setVoiceSupported(
      typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined'
    );
  }, []);

  const startRecording = useCallback(async () => {
    if (!voiceSupported) {
      setError('Voice recording is not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionDenied(false);
      setError(null);
      setState(VOICE_STATE.LISTENING);
      toggleStateRef.current = true;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up Web Audio API for VAD
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
      }

      // Start VAD monitoring with bar animation
      let isActive = true;
      const checkAudioLevel = () => {
        if (analyserRef.current && dataArrayRef.current && isActive) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;

          // Generate bar levels from frequency data
          const levels = new Array(numBars).fill(0);
          const barChunk = Math.floor(dataArrayRef.current.length / numBars);
          for (let i = 0; i < numBars; i++) {
            let sum = 0;
            for (let j = 0; j < barChunk; j++) {
              const idx = i * barChunk + j;
              if (idx < dataArrayRef.current.length) {
                sum += dataArrayRef.current[idx];
              }
            }
            levels[i] = Math.min(100, Math.round(sum / barChunk));
          }

          // If audio is present, mark as recording
          if (average > vadThreshold) {
            if (state !== VOICE_STATE.RECORDING) {
              setState(VOICE_STATE.RECORDING);
            }
          }

          setAudioLevels(levels);
        }
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
        }
      };

      mediaRecorder.start(100);
      checkAudioLevel();

      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Microphone access denied. Please allow mic in browser settings.');
      } else {
        setError(err.message || 'Failed to start recording');
      }
      return false;
    }
  }, [state, vadThreshold, numBars, voiceSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && toggleStateRef.current) {
      mediaRecorderRef.current.stop();
      try { mediaRecorderRef.current.requestData(); } catch {}
    }

    // Stop all audio monitoring
    let isActive = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    toggleStateRef.current = false;
    setState(VOICE_STATE.PROCESSING);
    setAudioLevels(new Array(numBars).fill(0));

    // Give a brief processing moment then go idle
    setTimeout(() => {
      setState(VOICE_STATE.IDLE);
    }, 500);
  }, [numBars]);

  const toggleListening = useCallback(async () => {
    if (toggleStateRef.current) {
      stopRecording();
      onTranscript('');
    } else {
      const success = await startRecording();
      if (success && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          onTranscript(text);
        };

        recognition.onerror = () => {
          setError('Speech recognition error');
        };

        recognition.start();
      }
    }
  }, [startRecording, stopRecording, onTranscript]);

  const playTTS = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) {
      setState(VOICE_STATE.IDLE);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setState(VOICE_STATE.IDLE);
    };

    utterance.onerror = () => {
      setState(VOICE_STATE.IDLE);
    };

    speakingUtteranceRef.current = utterance;
    setState(VOICE_STATE.SPEAKING);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState(VOICE_STATE.IDLE);
    setAudioLevels(new Array(numBars).fill(0));
  }, [numBars]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [numBars]);

  return {
    state,
    audioLevels,
    isListening: state === VOICE_STATE.LISTENING,
    isRecording: state === VOICE_STATE.RECORDING,
    isSpeaking: state === VOICE_STATE.SPEAKING,
    isProcessing: state === VOICE_STATE.PROCESSING,
    isStreaming: state === VOICE_STATE.STREAMING,
    isIdle: state === VOICE_STATE.IDLE,
    isActive: state !== VOICE_STATE.IDLE,
    error,
    permissionDenied,
    isSupported: voiceSupported,
    toggleListening,
    startListening: startRecording,
    stopListening: stopRecording,
    stopSpeaking,
    playTTS,
    setState,
  };
}
