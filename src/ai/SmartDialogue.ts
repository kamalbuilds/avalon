// ============================================================
// Avalon AI Smart Dialogue Engine
// Context-aware dialogue that references specific game state
// Makes NPCs feel truly intelligent by commenting on exact
// HP values, move choices, streaks, and economic situations
// ============================================================

import type { ChronosGameState } from '@/engine/chronos/ChronosEngine';
import type { ChronosMoveType } from '@/engine/chronos/moves';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';
import type { DialogueMoment } from './useNPCDialogue';

// --- Game Context for Dialogue Generation ---

export interface BattleContext {
  playerHp: number;
  playerMaxHp: number;
  aiHp: number;
  aiMaxHp: number;
  playerCoins: number;
  aiCoins: number;
  currentBlock: number;
  playerMovesInFlight: number;
  aiMovesInFlight: number;
  lastPlayerMove?: ChronosMoveType;
  lastAiMove?: ChronosMoveType;
  playerDamageDealt: number;
  aiDamageDealt: number;
  consecutivePlayerHits: number;
  consecutiveAiHits: number;
  totalMovesPlayed: number;
}

export function extractBattleContext(state: ChronosGameState): BattleContext {
  return {
    playerHp: state.player.hp,
    playerMaxHp: state.player.maxHp,
    aiHp: state.ai.hp,
    aiMaxHp: state.ai.maxHp,
    playerCoins: state.player.coins,
    aiCoins: state.ai.coins,
    currentBlock: state.currentBlock,
    playerMovesInFlight: state.movesInFlight.filter(m => m.owner === 'player').length,
    aiMovesInFlight: state.movesInFlight.filter(m => m.owner === 'ai').length,
    lastPlayerMove: undefined,
    lastAiMove: undefined,
    playerDamageDealt: state.playerStats.damageDealt,
    aiDamageDealt: state.aiStats.damageDealt,
    consecutivePlayerHits: 0,
    consecutiveAiHits: 0,
    totalMovesPlayed: state.playerStats.movesPlayed + state.aiStats.movesPlayed,
  };
}

// --- Personality-Aware Context Lines ---

type PersonalityStyle = 'merchant' | 'warrior' | 'trickster' | 'scholar' | 'guardian';

// A line generator takes context and returns a string
type LineFn = (ctx: BattleContext) => string;

interface ContextRule {
  condition: (ctx: BattleContext) => boolean;
  moments: DialogueMoment[];
  lines: Record<PersonalityStyle, LineFn[]>;
  priority: number;
}

