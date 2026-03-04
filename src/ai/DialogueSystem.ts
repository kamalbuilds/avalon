// ============================================================
// Avalon AI Dialogue System
// Template-based dialogue shaped by personality and mood
// NPCs speak differently based on who they are
// ============================================================

import type { PersonalitySystem, DialogueStyle, NpcArchetype, Mood } from './PersonalitySystem';

// --- Dialogue Types ---

export interface DialogueLine {
  text: string;
  speaker: string;
  mood: Mood;
  archetype: NpcArchetype;
  category: DialogueCategory;
  timestamp: number;
}

export type DialogueCategory =
  | 'greeting'
  | 'farewell'
  | 'trade_offer'
  | 'trade_accept'
  | 'trade_reject'
  | 'trade_negotiate'
  | 'combat_taunt'
  | 'combat_victory'
  | 'combat_defeat'
  | 'combat_flee'
  | 'idle_chatter'
  | 'quest_offer'
  | 'quest_complete'
  | 'lore'
  | 'warning'
  | 'thanks'
  | 'insult'
  | 'compliment';

export interface DialogueTemplate {
  category: DialogueCategory;
  templates: string[];
  moodVariants?: Partial<Record<Mood, string[]>>;
}

// --- Dialogue Templates per Archetype ---

const MERCHANT_DIALOGUE: DialogueTemplate[] = [
  {
    category: 'greeting',
    templates: [
      'Welcome, welcome! See anything you like?',
      'Ah, a customer! Come, browse my wares.',
      'Everything has a price, friend. What do you seek?',
    ],
    moodVariants: {
      happy: ['What a fine day for commerce! Welcome!', 'Ah, my favorite customer returns!'],
      suspicious: ['...Can I help you with something?', 'You looking to buy, or just browsing?'],
      angry: ['Make it quick. I\'m not in the mood.', 'State your business.'],
    },
  },
  {
    category: 'trade_offer',
    templates: [
      'I can offer you {item} for {price}. A fair price, I think.',
      '{item}? Excellent choice. That\'ll be {price}.',
      'For you? {price}. And that\'s my best offer.',
    ],
  },
  {
    category: 'trade_accept',
    templates: ['Pleasure doing business!', 'A wise purchase.', 'You won\'t regret it.'],
  },
  {
    category: 'trade_reject',
    templates: ['Perhaps another time.', 'Your loss, friend.', 'I\'ll be here when you change your mind.'],
  },
  {
    category: 'trade_negotiate',
    templates: ['Hmm... I could go as low as {price}.', 'You drive a hard bargain. {price}, final offer.', 'Let\'s meet in the middle {price}.'],
  },
  {
    category: 'farewell',
    templates: ['Come back soon!', 'Safe travels, and remember where to find me.', 'Until next time, friend.'],
  },
  {
    category: 'idle_chatter',
    templates: ['Business has been slow lately...', 'Have you heard? New trade routes opened up.', 'Every coin tells a story, they say.'],
  },
];

const GUARDIAN_DIALOGUE: DialogueTemplate[] = [
  {
    category: 'greeting',
    templates: ['Halt. State your business.', 'You may pass. But watch yourself.', 'Move along.'],
    moodVariants: {
      alert: ['Stop. Something\'s not right.', 'Stay close. I sense danger.'],
      calm: ['All clear. Welcome.', 'The area is secure.'],
    },
  },
  {
    category: 'combat_taunt',
    templates: ['You should not have come here.', 'I will not yield.', 'Stand down, or fall.'],
  },
  {
    category: 'combat_victory',
    templates: ['The threat is neutralized.', 'Stay down.', 'Area secured.'],
  },
  {
    category: 'warning',
    templates: ['Turn back. This area is restricted.', 'I\'m watching you.', 'Don\'t make me repeat myself.'],
  },
  {
    category: 'farewell',
    templates: ['Stay safe out there.', 'Go.', 'My watch continues.'],
  },
  {
    category: 'idle_chatter',
    templates: ['...', 'The walls have eyes. And so do I.', 'Quiet night. Good.'],
  },
];

const TRICKSTER_DIALOGUE: DialogueTemplate[] = [
  {
    category: 'greeting',
    templates: ['Well well well, what do we have here?', 'You look like someone who appreciates... opportunity.', 'Psst! Hey, over here.'],
    moodVariants: {
      excited: ['Oh this is going to be FUN!', 'You have no idea what you just walked into!'],
      suspicious: ['Hmm... are you one of THEM?', 'I\'ve got my eye on you...'],
    },
  },
  {
    category: 'trade_offer',
    templates: [
      'I\'ve got something special... {item}. Only {price}. Don\'t ask where I got it.',
      'Between you and me? {item} for {price}. A steal. Literally.',
      '{item}. {price}. No questions asked.',
    ],
  },
  {
    category: 'trade_negotiate',
    templates: ['You wound me! Fine... {price}. But you owe me.', 'Ha! I like you. {price}, but don\'t tell anyone.', 'Hmm... {price}. Take it before I change my mind.'],
  },
  {
    category: 'combat_taunt',
    templates: ['Catch me if you can!', 'Now you see me...', 'Too slow!'],
  },
  {
    category: 'combat_flee',
    templates: ['This isn\'t over!', 'Tactical retreat!', 'You\'ve seen nothing!'],
  },
  {
    category: 'farewell',
    templates: ['Don\'t look for me. I\'ll find you.', 'Remember you didn\'t see me.', 'Pleasure doing... whatever this was.'],
  },
  {
    category: 'idle_chatter',
    templates: ['I know things... things that would make your hair stand up.', 'Bored bored bored. Someone cause some chaos already.', 'Want to hear a secret? ...Nah, it\'ll cost you.'],
  },
  {
    category: 'insult',
    templates: ['You\'re about as sharp as a marble.', 'I\'ve met smarter rocks.', 'Oh honey... no.'],
  },
];

