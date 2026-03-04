// ============================================================
// Avalon AI — NPC Dialogue Hook
// React hook for pre-match taunts, mid-match reactions,
// and post-match comments based on personality
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';
import type { ChronosMoveType } from '@/engine/chronos/moves';

// --- Dialogue Types ---

export type DialogueMoment =
  | 'pre_match'
  | 'match_start'
  | 'took_damage'
  | 'dealt_damage'
  | 'shield_block'
  | 'counter_success'
  | 'counter_whiff'
  | 'low_hp'
  | 'opponent_low_hp'
  | 'big_move_incoming'
  | 'win'
  | 'lose';

export interface NPCDialogueLine {
  text: string;
  moment: DialogueMoment;
  npcId: string;
  npcName: string;
  timestamp: number;
}

// --- Dialogue Templates ---

interface DialogueBank {
  pre_match: string[];
  match_start: string[];
  took_damage: string[];
  dealt_damage: string[];
  shield_block: string[];
  counter_success: string[];
  counter_whiff: string[];
  low_hp: string[];
  opponent_low_hp: string[];
  big_move_incoming: string[];
  win: string[];
  lose: string[];
}

const ARIA_DIALOGUE: DialogueBank = {
  pre_match: ['Everything has a price. Your defeat? Surprisingly affordable.', 'I hope you brought your wallet. This is going to cost you.', 'Let\'s negotiate. With fists.'],
  match_start: ['Time to invest in pain.', 'The market opens... NOW.', 'Let\'s see what you\'re worth.'],
  took_damage: ['That\'ll cost you interest!', 'You call that an investment? Cheap shot.', 'Noted. I\'ll add it to your tab.'],
  dealt_damage: ['Consider that a service fee.', 'Premium pricing.', 'That one\'s on the house.'],
  shield_block: ['Insurance pays off!', 'Hedged that perfectly.', 'Risk management at its finest.'],
  counter_success: ['Counter-offer ACCEPTED.', 'The market corrects itself.', 'You just got audited.'],
  counter_whiff: ['Bad trade... bad trade...', 'Miscalculated the timing.', 'Sometimes the market lies.'],
  low_hp: ['Running low on capital...', 'Time to cut my losses.', 'Need a bailout here.'],
  opponent_low_hp: ['Your stock is crashing.', 'Time to close this deal.', 'Going once... going twice...'],
  big_move_incoming: ['That\'s a big investment. Hope it pays off for you.', 'I see your play. Interesting.', 'Heavy spending? I approve.'],
  win: ['Profit secured. Pleasure doing business.', 'Your defeat was a sound investment.', 'The market always wins. And I AM the market.'],
  lose: ['Sometimes you lose the trade. I\'ll be back.', 'Bad quarter. Won\'t happen again.', 'Consider this a lesson in humility.'],
};

const KAEL_DIALOGUE: DialogueBank = {
  pre_match: ['Shields are for cowards. Let your fists speak.', 'I don\'t play defense. I play OFFENSE.', 'Hope you said your goodbyes.'],
  match_start: ['FIGHT!', 'Blood and glory!', 'Show me what you\'ve got!'],
  took_damage: ['Is that all?!', 'You\'ll have to hit harder than THAT.', 'Pain is fuel!'],
  dealt_damage: ['CRUSH!', 'Feel that?!', 'That\'s just the beginning!'],
  shield_block: ['Pathetic shield.', 'You can\'t hide forever!', 'Shields break. You will too.'],
  counter_success: ['Countered? That takes no skill.', 'Fine. I\'ll just hit harder.', 'Lucky shot.'],
  counter_whiff: ['HA! Nice try.', 'Wasted your move!', 'Counter THIS.'],
  low_hp: ['Grr... I\'m not done yet!', 'Pain only makes me ANGRIER!', 'You think this stops me?!'],
  opponent_low_hp: ['You\'re FINISHED!', 'One more hit!', 'FALL!'],
  big_move_incoming: ['Bring it!', 'I don\'t dodge. I TANK.', 'Let it come!'],
  win: ['Too easy. Next!', 'Victory through superior force.', 'Another one falls.'],
  lose: ['This isn\'t over!', 'I\'ll be stronger next time.', 'You got lucky. LUCKY.'],
};

const NOVA_DIALOGUE: DialogueBank = {
  pre_match: ['Predictable players make the best punching bags.', 'Try to surprise me. I dare you.', 'This is going to be SO fun.'],
  match_start: ['Let\'s dance!', 'Show me your patterns!', 'Oh, this\'ll be good.'],
  took_damage: ['Ooh, you got me! Do it again, I dare you.', 'Okay okay, that was good. MY TURN.', 'Fun! Now watch this.'],
  dealt_damage: ['Gotcha!', 'Didn\'t see THAT coming, did you?', 'Surprise!'],
  shield_block: ['Boo! Boring shield.', 'That\'s no fun!', 'Come out and play!'],
  counter_success: ['READ LIKE A BOOK!', 'I knew you\'d do that!', 'Counter city, baby!'],
  counter_whiff: ['Huh. Okay, you\'re less predictable than I thought.', 'Alright, that was MY mistake.', 'Even I miss sometimes.'],
  low_hp: ['Haha, this just got INTERESTING!', 'The underdog arc begins!', 'Now I have to get creative.'],
  opponent_low_hp: ['Running out of HP AND options!', 'Almost done playing with you.', 'Say goodbye!'],
  big_move_incoming: ['Ooh, big move! I love big moves!', 'That\'s bold. I respect bold.', 'Interesting choice... very interesting.'],
  win: ['GG EZ. Just kidding. That was fun!', 'Read you like a blockchain.', 'Thanks for the entertainment!'],
  lose: ['Well played! But I learn fast.', 'Ooh, you got me. Rematch? NOW?', 'I\'ll figure you out next time.'],
};

