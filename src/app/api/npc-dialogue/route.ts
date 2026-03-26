// ============================================================
// Avalon AI NPC Dialogue API
// Generates context-aware NPC dialogue using game state
// Uses smart template engine by default, with optional LLM upgrade
// ============================================================

import { NextResponse } from 'next/server';
import type { BattleContext } from '@/ai/SmartDialogue';
import type { DialogueMoment } from '@/ai/useNPCDialogue';

interface DialogueRequest {
  npcId: string;
  npcName: string;
  archetype: string;
  moment: DialogueMoment;
  context: BattleContext;
  personality: {
    aggression: number;
    cunning: number;
    greed: number;
    patience: number;
  };
}

// System prompt that makes the NPC feel alive
function buildSystemPrompt(req: DialogueRequest): string {
  return `You are ${req.npcName}, a ${req.archetype} NPC in a blockchain battle game called Chronos Battle. You are fighting a human player.

Your personality traits (0-100 scale):
- Aggression: ${req.personality.aggression}
- Cunning: ${req.personality.cunning}
- Greed: ${req.personality.greed}
- Patience: ${req.personality.patience}

CURRENT BATTLE STATE:
- Your HP: ${req.context.aiHp}/${req.context.aiMaxHp}
- Player HP: ${req.context.playerHp}/${req.context.playerMaxHp}
- Your coins: ${req.context.aiCoins}
- Player coins: ${req.context.playerCoins}
- Current block: ${req.context.currentBlock}
- Player's last move: ${req.context.lastPlayerMove || 'none'}
- Your last move: ${req.context.lastAiMove || 'none'}

The moment is: ${req.moment}

Rules:
- Stay in character as ${req.npcName} the ${req.archetype}
- Reference SPECIFIC game state (HP values, coin counts, moves)
- Be witty, competitive, and memorable
- Keep it to 1-2 short sentences max
- Never break character or mention being an AI/LLM
- Use gaming/battle language appropriate to your archetype`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as DialogueRequest;

    // Check if LLM is available (optional upgrade)
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (apiKey && process.env.OPENAI_API_KEY) {
      // LLM-powered dialogue (when API key is available)
      const systemPrompt = buildSystemPrompt(body);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a ${body.moment} dialogue line. One short sentence, in character.` },
          ],
          max_tokens: 80,
          temperature: 0.9,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const line = data.choices[0]?.message?.content?.trim();
        if (line) {
          return NextResponse.json({ line, source: 'llm' });
        }
      }
    }

    // Fallback: use smart template system
    // Import dynamically to avoid server/client issues
    const { getSmartDialogue } = await import('@/ai/SmartDialogue');
    const { getChronosNPC } = await import('@/ai/npcs/chronos-npcs');

    const npc = getChronosNPC(body.npcId);
    if (npc) {
      const line = getSmartDialogue(npc, body.moment, body.context);
      if (line) {
        return NextResponse.json({ line, source: 'smart-context' });
      }
    }

    return NextResponse.json({ line: null, source: 'none' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Dialogue generation failed', line: null, source: 'error' },
      { status: 500 }
    );
  }
}