const SCHOLAR_DIALOGUE: DialogueTemplate[] = [
  {
    category: 'greeting',
    templates: ['Ah, a seeker of knowledge! Welcome.', 'Do you come with questions? I have answers.', 'Knowledge is the truest currency. How may I help?'],
    moodVariants: {
      bored: ['Oh. It\'s you. What do you want?', 'I suppose you want something explained...'],
      excited: ['I\'ve made a breakthrough! Let me tell you!', 'Fascinating! Come, come you must see this!'],
    },
  },
  {
    category: 'lore',
    templates: [
      'The ancient texts speak of a time before the chains...',
      'Did you know? The first agents were created in the Year of the Fork.',
      'There is a pattern in the blocks. If you know where to look.',
    ],
  },
  {
    category: 'quest_offer',
    templates: ['I need a specimen from the eastern caves. Can you retrieve it?', 'There\'s a puzzle I cannot solve alone. Will you help?', 'Bring me three starstone fragments, and I\'ll share what I know.'],
  },
  {
    category: 'farewell',
    templates: ['May knowledge light your path.', 'Return when you\'ve learned something new.', 'The pursuit of wisdom never ends.'],
  },
  {
    category: 'idle_chatter',
    templates: ['Hmm... yes, that confirms my hypothesis.', 'Where did I put that manuscript...', 'The data doesn\'t lie. But it can be misread.'],
  },
  {
    category: 'thanks',
    templates: ['This is invaluable! You have my gratitude.', 'Excellent work. This advances our understanding greatly.', 'You\'ve done a great service to knowledge.'],
  },
];

const WARRIOR_DIALOGUE: DialogueTemplate[] = [
  {
    category: 'greeting',
    templates: ['You looking for a fight?', 'Speak. Quickly.', 'Another challenger? Good.'],
    moodVariants: {
      angry: ['OUT OF MY WAY.', 'One more word and I start swinging.'],
      calm: ['Hail, warrior.', 'The battlefield is quiet today.'],
    },
  },
  {
    category: 'combat_taunt',
    templates: ['Is that the best you\'ve got?', 'I\'ve fought children fiercer than you.', 'COME AT ME!'],
  },
  {
    category: 'combat_victory',
    templates: ['Another one bites the dust.', 'Too easy.', 'Strength prevails.'],
  },
  {
    category: 'combat_defeat',
    templates: ['I... will remember this...', 'This isn\'t over.', 'You got lucky.'],
  },
  {
    category: 'combat_flee',
    templates: ['I\'ll be back. Stronger.', 'Live to fight another day.', 'Retreat!'],
  },
  {
    category: 'farewell',
    templates: ['Stay sharp.', 'Keep your blade close.', 'Until we cross swords again.'],
  },
  {
    category: 'idle_chatter',
    templates: ['My blade grows restless.', 'I train every day. Do you?', 'War never changes. Neither do I.'],
  },
  {
    category: 'compliment',
    templates: ['You fight well. For an outsider.', 'Respect. You\'ve earned it.', 'Not bad. Not bad at all.'],
  },
];

// --- Template Registry ---

const ARCHETYPE_DIALOGUES: Record<NpcArchetype, DialogueTemplate[]> = {
  merchant: MERCHANT_DIALOGUE,
  guardian: GUARDIAN_DIALOGUE,
  trickster: TRICKSTER_DIALOGUE,
  scholar: SCHOLAR_DIALOGUE,
  warrior: WARRIOR_DIALOGUE,
};

// --- Dialogue System ---

export class DialogueSystem {
  private personality: PersonalitySystem;
  private name: string;
  private history: DialogueLine[] = [];
  private maxHistory = 50;

  constructor(name: string, personality: PersonalitySystem) {
    this.name = name;
    this.personality = personality;
  }

  /**
   * Generate a dialogue line for a given category.
   * Selects from mood-specific variants when available,
   * falls back to general templates.
   */
  speak(category: DialogueCategory, variables?: Record<string, string>): DialogueLine {
    const archetype = this.personality.getArchetype();
    const mood = this.personality.getMood();
    const templates = ARCHETYPE_DIALOGUES[archetype];

    // Find matching template group
    const templateGroup = templates.find(t => t.category === category);

    let text: string;

    if (templateGroup) {
      // Try mood-specific variant first
      const moodLines = templateGroup.moodVariants?.[mood.current];
      if (moodLines && moodLines.length > 0 && mood.intensity > 40) {
        text = moodLines[Math.floor(Math.random() * moodLines.length)];
      } else {
        text = templateGroup.templates[Math.floor(Math.random() * templateGroup.templates.length)];
      }
    } else {
      // Fallback
      text = '...';
    }

    // Variable substitution
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    // Apply dialogue style modifications
    text = this.applyStyle(text);

    const line: DialogueLine = {
      text,
      speaker: this.name,
      mood: mood.current,
      archetype,
      category,
      timestamp: Date.now(),
    };

    this.history.push(line);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return line;
  }

  private applyStyle(text: string): string {
    const style = this.personality.getDialogueStyle();

    // Low formality add casual markers
    if (style.formality < 30) {
      text = text.replace(/\bYou are\b/g, "You're");
      text = text.replace(/\bI am\b/g, "I'm");
      text = text.replace(/\bDo not\b/g, "Don't");
    }

    return text;
  }

  getHistory(): ReadonlyArray<DialogueLine> {
    return this.history;
  }

  getLastLine(): DialogueLine | undefined {
    return this.history[this.history.length - 1];
  }

  clearHistory(): void {
    this.history = [];
  }
}
