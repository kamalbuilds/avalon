// ============================================================================
// Chronos Battle Sound Effect Hooks
// Infrastructure for game audio. Plays nothing now but is wired to game events.
// When audio files are added, just update the play() calls.
// ============================================================================

import { useCallback, useRef } from 'react';

export type SFXType =
  | 'hit_light'
  | 'hit_heavy'
  | 'shield_activate'
  | 'shield_block'
  | 'counter_success'
  | 'counter_miss'
  | 'move_launch'
  | 'move_land'
  | 'coin_earn'
  | 'game_start'
  | 'game_over_win'
  | 'game_over_lose'
  | 'loot_reveal'
  | 'loot_legendary'
  | 'button_click'
  | 'button_hover';

// Placeholder: when audio files exist, map them here
const SFX_PATHS: Partial<Record<SFXType, string>> = {
  // hit_light: '/sfx/hit-light.mp3',
  // hit_heavy: '/sfx/hit-heavy.mp3',
  // etc.
};

export function useChronosSFX() {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const enabled = useRef(true);

  const play = useCallback((type: SFXType, volume = 0.5) => {
    if (!enabled.current) return;

    const path = SFX_PATHS[type];
    if (!path) return; // No audio file mapped yet

    try {
      let audio = audioCache.current.get(path);
      if (!audio) {
        audio = new Audio(path);
        audioCache.current.set(path, audio);
      }
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;
      audio.play().catch(() => { }); // Ignore autoplay restrictions
    } catch {
      // Audio not available
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    enabled.current = value;
  }, []);

  const isEnabled = useCallback(() => enabled.current, []);

  return { play, setEnabled, isEnabled };
}
