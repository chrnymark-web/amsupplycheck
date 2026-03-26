import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const { lang = 'da-DK', rate = 1, pitch = 1, volume = 1 } = options;
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a Danish voice, fallback to first available
      const danishVoice = availableVoices.find(v => v.lang.startsWith('da'));
      const englishVoice = availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      const defaultVoice = danishVoice || englishVoice || availableVoices[0];
      
      if (defaultVoice && !selectedVoice) {
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice?.lang || lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, volume, selectedVoice]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPaused) {
      resume();
    } else if (isSpeaking) {
      pause();
    }
  }, [isPaused, isSpeaking, pause, resume]);

  return {
    speak,
    pause,
    resume,
    stop,
    toggle,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
};
