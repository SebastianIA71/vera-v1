'use client';

import { useState, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing';

export function useVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>('idle');
  const [interim, setInterim] = useState('');
  const [elapsed, setElapsed] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalRef = useRef('');

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = '';

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
      setInterim(finalRef.current + interimText);
    };

    rec.onend = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setState('processing');
      const text = finalRef.current.trim() || interim.trim();
      if (text) onTranscript(text);
    };

    rec.onerror = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setState('idle');
    };

    recRef.current = rec;
    rec.start();
    setState('listening');
    setElapsed(0);
    setInterim('');
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }, [onTranscript, interim]);

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
    finalRef.current = '';
  }, []);

  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return { state, interim, elapsedStr, start, stop, reset };
}
