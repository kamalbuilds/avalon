// ============================================================
// Avalon SDK — Entity System (ECS)
// Create, destroy, query entities and their components
// ============================================================

import { EventEmitter } from './EventEmitter';
import type {
  EntityId, EngineEntity, EngineEntityType, EngineComponent,
  ComponentName, PositionComp, HealthComp,
} from './types';

let nextEntityId = 0;
function generateEntityId(): EntityId {
  return `ent_${++nextEntityId}_${Date.now().toString(36)}`;
}

export class EntitySystem {
  private entities = new Map<EntityId, EngineEntity>();
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;
  }

  createEntity(type: EngineEntityType, components?: EngineComponent[]): EngineEntity {
    const entity: EngineEntity = {
      id: generateEntityId(),
      type,
      components: new Map(),
      active: true,
      createdAt: Date.now(),
    };

    if (components) {
      for (const comp of components) {
        entity.components.set(comp.name, comp);
      }
    }

    this.entities.set(entity.id, entity);
    this.events.emit('entity:created', { entityId: entity.id, type });
    return entity;
  }

  destroyEntity(id: EntityId): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    entity.active = false;
    this.entities.delete(id);
    this.events.emit('entity:destroyed', { entityId: id, type: entity.type });
    return true;
  }

  getEntity(id: EntityId): EngineEntity | undefined {
    return this.entities.get(id);
  }

  getComponent<T extends EngineComponent>(entityId: EntityId, name: ComponentName): T | undefined {
    return this.entities.get(entityId)?.components.get(name) as T | undefined;
  }

  setComponent(entityId: EntityId, component: EngineComponent): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    entity.components.set(component.name, component);
    return true;
  }

  removeComponent(entityId: EntityId, name: ComponentName): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    return entity.components.delete(name);
  }

  hasComponent(entityId: EntityId, name: ComponentName): boolean {
    return this.entities.get(entityId)?.components.has(name) ?? false;
  }

  getEntitiesByType(type: EngineEntityType): EngineEntity[] {
    const result: EngineEntity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type && entity.active) {
        result.push(entity);
      }
    }
    return result;
  }

  getEntitiesWithComponent(name: ComponentName): EngineEntity[] {
    const result: EngineEntity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.active && entity.components.has(name)) {
        result.push(entity);
      }
    }
    return result;
  }

  getEntitiesInRange(center: { x: number; y: number }, radius: number): EngineEntity[] {
    const result: EngineEntity[] = [];
    const r2 = radius * radius;

    for (const entity of this.entities.values()) {
      if (!entity.active) continue;
      const pos = entity.components.get('position') as PositionComp | undefined;
      if (!pos) continue;

      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      if (dx * dx + dy * dy <= r2) {
        result.push(entity);
      }
    }
    return result;
  }

  getAllEntities(): Map<EntityId, EngineEntity> {
    return new Map(this.entities);
  }

  getActiveCount(): number {
    let count = 0;
    for (const entity of this.entities.values()) {
      if (entity.active) count++;
    }
    return count;
  }

  clear(): void {
    this.entities.clear();
    nextEntityId = 0;
  }
}
