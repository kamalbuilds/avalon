// ============================================================
// Avalon AI Smart Dialogue Hook
// Drop-in replacement for useNPCDialogue that adds
// game-state-aware context dialogue. Falls back to templates
// when no context match is found.
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';
import type { ChronosMoveType } from '@/engine/chronos/moves';
import { type DialogueMoment, type NPCDialogueLine, getNPCDialogue } from './useNPCDialogue';
import { type BattleContext, getSmartDialogue } from './SmartDialogue';

export interface UseSmartDialogueReturn {
  currentLine: NPCDialogueLine | null;
  history: NPCDialogueLine[];
  trigger: (moment: DialogueMoment, context?: BattleContext) => NPCDialogueLine;
  clear: () => void;
  isSmartLine: boolean; // true when last line was context-aware
}

export function useSmartDialogue(npc: ChronosNPCProfile | null): UseSmartDialogueReturn {
  const [currentLine, setCurrentLine] = useState<NPCDialogueLine | null>(null);
  const [history, setHistory] = useState<NPCDialogueLine[]>([]);
  const [isSmartLine, setIsSmartLine] = useState(false);

  const trigger = useCallback((moment: DialogueMoment, context?: BattleContext): NPCDialogueLine => {
    let text: string = '...';
    let smart = false;

    if (npc && context) {
      // Try smart context-aware dialogue first
      const smartText = getSmartDialogue(npc, moment, context);
      if (smartText) {
        text = smartText;
        smart = true;
      }
    }

    // Fallback to template dialogue
    if (!smart && npc) {
      text = getNPCDialogue(npc.id, moment);
    }

    const line: NPCDialogueLine = {
      text,
      moment,
      npcId: npc?.id ?? 'unknown',
      npcName: npc?.name ?? 'Unknown',
      timestamp: Date.now(),
    };

    setCurrentLine(line);
    setIsSmartLine(smart);
    setHistory(prev => [...prev.slice(-19), line]);
    return line;
  }, [npc]);

  const clear = useCallback(() => {
    setCurrentLine(null);
    setHistory([]);
    setIsSmartLine(false);
  }, []);

  return { currentLine, history, trigger, clear, isSmartLine };
}
