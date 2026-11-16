/**
 * Item definitions. Icons are drawn procedurally by InventoryScene,
 * so no extra image files are required.
 */
export const ITEMS = {
  potion: {
    id: 'potion',
    name: 'Ramuan Herbal',
    type: 'consumable',
    description: 'Memulihkan 2 HP.',
    heal: 2,
    color: 0xe63946,
    icon: 'R'
  },
  turnip: {
    id: 'turnip',
    name: 'Lobak Segar',
    type: 'consumable',
    description: 'Memulihkan 1 HP. Hasil panen kebun desa.',
    heal: 1,
    color: 0xf0c674,
    icon: 'L'
  },
  slime_gel: {
    id: 'slime_gel',
    name: 'Gel Slime',
    type: 'material',
    description: 'Bahan lengket dari slime hutan.',
    color: 0x2ec4b6,
    icon: 'G'
  },
  bone: {
    id: 'bone',
    name: 'Tulang Kuno',
    type: 'material',
    description: 'Tulang dari penjaga reruntuhan.',
    color: 0xe0e0e0,
    icon: 'T'
  },
  turnip_seed: {
    id: 'turnip_seed',
    name: 'Bibit Lobak',
    type: 'seed',
    description: 'Tanam di lahan yang sudah dicangkul.',
    color: 0x8abeb7,
    icon: 'B'
  }
};
