import { ITEMS } from '../data/items.js';
import { QUESTS } from '../data/quests.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * Persistent RPG state: inventory, quests, farm plots, gold, flags.
 * Kept free of Phaser imports so it can be unit-tested or reused.
 */
export default class GameState {
  constructor(saveState = null, options = {}) {
    this.inventory = {};
    this.quests = {};
    this.farmPlots = {};
    this.flags = {};
    this.gold = 0;
    this.chestOpened = false;

    const hasSave = Boolean(saveState);

    if (hasSave) {
      this.inventory = { ...(saveState.inventory || {}) };
      this.quests = clone(saveState.quests || {});
      this.farmPlots = clone(saveState.farmPlots || {});

      // Normalise quest progress in case objectives changed between versions.
      for (const [id, quest] of Object.entries(this.quests)) {
        const definition = QUESTS[id];
        if (!definition) continue;
        if (!Array.isArray(quest.progress)) quest.progress = [];
        while (quest.progress.length < definition.objectives.length) {
          quest.progress.push(0);
        }
      }
      this.flags = { ...(saveState.flags || {}) };
      this.gold = Number.isFinite(saveState.gold) ? saveState.gold : 0;
      this.chestOpened = Boolean(saveState.chestOpened);
    } else {
      this.addItem('potion', 1);
      // Starter seeds so the farming quest is never a dead end.
      this.addItem('turnip_seed', 3);
      this.startQuest('welcome');
      if (options.legacyChestOpen) {
        this.chestOpened = true;
      }
    }
  }

  addItem(id, amount = 1) {
    if (!ITEMS[id] || amount <= 0) return false;
    this.inventory[id] = (this.inventory[id] || 0) + amount;
    return true;
  }

  removeItem(id, amount = 1) {
    const current = this.inventory[id] || 0;
    if (current < amount) return false;

    const next = current - amount;
    if (next <= 0) delete this.inventory[id];
    else this.inventory[id] = next;
    return true;
  }

  countItem(id) {
    return this.inventory[id] || 0;
  }

  hasItem(id, amount = 1) {
    return this.countItem(id) >= amount;
  }

  getSlots() {
    return Object.entries(this.inventory)
      .filter(([id]) => Boolean(ITEMS[id]))
      .map(([id, qty]) => ({ ...ITEMS[id], qty }));
  }

  startQuest(id) {
    if (!QUESTS[id] || this.quests[id]) return false;
    this.quests[id] = {
      status: 'active',
      progress: QUESTS[id].objectives.map(() => 0)
    };
    return true;
  }

  isQuestActive(id) {
    return this.quests[id]?.status === 'active';
  }

  isQuestCompleted(id) {
    return this.quests[id]?.status === 'completed';
  }

  getQuestProgress(id, index = 0) {
    return this.quests[id]?.progress?.[index] || 0;
  }

  /**
   * Advance every active quest that matches the objective type/target.
   * Returns quest definitions that were completed by this call.
   */
  track(type, target, amount = 1) {
    const completed = [];

    for (const [id, state] of Object.entries(this.quests)) {
      if (state.status !== 'active') continue;

      const definition = QUESTS[id];
      if (!definition) continue;

      let changed = false;
      definition.objectives.forEach((objective, index) => {
        if (objective.type !== type || objective.target !== target) return;

        // Tolerate saves created before an objective existed.
        if (!Number.isFinite(state.progress[index])) {
          state.progress[index] = 0;
        }
        if (state.progress[index] >= objective.amount) return;

        state.progress[index] = Math.min(
          objective.amount,
          state.progress[index] + amount
        );
        changed = true;
      });

      if (!changed) continue;

      const finished = definition.objectives.every((objective, index) =>
        state.progress[index] >= objective.amount
      );

      if (finished) {
        this.completeQuest(id);
        completed.push(definition);
      }
    }

    return completed;
  }

  completeQuest(id) {
    const definition = QUESTS[id];
    const state = this.quests[id];
    if (!definition || !state || state.status !== 'active') return null;

    state.status = 'completed';

    if (definition.rewards?.gold) {
      this.gold += definition.rewards.gold;
    }

    if (definition.rewards?.items) {
      for (const [itemId, qty] of Object.entries(definition.rewards.items)) {
        this.addItem(itemId, qty);
      }
    }

    return definition;
  }

  getActiveQuestSummary() {
    for (const [id, state] of Object.entries(this.quests)) {
      if (state.status !== 'active') continue;

      const definition = QUESTS[id];
      if (!definition) continue;

      const index = definition.objectives.findIndex(
        (objective, i) => state.progress[i] < objective.amount
      );
      const objectiveIndex = index === -1 ? 0 : index;
      const objective = definition.objectives[objectiveIndex];

      return {
        id,
        title: definition.title,
        text: `${objective.label} (${state.progress[objectiveIndex]}/${objective.amount})`
      };
    }

    return null;
  }

  getQuestList() {
    return Object.entries(this.quests)
      .map(([id, state]) => {
        const definition = QUESTS[id];
        if (!definition) return null;

        return {
          id,
          title: definition.title,
          description: definition.description,
          status: state.status,
          objectives: definition.objectives.map((objective, index) => ({
            label: objective.label,
            current: state.progress[index],
            amount: objective.amount
          }))
        };
      })
      .filter(Boolean);
  }

  serialize() {
    return {
      inventory: { ...this.inventory },
      quests: clone(this.quests),
      farmPlots: clone(this.farmPlots),
      flags: { ...this.flags },
      gold: this.gold,
      chestOpened: this.chestOpened
    };
  }
}
