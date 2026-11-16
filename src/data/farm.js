/**
 * Farming layout and crop timing.
 * Plot coordinates align with the centre tile of the six farmland beds.
 */
export const FARM_PLOTS = [
  { x: 88, y: 88 },
  { x: 136, y: 88 },
  { x: 184, y: 88 },
  { x: 88, y: 136 },
  { x: 136, y: 136 },
  { x: 184, y: 136 }
];

export const CROP_DATA = {
  turnip: {
    id: 'turnip',
    name: 'Lobak',
    seedItem: 'turnip_seed',
    harvestItem: 'turnip',
    // Milliseconds after planting for each visual stage.
    stageTimes: [0, 10000, 20000, 30000]
  }
};

export const READY_STAGE = 3;

export function getCropStage(plantedAt, now = Date.now()) {
  const elapsed = Math.max(0, now - plantedAt);
  const times = CROP_DATA.turnip.stageTimes;

  let stage = 0;
  for (let i = 0; i < times.length; i++) {
    if (elapsed >= times[i]) stage = i;
  }
  return stage;
}

export function getCropProgress(plantedAt, now = Date.now()) {
  const readyMs = CROP_DATA.turnip.stageTimes[READY_STAGE];
  if (readyMs <= 0) return 100;
  const elapsed = Math.max(0, now - plantedAt);
  return Math.min(100, Math.floor((elapsed / readyMs) * 100));
}
