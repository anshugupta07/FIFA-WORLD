import { useState, useCallback } from 'react';

/**
 * Central place for accessibility toggles: high contrast, large text,
 * and voice replies (Web Speech API TTS). Kept as a simple hook (no
 * external state library needed) since state is only consumed by App.
 */
export function useAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);

  const speak = useCallback(
    (text, lang) => {
      if (!voiceReplies) return;
      if (!('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [voiceReplies]
  );

  return {
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    voiceReplies,
    setVoiceReplies,
    speak,
  };
}