const CONTEXT_RULES: ContextRule[] = [
  // --- Critical HP: AI nearly dead ---
  {
    condition: (ctx) => ctx.aiHp <= 15 && ctx.playerHp > 50,
    moments: ['low_hp', 'took_damage'],
    priority: 10,
    lines: {
      merchant: [
        (ctx) => `${ctx.aiHp} HP left and you still have ${ctx.playerHp}? I'm filing for bankruptcy.`,
        () => `This is the worst trade deal in the history of trade deals.`,
        () => `I'd offer you a discount to stop hitting me, but I can't afford it anymore.`,
      ],
      warrior: [
        (ctx) => `You think ${ctx.aiHp} HP stops me?! I've fought with LESS!`,
        () => `I'm bleeding out and I'm STILL not afraid of you!`,
        () => `One good hit is all I need. Just ONE.`,
      ],
      trickster: [
        (ctx) => `Okay okay, ${ctx.aiHp} HP is... fine. I've got a plan. Probably.`,
        () => `Plot twist incoming! ...I hope.`,
        () => `The underdog wins in every good story, right? RIGHT?`,
      ],
      scholar: [
        (ctx) => `${ctx.aiHp} HP. The probability of recovery is... low. But not zero.`,
        () => `I'm running out of data points to collect. And health.`,
        () => `Fascinating. I appear to be losing. Adjusting all parameters.`,
      ],
      guardian: [
        (ctx) => `The wall cracks... but ${ctx.aiHp} HP is enough. It must be.`,
        (ctx) => `I will hold. Even at ${ctx.aiHp}. I will hold.`,
        () => `You've broken through, but you haven't won. Not yet.`,
      ],
    },
  },

  // --- Player nearly dead ---
  {
    condition: (ctx) => ctx.playerHp <= 20 && ctx.aiHp > 40,
    moments: ['opponent_low_hp', 'dealt_damage'],
    priority: 10,
    lines: {
      merchant: [
        (ctx) => `${ctx.playerHp} HP? Your life insurance premium just skyrocketed.`,
        (ctx) => `I can smell the profit. You're down to ${ctx.playerHp} HP.`,
        (ctx) => `Going once... going twice... you're at ${ctx.playerHp} HP...`,
      ],
      warrior: [
        (ctx) => `${ctx.playerHp} HP! ONE MORE HIT!`,
        (ctx) => `I can feel it! You're at ${ctx.playerHp}! FALL!`,
        (ctx) => `${ctx.playerHp} HP and still standing? Not for long!`,
      ],
      trickster: [
        (ctx) => `Aww, only ${ctx.playerHp} HP left? This was fun while it lasted!`,
        (ctx) => `${ctx.playerHp} HP. Should I finish you fast or make it entertaining?`,
        () => `Your HP bar is basically a rounding error at this point.`,
      ],
      scholar: [
        (ctx) => `${ctx.playerHp} HP remaining. My model predicts 2 more exchanges.`,
        (ctx) => `At ${ctx.playerHp} HP, your viable strategies reduce to... desperation.`,
        (ctx) => `The data is conclusive. ${ctx.playerHp} HP is insufficient for victory.`,
      ],
      guardian: [
        (ctx) => `${ctx.playerHp} HP. Yield now, with dignity.`,
        (ctx) => `The battle is decided. You have ${ctx.playerHp} HP left.`,
        () => `Further resistance only extends the inevitable.`,
      ],
    },
  },

  // --- Both players low HP (tense moment) ---
  {
    condition: (ctx) => ctx.playerHp <= 30 && ctx.aiHp <= 30,
    moments: ['took_damage', 'dealt_damage', 'low_hp', 'opponent_low_hp'],
    priority: 12,
    lines: {
      merchant: [
        () => `We're both under 30 HP. This is a high-stakes auction now.`,
        (ctx) => `${ctx.aiHp} vs ${ctx.playerHp}. Next hit wins. Make it count.`,
        () => `This just became a zero-sum game. Literally.`,
      ],
      warrior: [
        () => `We're both bleeding! THIS is what battle should be!`,
        () => `Both under 30! Only one walks away!`,
        () => `NOW it gets real! No more games!`,
      ],
      trickster: [
        () => `Both nearly dead? This is the BEST kind of chaos!`,
        () => `One hit each! Who blinks first?`,
        () => `This is either my greatest comeback or my dumbest loss.`,
      ],
      scholar: [
        () => `Both below 30 HP. Pure game theory now. No room for error.`,
        () => `The variance is maximized. One move decides everything.`,
        () => `Fascinating endgame. Both of us on the razor's edge.`,
      ],
      guardian: [
        () => `Both wounded. Both standing. This is what honor looks like.`,
        () => `Under 30 HP each. The wall meets the storm.`,
        () => `A worthy battle. Let the final blow decide.`,
      ],
    },
  },

  // --- Expensive move detected ---
  {
    condition: (ctx) => ctx.lastPlayerMove === 'devastating_attack',
    moments: ['big_move_incoming'],
    priority: 8,
    lines: {
      merchant: [
        () => `A Devastating Attack? That's 3 coins you'll never see again.`,
        () => `Big spender! 50 damage incoming... in 6 blocks. That's an eternity.`,
        () => `You just invested 3 coins in a move I have 6 blocks to counter. Bad ROI.`,
      ],
      warrior: [
        () => `Devastating Attack? BRING IT! I'll take it and KEEP STANDING!`,
        () => `50 damage? I've eaten bigger hits for BREAKFAST!`,
        () => `6 blocks? That's 6 blocks to hit you THREE MORE TIMES!`,
      ],
      trickster: [
        () => `Ooh, Devastating Attack! Bold! Also... 6 blocks. I could make a sandwich.`,
        () => `50 damage in 6 blocks? I'll Counter that before my coffee gets cold.`,
        () => `That's adorable. You telegraphed your biggest move 6 blocks early.`,
      ],
      scholar: [
        () => `Devastating Attack: 50 damage, 6 block delay. Expected value is... questionable.`,
        () => `I have 6 blocks to prepare a response. Thank you for the advance notice.`,
        () => `The delay window gives me 4 counter-opportunities. Noted.`,
      ],
      guardian: [
        () => `Devastating Attack incoming. My shield is ready. It has been since block 1.`,
        () => `50 damage meets my shield. We'll see what survives.`,
        () => `6 blocks. More than enough time to prepare.`,
      ],
    },
  },

  // --- Player spamming quick strikes ---
  {
    condition: (ctx) => ctx.lastPlayerMove === 'quick_strike' && ctx.totalMovesPlayed > 4,
    moments: ['took_damage', 'shield_block'],
    priority: 6,
    lines: {
      merchant: [
        () => `Another Quick Strike? You're a penny-pincher. I respect the hustle.`,
        () => `Quick Strike again? The discount aisle of combat moves.`,
        () => `10 damage at a time. At this rate, I'll die of OLD AGE first.`,
      ],
      warrior: [
        () => `Quick Strike AGAIN?! Fight me for REAL!`,
        () => `10 damage? 10?! That's an insult, not an attack!`,
        () => `Stop poking me and throw a REAL punch!`,
      ],
      trickster: [
        (ctx) => `Quick Strike #${Math.ceil(ctx.totalMovesPlayed / 2)}? I see you have ONE strategy.`,
        () => `Quick Strike spam? Predictable. My FAVORITE kind of opponent.`,
        () => `You know there are other moves, right? Just checking.`,
      ],
      scholar: [
        () => `Another Quick Strike. Your pattern is... monotone.`,
        () => `Quick Strike frequency exceeds expected variance. You lack creativity.`,
        () => `10 damage again. My model has solved you.`,
      ],
      guardian: [
        () => `Quick Strike. Again. You are persistent. I am patient.`,
        () => `10 damage chipping away. Like water on stone. It will take ages.`,
        () => `The same move. Again. I expected more.`,
      ],
    },
  },

  // --- NPC is coin-rich and flexing ---
  {
    condition: (ctx) => ctx.aiCoins >= 8 && ctx.playerCoins <= 3,
    moments: ['coin_rich', 'dealt_damage'],
    priority: 7,
    lines: {
      merchant: [
        (ctx) => `${ctx.aiCoins} coins vs your ${ctx.playerCoins}. I can literally buy your defeat.`,
        (ctx) => `My treasury: ${ctx.aiCoins}. Yours: ${ctx.playerCoins}. The economy has spoken.`,
        (ctx) => `With ${ctx.aiCoins} coins, every move is on the table. You can barely afford a Quick Strike.`,
      ],
      warrior: [
        (ctx) => `${ctx.aiCoins} coins! EVERYTHING costs nothing when you're this rich!`,
        (ctx) => `You have ${ctx.playerCoins} coins? I have ${ctx.aiCoins}! OVERWHELMING FORCE!`,
        () => `Full war chest! Devastating Attacks ALL DAY!`,
      ],
      trickster: [
        (ctx) => `${ctx.aiCoins} coins over here... ${ctx.playerCoins} over there. Math isn't your friend.`,
        () => `I'm swimming in coins and you're counting pennies. Love it.`,
        (ctx) => `Pro tip: having ${ctx.playerCoins} coins is what we call "already lost."`,
      ],
      scholar: [
        (ctx) => `Resource asymmetry: ${ctx.aiCoins} to ${ctx.playerCoins}. The outcome is deterministic.`,
        (ctx) => `With ${ctx.aiCoins} coins, I have ${Math.floor(ctx.aiCoins / 3)} Devastating Attacks available. You have... concerns.`,
        (ctx) => `Economic advantage secured. ${ctx.aiCoins} vs ${ctx.playerCoins}. QED.`,
      ],
      guardian: [
        (ctx) => `${ctx.aiCoins} coins held in reserve. I choose when this ends.`,
        (ctx) => `Your ${ctx.playerCoins} coins limit you. My ${ctx.aiCoins} do not limit me.`,
        () => `The treasury is full. The final offensive begins now.`,
      ],
    },
  },

  // --- Player used Shield ---
  {
    condition: (ctx) => ctx.lastPlayerMove === 'shield',
    moments: ['player_shielding'],
    priority: 5,
    lines: {
      merchant: [
        () => `A Shield? That's 1 coin wasted on not attacking. Bad investment.`,
        () => `Defensive spending. No ROI on shields.`,
        () => `You paid 1 coin to delay the inevitable. Classic panic buy.`,
      ],
      warrior: [
        () => `SHIELDS ARE FOR THE WEAK! Drop it and FIGHT!`,
        () => `Hiding behind a Shield? Pathetic! I'll break it AND you!`,
        () => `A Shield just means I have time to charge a bigger attack!`,
      ],
      trickster: [
        () => `Oh no, a Shield! Whatever will I do? ...Wait 2 blocks. That's what.`,
        () => `Shield up? Cool. I'll just attack you AFTER it drops.`,
        () => `Shielding tells me you're scared. And scared players make mistakes.`,
      ],
      scholar: [
        () => `Shield deployed. Duration: 2 blocks. I'll simply wait.`,
        () => `A defensive move reveals your assessment of threat level. Interesting data.`,
        () => `Shield: the move people use when they've run out of ideas.`,
      ],
      guardian: [
        () => `A Shield. You mirror my style. But mine is better.`,
        () => `We both Shield now? This could take a while. I have patience.`,
        () => `Your Shield is temporary. My defense is a way of life.`,
      ],
    },
  },

  // --- Counter success ---
  {
    condition: (ctx) => ctx.lastAiMove === 'counter',
    moments: ['counter_success'],
    priority: 9,
    lines: {
      merchant: [
        () => `Counter-offer ACCEPTED. That's double damage on your investment.`,
        () => `You attacked into my Counter? Free damage. Best trade of the match.`,
        () => `Return to sender. With interest.`,
      ],
      warrior: [
        () => `COUNTERED! Your own strength turned against you!`,
        () => `READ YOU LIKE A SCROLL! Counter! CRUSH!`,
        () => `That's what happens when you attack without THINKING!`,
      ],
      trickster: [
        () => `GOTCHA! Counter! Your face right now is priceless!`,
        () => `Did you really not see the Counter coming? Really?!`,
        () => `I KNEW you'd attack! Counter! Too easy!`,
      ],
      scholar: [
        () => `Counter executed. Your attack pattern was predictable to 94% confidence.`,
        () => `As calculated. Your move frequency data made this Counter trivial.`,
        () => `Double damage reflected. The model predicted this 3 blocks ago.`,
      ],
      guardian: [
        () => `The Counter holds. Your aggression is your weakness.`,
        () => `Patience. Counter. Justice. In that order.`,
        () => `You struck. I countered. As it should be.`,
      ],
    },
  },

  // --- Early game ---
  {
    condition: (ctx) => ctx.totalMovesPlayed <= 3,
    moments: ['match_start', 'dealt_damage', 'took_damage'],
    priority: 3,
    lines: {
      merchant: [
        () => `Opening moves are like first investments. Let's see your portfolio strategy.`,
        () => `The market just opened. Feeling each other out.`,
        () => `Early game. Low cost trades. The real spending comes later.`,
      ],
      warrior: [
        () => `Warming up! The real pain starts NOW!`,
        () => `Opening round! Let's see what you've got!`,
        () => `Just getting started! Don't bore me!`,
      ],
      trickster: [
        () => `Testing, testing... let's see your patterns!`,
        () => `Early game data collection! Keep showing me your moves!`,
        () => `The fun is just beginning! Show me everything!`,
      ],
      scholar: [
        () => `Data collection phase. 3 more exchanges before my model converges.`,
        () => `Early observations: cataloguing your move preferences.`,
        () => `Insufficient data for prediction. Continue.`,
      ],
      guardian: [
        () => `The first blows are exchanged. I am patient.`,
        () => `Testing defenses. Both mine and yours.`,
        () => `We begin. Let the battle reveal its shape.`,
      ],
    },
  },

  // --- Domination: AI way ahead ---
  {
    condition: (ctx) => (ctx.aiHp - ctx.playerHp) > 40,
    moments: ['dominating', 'dealt_damage'],
    priority: 8,
    lines: {
      merchant: [
        (ctx) => `I'm up by ${ctx.aiHp - ctx.playerHp} HP. Your stock is in freefall.`,
        (ctx) => `${ctx.aiHp} vs ${ctx.playerHp}. The spread is getting embarrassing.`,
        () => `At this rate, I could stop attacking and win on the clock.`,
      ],
      warrior: [
        (ctx) => `${ctx.aiHp - ctx.playerHp} HP advantage! This is a MASSACRE!`,
        () => `You call this a fight?! I'm barely scratched!`,
        () => `The gap widens! SUBMIT!`,
      ],
      trickster: [
        (ctx) => `Up by ${ctx.aiHp - ctx.playerHp} HP? Am I even trying? (Yes. Yes I am.)`,
        (ctx) => `${ctx.playerHp} HP? That's not a health bar, that's a countdown.`,
        () => `Should I let you get a few hits in? ...Nah.`,
      ],
      scholar: [
        (ctx) => `HP differential: +${ctx.aiHp - ctx.playerHp}. Victory probability: 97.3%.`,
        (ctx) => `Your remaining HP (${ctx.playerHp}) is insufficient to mount a comeback.`,
        () => `The model shows no scenario where you recover from this deficit.`,
      ],
      guardian: [
        (ctx) => `The wall holds at ${ctx.aiHp}. You crumble at ${ctx.playerHp}.`,
        (ctx) => `${ctx.aiHp - ctx.playerHp} HP advantage. This was decided long ago.`,
        () => `Yield. There is no shame in accepting the superior defense.`,
      ],
    },
  },
];

// --- Smart Dialogue Generator ---

export function getSmartDialogue(
  npc: ChronosNPCProfile,
  moment: DialogueMoment,
  context: BattleContext
): string | null {
  const style = npc.archetype as PersonalityStyle;

  // Find all matching rules for this moment and context
  const matches = CONTEXT_RULES
    .filter(rule => rule.moments.includes(moment) && rule.condition(context))
    .sort((a, b) => b.priority - a.priority);

  if (matches.length === 0) return null;

  // Pick from highest priority rule
  const topRule = matches[0];
  const lineFns = topRule.lines[style];
  if (!lineFns || lineFns.length === 0) return null;

  const lineFn = lineFns[Math.floor(Math.random() * lineFns.length)];
  return lineFn(context);
}

// --- Fallback integration ---

export function getSmartOrFallback(
  npc: ChronosNPCProfile,
  moment: DialogueMoment,
  context: BattleContext | null,
  fallbackFn: (moment: DialogueMoment) => string
): string {
  if (context) {
    const smart = getSmartDialogue(npc, moment, context);
    if (smart) return smart;
  }
  return fallbackFn(moment);
}
