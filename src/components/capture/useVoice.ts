'use client';

import { useState, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing';

export function useVoice(onTranscript: (text: string) => void, onJarvisDetected?: () => void) {
  const [state, setState] = useState<VoiceState>('idle');
  const [interim, setInterim] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [jarvisActive, setJarvisActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const jarvisSignaledRef = useRef(false);

  const detectJarvis = (text: string): boolean => {
    return /\bjarvis\b|\bharvis\b|\bjarbi\b/i.test(text);
  };

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    if (recRef.current) {
      recRef.current.onend = null;
      recRef.current.onerror = null;
      recRef.current.onresult = null;
      recRef.current.abort();
      recRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = '';
    interimRef.current = '';
    jarvisSignaledRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let final = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      if (final) finalRef.current += final;
      const combined = finalRef.current + interimText;
      interimRef.current = combined;
      setInterim(combined);

      // Detección en tiempo real de "Jarvis" en el texto interim
      if (!jarvisSignaledRef.current && detectJarvis(combined)) {
        jarvisSignaledRef.current = true;
        setJarvisActive(true);
        onJarvisDetected?.();
      }
    };

    rec.onend = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const text = (finalRef.current || interimRef.current).trim();
      if (text) {
        setState('processing');
        onTranscript(text);
      } else {
        setState('idle');
        setInterim('');
        setElapsed(0);
        setJarvisActive(false);
        finalRef.current = '';
        interimRef.current = '';
        jarvisSignaledRef.current = false;
      }
    };

    rec.onerror = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setState('idle');
      setJarvisActive(false);
    };

    recRef.current = rec;
    rec.start();
    setState('listening');
    setElapsed(0);
    setInterim('');
    setJarvisActive(false);
    jarvisSignaledRef.current = false;
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }, [onTranscript, onJarvisDetected]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    recRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
    setInterim('');
    setElapsed(0);
    setJarvisActive(false);
    finalRef.current = '';
    interimRef.current = '';
    jarvisSignaledRef.current = false;
  }, []);

  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return { state, interim, elapsedStr, start, stop, reset, jarvisActive };
}
