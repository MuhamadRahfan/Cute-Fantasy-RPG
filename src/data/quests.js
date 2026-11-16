/**
 * Data-driven quest definitions.
 * Objective types currently supported: talk, kill, harvest.
 */
export const QUESTS = {
  welcome: {
    id: 'welcome',
    title: 'Sapaan Desa',
    description: 'Kepala Desa ingin menyambut petualang baru.',
    objectives: [
      { type: 'talk', target: 'elder', amount: 1, label: 'Bicara dengan Kepala Desa' }
    ],
    rewards: {
      gold: 10
    }
  },
  slime_hunt: {
    id: 'slime_hunt',
    title: 'Hama di Hutan',
    description: 'Slime mulai mengganggu ladang di seberang sungai.',
    objectives: [
      { type: 'kill', target: 'slime', amount: 4, label: 'Slime dikalahkan' }
    ],
    rewards: {
      gold: 25,
      items: { potion: 2 }
    }
  },
  first_harvest: {
    id: 'first_harvest',
    title: 'Panen Pertama',
    description: 'Pak Tani ingin melihat hasil kebun pertamamu.',
    objectives: [
      { type: 'harvest', target: 'turnip', amount: 3, label: 'Lobak dipanen' }
    ],
    rewards: {
      gold: 15,
      items: { turnip_seed: 3 }
    }
  }
};