const SAGE_DIALOGUE: DialogueBank = {
  pre_match: ['I have studied a thousand battles. Yours will be a footnote.', 'Your patterns betray you before we even begin.', 'Shall we begin the lesson?'],
  match_start: ['Observing...', 'Let us see what you know.', 'The data collection begins.'],
  took_damage: ['Interesting. Cataloguing that pattern.', 'A data point. Nothing more.', 'I see. Adjusting my model.'],
  dealt_damage: ['As predicted.', 'The hypothesis holds.', 'Calculated precisely.'],
  shield_block: ['A predictable defense for a predictable attack.', 'Your pattern suggests you\'ll try again.', 'Noted for future reference.'],
  counter_success: ['Your patterns are transparent.', 'As I calculated.', 'The data predicted this exactly.'],
  counter_whiff: ['Hmm. An anomaly. Updating my model.', 'You deviated from the pattern. Fascinating.', 'I must recalibrate.'],
  low_hp: ['This is... unexpected. Reassessing.', 'The data was incomplete.', 'A tactical recalculation is needed.'],
  opponent_low_hp: ['The conclusion approaches.', 'Your remaining possibilities narrow.', 'Checkmate in three moves.'],
  big_move_incoming: ['A bold hypothesis. Let me test it.', 'I see the play. I have the counter-argument.', 'Interesting approach. Flawed, but interesting.'],
  win: ['QED. The theorem is proven.', 'As the data predicted.', 'A satisfying conclusion to a brief experiment.'],
  lose: ['Fascinating result. I must study this further.', 'An outlier. It will not repeat.', 'Back to the lab. This data needs analysis.'],
};

const IRON_DIALOGUE: DialogueBank = {
  pre_match: ['You may strike me. You will not break me.', 'I stand between you and victory.', 'Prepare yourself.'],
  match_start: ['Shield up. Blade ready.', 'I am the wall.', 'Come.'],
  took_damage: ['I endure.', 'It will take more than that.', 'Scratch.'],
  dealt_damage: ['Justice.', 'Measured response.', 'Precision strike.'],
  shield_block: ['As intended.', 'The wall holds.', 'Protected.'],
  counter_success: ['Your recklessness, punished.', 'Overextension corrected.', 'Patience rewarded.'],
  counter_whiff: ['Hmm.', 'Miscalculated.', 'I adjust.'],
  low_hp: ['The wall... cracks. But does not fall.', 'I will not yield.', 'Still standing.'],
  opponent_low_hp: ['Yield.', 'It is nearly over.', 'Stand down.'],
  big_move_incoming: ['Let it come. I am ready.', 'My shield will hold.', 'Bring your worst.'],
  win: ['The wall stands. You do not.', 'Duty fulfilled.', 'Your assault has been repelled.'],
  lose: ['The wall... falls. Today.', 'You were the stronger force. This time.', 'I will rebuild.'],
};

const NPC_DIALOGUES: Record<string, DialogueBank> = {
  'aria-merchant': ARIA_DIALOGUE,
  'kael-warrior': KAEL_DIALOGUE,
  'nova-trickster': NOVA_DIALOGUE,
  'sage-scholar': SAGE_DIALOGUE,
  'iron-guardian': IRON_DIALOGUE,
};

// --- Utility ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- React Hook ---

export interface UseNPCDialogueReturn {
  currentLine: NPCDialogueLine | null;
  history: NPCDialogueLine[];
  trigger: (moment: DialogueMoment) => NPCDialogueLine;
  clear: () => void;
}

export function useNPCDialogue(npc: ChronosNPCProfile | null): UseNPCDialogueReturn {
  const [currentLine, setCurrentLine] = useState<NPCDialogueLine | null>(null);
  const [history, setHistory] = useState<NPCDialogueLine[]>([]);

  const dialogueBank = useMemo(() => {
    if (!npc) return null;
    return NPC_DIALOGUES[npc.id] ?? null;
  }, [npc]);

  const trigger = useCallback((moment: DialogueMoment): NPCDialogueLine => {
    const bank = dialogueBank;
    const text = bank ? pick(bank[moment]) : '...';

    const line: NPCDialogueLine = {
      text,
      moment,
      npcId: npc?.id ?? 'unknown',
      npcName: npc?.name ?? 'Unknown',
      timestamp: Date.now(),
    };

    setCurrentLine(line);
    setHistory(prev => [...prev.slice(-19), line]); // keep last 20
    return line;
  }, [dialogueBank, npc]);

  const clear = useCallback(() => {
    setCurrentLine(null);
    setHistory([]);
  }, []);

  return { currentLine, history, trigger, clear };
}

// --- Non-hook version for server/engine use ---

export function getNPCDialogue(npcId: string, moment: DialogueMoment): string {
  const bank = NPC_DIALOGUES[npcId];
  if (!bank) return '...';
  return pick(bank[moment]);
}
