"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function useSpeech(onTranscript: (value: string) => void) {
  const browserSupported = useSyncExternalStore(
    () => () => undefined,
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    () => false,
  );
  const speechSupported = useSyncExternalStore(
    () => () => undefined,
    () => "speechSynthesis" in window,
    () => false,
  );
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const baseTextRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback((existingText = "") => {
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      setError("Voice input is not supported in this browser. You can always type your answer.");
      return;
    }
    recognitionRef.current?.stop();
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    baseTextRef.current = existingText.trim();
    recognition.onresult = (event) => {
      let transcript = "";
      let finalResult = false;
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        finalResult ||= event.results[index].isFinal;
      }
      onTranscript([baseTextRef.current, transcript.trim()].filter(Boolean).join(" "));
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), finalResult ? 1400 : 2400);
    };
    recognition.onerror = (event) => {
      setError(event.error === "not-allowed" ? "Microphone permission was denied. Enable it in browser settings or type your answer." : "Voice input stopped unexpectedly. Your transcript is still editable.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  }, [onTranscript]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
    utterance.voice = voices.find((voice) => /Google US English|Microsoft.*Natural|Samantha|Ava|Alex/i.test(voice.name)) ?? voices.find((voice) => voice.lang === "en-US") ?? voices[0] ?? null;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { browserSupported, speechSupported, isListening, error, startListening, stopListening, speak };
}
