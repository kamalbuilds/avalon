// ============================================================
// Avalon AI — Behavior Tree
// Selector, Sequence, and Leaf nodes for NPC decision-making
// Composable tree structure that drives agent behavior
// ============================================================

import type { AgentPerception, AgentMemory, AgentDecision, AgentAction } from './AgentCore';

// --- Node Status ---

export type NodeStatus = 'success' | 'failure' | 'running';

// --- Base Node ---

export interface BehaviorNode {
  name: string;
  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus;
  reset(): void;
}

// --- Leaf Nodes ---

export type ConditionFn = (perception: AgentPerception, memory: AgentMemory) => boolean;
export type ActionFn = (perception: AgentPerception, memory: AgentMemory) => NodeStatus;

/** Leaf node that checks a condition — returns success or failure */
export class ConditionNode implements BehaviorNode {
  readonly name: string;
  private condition: ConditionFn;

  constructor(name: string, condition: ConditionFn) {
    this.name = name;
    this.condition = condition;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    return this.condition(perception, memory) ? 'success' : 'failure';
  }

  reset(): void {}
}

/** Leaf node that executes an action — can return running for multi-tick actions */
export class ActionNode implements BehaviorNode {
  readonly name: string;
  private action: ActionFn;

  constructor(name: string, action: ActionFn) {
    this.name = name;
    this.action = action;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    return this.action(perception, memory);
  }

  reset(): void {}
}

// --- Composite Nodes ---

/**
 * Sequence — runs children left-to-right.
 * Fails immediately on first child failure.
 * Succeeds when all children succeed.
 * Resumes from last running child.
 */
export class SequenceNode implements BehaviorNode {
  readonly name: string;
  private children: BehaviorNode[];
  private currentChild = 0;

  constructor(name: string, children: BehaviorNode[]) {
    this.name = name;
    this.children = children;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick(perception, memory);

      if (status === 'failure') {
        this.currentChild = 0;
        return 'failure';
      }
      if (status === 'running') {
        return 'running';
      }

      // success — move to next child
      this.currentChild++;
    }

    this.currentChild = 0;
    return 'success';
  }

  reset(): void {
    this.currentChild = 0;
    for (const child of this.children) child.reset();
  }
}

/**
 * Selector — runs children left-to-right.
 * Succeeds immediately on first child success.
 * Fails when all children fail.
 * Resumes from last running child.
 */
export class SelectorNode implements BehaviorNode {
  readonly name: string;
  private children: BehaviorNode[];
  private currentChild = 0;

  constructor(name: string, children: BehaviorNode[]) {
    this.name = name;
    this.children = children;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    while (this.currentChild < this.children.length) {
      const status = this.children[this.currentChild].tick(perception, memory);

      if (status === 'success') {
        this.currentChild = 0;
        return 'success';
      }
      if (status === 'running') {
        return 'running';
      }

      // failure — try next child
      this.currentChild++;
    }

    this.currentChild = 0;
    return 'failure';
  }

  reset(): void {
    this.currentChild = 0;
    for (const child of this.children) child.reset();
  }
}

// --- Decorator Nodes ---

/** Inverts the result of a child node */
export class InverterNode implements BehaviorNode {
  readonly name: string;
  private child: BehaviorNode;

  constructor(name: string, child: BehaviorNode) {
    this.name = name;
    this.child = child;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    const status = this.child.tick(perception, memory);
    if (status === 'success') return 'failure';
    if (status === 'failure') return 'success';
    return 'running';
  }

  reset(): void {
    this.child.reset();
  }
}

/** Repeats a child node N times or until failure */
export class RepeatNode implements BehaviorNode {
  readonly name: string;
  private child: BehaviorNode;
  private maxRepeats: number;
  private count = 0;

