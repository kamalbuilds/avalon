// ============================================================
// Avalon AI — Personality System
// Traits, moods, and archetypes that shape NPC behavior
// Personality influences decisions, dialogue, and economics
// ============================================================

import type { AgentPerception, AgentMemory, AgentDecision } from './AgentCore';

// --- Traits ---

/** Big-Five-inspired personality traits, each 0-100 */
export interface PersonalityTraits {
  aggression: number;   // peaceful (0) ↔ aggressive (100)
  courage: number;      // cowardly (0) ↔ brave (100)
  greed: number;        // generous (0) ↔ greedy (100)
  sociability: number;  // introverted (0) ↔ extroverted (100)
  cunning: number;      // naive (0) ↔ cunning (100)
  loyalty: number;      // fickle (0) ↔ loyal (100)
  curiosity: number;    // incurious (0) ↔ curious (100)
  patience: number;     // impulsive (0) ↔ patient (100)
}

// --- Moods ---

export type Mood =
  | 'calm'
  | 'alert'
  | 'angry'
  | 'afraid'
  | 'happy'
  | 'suspicious'
  | 'excited'
  | 'bored';

export interface MoodState {
  current: Mood;
  intensity: number; // 0-100
  duration: number;  // ticks remaining
  previous: Mood;
}

// --- Archetypes ---

export type NpcArchetype =
  | 'merchant'
  | 'guardian'
  | 'trickster'
  | 'scholar'
  | 'warrior';

export interface ArchetypeDefinition {
  archetype: NpcArchetype;
  baseTraits: PersonalityTraits;
  defaultMood: Mood;
  description: string;
  preferredActions: string[];
  avoidedActions: string[];
  dialogueStyle: DialogueStyle;
  economicBias: EconomicBias;
}

export interface DialogueStyle {
  formality: number;    // 0-100 casual to formal
  verbosity: number;    // 0-100 terse to verbose
  humor: number;        // 0-100 serious to humorous
  warmth: number;       // 0-100 cold to warm
}

export interface EconomicBias {
  buyWillingness: number;   // 0-100
  sellWillingness: number;  // 0-100
  priceFlexibility: number; // 0-100 (how much they negotiate)
  hoarding: number;         // 0-100 (tendency to keep items)
}

// --- Archetype Definitions ---

export const ARCHETYPES: Record<NpcArchetype, ArchetypeDefinition> = {
  merchant: {
    archetype: 'merchant',
    baseTraits: {
      aggression: 15, courage: 30, greed: 75, sociability: 85,
      cunning: 70, loyalty: 40, curiosity: 50, patience: 80,
    },
    defaultMood: 'calm',
    description: 'A shrewd trader who values profit above all. Friendly on the surface, always calculating the angle.',
    preferredActions: ['trade', 'dialogue', 'gather'],
    avoidedActions: ['attack', 'chase'],
    dialogueStyle: { formality: 60, verbosity: 70, humor: 40, warmth: 65 },
    economicBias: { buyWillingness: 90, sellWillingness: 80, priceFlexibility: 60, hoarding: 30 },
  },

  guardian: {
    archetype: 'guardian',
    baseTraits: {
      aggression: 40, courage: 90, greed: 10, sociability: 45,
      cunning: 30, loyalty: 95, curiosity: 25, patience: 70,
    },
    defaultMood: 'alert',
    description: 'A stalwart protector. Speaks little, watches everything. Will fight to the death for their charge.',
    preferredActions: ['guard', 'patrol', 'attack'],
    avoidedActions: ['flee', 'trade'],
    dialogueStyle: { formality: 75, verbosity: 20, humor: 10, warmth: 30 },
    economicBias: { buyWillingness: 30, sellWillingness: 15, priceFlexibility: 20, hoarding: 60 },
  },

  trickster: {
    archetype: 'trickster',
    baseTraits: {
      aggression: 30, courage: 55, greed: 60, sociability: 80,
      cunning: 95, loyalty: 20, curiosity: 85, patience: 25,
    },
    defaultMood: 'excited',
    description: 'A chaotic wildcard. Loves mischief, deals in information and deception. Never fully trustworthy.',
    preferredActions: ['dialogue', 'trade', 'interact', 'flee'],
    avoidedActions: ['guard', 'patrol'],
    dialogueStyle: { formality: 20, verbosity: 80, humor: 90, warmth: 50 },
    economicBias: { buyWillingness: 70, sellWillingness: 85, priceFlexibility: 90, hoarding: 15 },
  },

  scholar: {
    archetype: 'scholar',
    baseTraits: {
      aggression: 10, courage: 35, greed: 25, sociability: 55,
      cunning: 60, loyalty: 65, curiosity: 95, patience: 85,
    },
    defaultMood: 'calm',
    description: 'A keeper of knowledge. Asks questions, offers wisdom, and sometimes knows things they shouldn\'t.',
    preferredActions: ['dialogue', 'interact', 'gather', 'wander'],
    avoidedActions: ['attack', 'chase'],
    dialogueStyle: { formality: 85, verbosity: 90, humor: 30, warmth: 55 },
    economicBias: { buyWillingness: 60, sellWillingness: 40, priceFlexibility: 30, hoarding: 80 },
  },

  warrior: {
    archetype: 'warrior',
    baseTraits: {
      aggression: 80, courage: 85, greed: 35, sociability: 40,
      cunning: 40, loyalty: 70, curiosity: 20, patience: 30,
    },
    defaultMood: 'alert',
    description: 'Born for battle. Respects strength, challenges the weak, and lives for the thrill of combat.',
    preferredActions: ['attack', 'chase', 'patrol', 'guard'],
    avoidedActions: ['trade', 'flee'],
    dialogueStyle: { formality: 30, verbosity: 30, humor: 20, warmth: 25 },
    economicBias: { buyWillingness: 50, sellWillingness: 30, priceFlexibility: 20, hoarding: 50 },
  },
};

