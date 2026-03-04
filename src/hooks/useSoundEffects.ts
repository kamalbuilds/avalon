// ============================================================================
// Web Audio API Synthesized Sound Effects
// No external audio files needed — all sounds generated via AudioContext
// ============================================================================

import { useCallback, useRef } from 'react';

export type GameSFX = 'hit' | 'block' | 'victory' | 'defeat';

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabled = useRef(true);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((type: GameSFX, volume = 0.3) => {
    if (!enabled.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, volume));
      gain.connect(ctx.destination);

      switch (type) {
        case 'hit': {
          // Short buzz — sawtooth at 150Hz, quick decay
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
          gain.gain.setValueAtTime(volume, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.connect(gain);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case 'block': {
          // Thud — low sine at 60Hz with quick decay
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(60, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
          gain.gain.setValueAtTime(volume * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'victory': {
          // Ascending tones — C5, E5, G5, C6
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            noteGain.gain.setValueAtTime(0.01, now + i * 0.15);
            noteGain.gain.linearRampToValueAtTime(volume * 0.5, now + i * 0.15 + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.25);
            osc.connect(noteGain);
            noteGain.connect(ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
          });
          return; // Early return — we used separate gains per note
        }
        case 'defeat': {
          // Descending tones — C5, Ab4, F4, Db4
          const notes = [523.25, 415.30, 349.23, 277.18];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            noteGain.gain.setValueAtTime(0.01, now + i * 0.2);
            noteGain.gain.linearRampToValueAtTime(volume * 0.4, now + i * 0.2 + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.35);
            osc.connect(noteGain);
            noteGain.connect(ctx.destination);
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.4);
          });
          return;
        }
      }
    } catch {
      // AudioContext not available
    }
  }, [getCtx]);

  const setEnabled = useCallback((value: boolean) => {
    enabled.current = value;
  }, []);

  return { play, setEnabled };
}