  constructor(name: string, child: BehaviorNode, maxRepeats: number) {
    this.name = name;
    this.child = child;
    this.maxRepeats = maxRepeats;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    if (this.count >= this.maxRepeats) {
      this.count = 0;
      return 'success';
    }

    const status = this.child.tick(perception, memory);
    if (status === 'failure') {
      this.count = 0;
      return 'failure';
    }
    if (status === 'success') {
      this.count++;
      if (this.count >= this.maxRepeats) {
        this.count = 0;
        return 'success';
      }
      return 'running';
    }
    return 'running';
  }

  reset(): void {
    this.count = 0;
    this.child.reset();
  }
}

/** Always succeeds regardless of child outcome */
export class AlwaysSucceedNode implements BehaviorNode {
  readonly name: string;
  private child: BehaviorNode;

  constructor(name: string, child: BehaviorNode) {
    this.name = name;
    this.child = child;
  }

  tick(perception: AgentPerception, memory: AgentMemory): NodeStatus {
    this.child.tick(perception, memory);
    return 'success';
  }

  reset(): void {
    this.child.reset();
  }
}

// --- Decision Result Node ---

/** Leaf node that produces an AgentDecision and stores it on a shared context */
export class DecisionNode implements BehaviorNode {
  readonly name: string;
  private action: AgentAction;
  private priority: number;
  private confidence: number;
  private reasoning: string;
  private targetFn?: (perception: AgentPerception) => string | undefined;
  private positionFn?: (perception: AgentPerception) => { x: number; y: number } | undefined;

  // Shared output — read by the BehaviorTreeRunner
  lastDecision: AgentDecision | null = null;

  constructor(config: {
    name: string;
    action: AgentAction;
    priority: number;
    confidence: number;
    reasoning: string;
    targetFn?: (perception: AgentPerception) => string | undefined;
    positionFn?: (perception: AgentPerception) => { x: number; y: number } | undefined;
  }) {
    this.name = config.name;
    this.action = config.action;
    this.priority = config.priority;
    this.confidence = config.confidence;
    this.reasoning = config.reasoning;
    this.targetFn = config.targetFn;
    this.positionFn = config.positionFn;
  }

  tick(perception: AgentPerception): NodeStatus {
    this.lastDecision = {
      action: this.action,
      target: this.targetFn?.(perception),
      position: this.positionFn?.(perception),
      priority: this.priority,
      confidence: this.confidence,
      reasoning: this.reasoning,
    };
    return 'success';
  }

  reset(): void {
    this.lastDecision = null;
  }
}

// --- Behavior Tree Runner ---

export class BehaviorTreeRunner {
  private root: BehaviorNode;
  private decisionNodes: DecisionNode[] = [];

  constructor(root: BehaviorNode) {
    this.root = root;
    this.collectDecisionNodes(root);
  }

  private collectDecisionNodes(node: BehaviorNode): void {
    if (node instanceof DecisionNode) {
      this.decisionNodes.push(node);
    }
    // Walk composite children
    if (node instanceof SequenceNode || node instanceof SelectorNode) {
      const children = (node as unknown as { children: BehaviorNode[] }).children;
      if (children) {
        for (const child of children) this.collectDecisionNodes(child);
      }
    }
    // Walk decorator child
    if (node instanceof InverterNode || node instanceof RepeatNode || node instanceof AlwaysSucceedNode) {
      const child = (node as unknown as { child: BehaviorNode }).child;
      if (child) this.collectDecisionNodes(child);
    }
  }

  run(perception: AgentPerception, memory: AgentMemory): AgentDecision {
    // Reset all decision nodes
    for (const dn of this.decisionNodes) dn.reset();

    // Tick the tree
    this.root.tick(perception, memory);

    // Find the best decision from all decision nodes that fired
    let best: AgentDecision | null = null;
    for (const dn of this.decisionNodes) {
      if (dn.lastDecision && (!best || dn.lastDecision.priority > best.priority)) {
        best = dn.lastDecision;
      }
    }

    return best ?? {
      action: 'idle',
      priority: 0,
      confidence: 1,
      reasoning: 'No behavior tree node produced a decision',
    };
  }

  reset(): void {
    this.root.reset();
  }
}