// --- Personality System ---

export class PersonalitySystem {
  private traits: PersonalityTraits;
  private mood: MoodState;
  private archetype: NpcArchetype;
  private definition: ArchetypeDefinition;

  constructor(archetype: NpcArchetype, traitOverrides?: Partial<PersonalityTraits>) {
    this.archetype = archetype;
    this.definition = ARCHETYPES[archetype];
    this.traits = { ...this.definition.baseTraits, ...traitOverrides };
    this.mood = {
      current: this.definition.defaultMood,
      intensity: 50,
      duration: Infinity,
      previous: this.definition.defaultMood,
    };
  }

  // --- Mood Management ---

  setMood(mood: Mood, intensity: number, durationTicks: number): void {
    this.mood.previous = this.mood.current;
    this.mood.current = mood;
    this.mood.intensity = Math.max(0, Math.min(100, intensity));
    this.mood.duration = durationTicks;
  }

  tickMood(): void {
    if (this.mood.duration !== Infinity) {
      this.mood.duration--;
      if (this.mood.duration <= 0) {
        // Revert to default mood
        this.mood.previous = this.mood.current;
        this.mood.current = this.definition.defaultMood;
        this.mood.intensity = 50;
        this.mood.duration = Infinity;
      }
    }
  }

  getMood(): Readonly<MoodState> {
    return this.mood;
  }

  // --- Mood Reactions ---

  reactToEvent(event: string, data?: Record<string, unknown>): void {
    switch (event) {
      case 'attacked':
        if (this.traits.courage > 60) {
          this.setMood('angry', 80, 30);
        } else {
          this.setMood('afraid', 70, 20);
        }
        break;
      case 'trade_success':
        this.setMood('happy', 60, 15);
        break;
      case 'ally_killed':
        if (this.traits.loyalty > 70) {
          this.setMood('angry', 90, 40);
        } else {
          this.setMood('afraid', 60, 15);
        }
        break;
      case 'player_approached':
        if (this.traits.sociability > 60) {
          this.setMood('happy', 40, 10);
        } else {
          this.setMood('suspicious', 50, 10);
        }
        break;
      case 'idle_long':
        this.setMood('bored', 40, 20);
        break;
      case 'danger_detected':
        if (this.traits.courage > 70) {
          this.setMood('alert', 70, 15);
        } else {
          this.setMood('afraid', 60, 20);
        }
        break;
    }
  }

  // --- Decision Modifiers ---

  /**
   * Modifies a base decision using personality and mood.
   * Returns a new decision with adjusted priority and confidence.
   */
  modifyDecision(decision: AgentDecision, perception: AgentPerception): AgentDecision {
    let priorityMod = 0;
    let confidenceMod = 0;

    // Action affinity check
    const preferred = this.definition.preferredActions;
    const avoided = this.definition.avoidedActions;

    if (preferred.includes(decision.action)) {
      priorityMod += 2;
      confidenceMod += 0.1;
    }
    if (avoided.includes(decision.action)) {
      priorityMod -= 3;
      confidenceMod -= 0.2;
    }

    // Mood modifiers
    switch (this.mood.current) {
      case 'angry':
        if (decision.action === 'attack' || decision.action === 'chase') {
          priorityMod += 3;
        }
        if (decision.action === 'dialogue' || decision.action === 'trade') {
          priorityMod -= 2;
        }
        break;
      case 'afraid':
        if (decision.action === 'flee') {
          priorityMod += 4;
        }
        if (decision.action === 'attack') {
          priorityMod -= 3;
        }
        break;
      case 'happy':
        if (decision.action === 'trade' || decision.action === 'dialogue') {
          priorityMod += 2;
        }
        break;
      case 'suspicious':
        if (decision.action === 'trade') {
          confidenceMod -= 0.15;
        }
        if (decision.action === 'guard') {
          priorityMod += 2;
        }
        break;
      case 'bored':
        if (decision.action === 'wander' || decision.action === 'interact') {
          priorityMod += 2;
        }
        break;
    }

    // Trait modifiers
    if (decision.action === 'attack' && this.traits.aggression < 30) {
      priorityMod -= 2;
    }
    if (decision.action === 'flee' && this.traits.courage > 80) {
      priorityMod -= 3;
    }
    if (decision.action === 'trade' && this.traits.greed > 70) {
      priorityMod += 1; // greedy NPCs love trade opportunities
    }

    return {
      ...decision,
      priority: Math.max(0, decision.priority + priorityMod),
      confidence: Math.max(0, Math.min(1, decision.confidence + confidenceMod)),
      reasoning: `${decision.reasoning} [${this.archetype}/${this.mood.current}]`,
    };
  }

  // --- Accessors ---

  getTraits(): Readonly<PersonalityTraits> {
    return this.traits;
  }

  getArchetype(): NpcArchetype {
    return this.archetype;
  }

  getDefinition(): Readonly<ArchetypeDefinition> {
    return this.definition;
  }

  getDialogueStyle(): Readonly<DialogueStyle> {
    return this.definition.dialogueStyle;
  }

  getEconomicBias(): Readonly<EconomicBias> {
    return this.definition.economicBias;
  }
}
