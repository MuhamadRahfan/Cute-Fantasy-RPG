import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;

    // Loading UI
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x151b26, 0.8);
    progressBox.fillRoundedRect(width / 2 - 120, height / 2 - 10, 240, 20, 4);

    const titleText = this.add.text(width / 2, height / 2 - 35, 'CUTE FANTASY RPG', {
      fontSize: '16px',
      color: '#f0c674',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 25, 'Memuat aset 0%', {
      fontSize: '11px',
      color: '#8abeb7',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x81a2be, 1);
      progressBar.fillRoundedRect(width / 2 - 118, height / 2 - 8, 236 * value, 16, 3);
      percentText.setText(`Memuat aset ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      titleText.destroy();
    });

    // --- SPRITESHEETS ---
    this.load.spritesheet('player', 'assets/Graphics/Player/Player.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('player_actions', 'assets/Graphics/Player/Player_Actions.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('slime', 'assets/Graphics/Enemies/Slime_Green.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('skeleton', 'assets/Graphics/Enemies/Skeleton.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('chicken', 'assets/Graphics/Animals/Chicken/Chicken.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('cow', 'assets/Graphics/Animals/Cow/Cow.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('pig', 'assets/Graphics/Animals/Pig/Pig.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet('sheep', 'assets/Graphics/Animals/Sheep/Sheep.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // --- TILES ---
    this.load.image('tiles_grass_mid', 'assets/Graphics/Tiles/Grass_Middle.png');
    this.load.image('tiles_water_mid', 'assets/Graphics/Tiles/Water_Middle.png');
    this.load.image('tiles_path_mid', 'assets/Graphics/Tiles/Path_Middle.png');
    this.load.image('tiles_beach', 'assets/Graphics/Tiles/Beach_Tile.png');
    this.load.image('tiles_cliff', 'assets/Graphics/Tiles/Cliff_Tile.png');
    this.load.image('tiles_farmland', 'assets/Graphics/Tiles/FarmLand_Tile.png');
    this.load.image('tiles_path', 'assets/Graphics/Tiles/Path_Tile.png');
    this.load.image('tiles_water', 'assets/Graphics/Tiles/Water_Tile.png');

    // --- OBJECTS & DECORATION ---
    this.load.image('obj_house', 'assets/Graphics/Outdoor decoration/House_1_Wood_Base_Blue.png');
    this.load.image('obj_bridge', 'assets/Graphics/Outdoor decoration/Bridge_Wood.png');
    this.load.image('obj_chest', 'assets/Graphics/Outdoor decoration/Chest.png');
    this.load.image('obj_fences', 'assets/Graphics/Outdoor decoration/Fences.png');
    this.load.image('obj_tree', 'assets/Graphics/Outdoor decoration/Oak_Tree.png');
    this.load.image('obj_tree_small', 'assets/Graphics/Outdoor decoration/Oak_Tree_Small.png');
    this.load.image('obj_decor', 'assets/Graphics/Outdoor decoration/Outdoor_Decor_Free.png');

    // --- AUDIO (Safe Loading with Fallback) ---
    this.loadAudioSafe('bgm_battle', 'assets/Audio/Music/Fair_Fight_(Battle).wav');
    this.loadAudioSafe('player_attack', 'assets/Audio/Sound_Effects/07_human_atk_sword_1.wav');
    this.loadAudioSafe('sword_hit', 'assets/Audio/Sound_Effects/26_sword_hit_1.wav');
    this.loadAudioSafe('sword_miss', 'assets/Audio/Sound_Effects/27_sword_miss_1.wav');
    this.loadAudioSafe('player_dash', 'assets/Audio/Sound_Effects/15_human_dash_1.wav');
    this.loadAudioSafe('player_damage', 'assets/Audio/Sound_Effects/11_human_damage_1.wav');
    this.loadAudioSafe('player_death', 'assets/Audio/Sound_Effects/14_human_death_spin.wav');
    this.loadAudioSafe('chest_open', 'assets/Audio/Sound_Effects/01_chest_open_1.wav');
    this.loadAudioSafe('chest_close', 'assets/Audio/Sound_Effects/02_chest_close_1.wav');
    this.loadAudioSafe('door_open', 'assets/Audio/Sound_Effects/05_door_open_1.mp3');
    this.loadAudioSafe('door_close', 'assets/Audio/Sound_Effects/06_door_close_1.mp3');
    this.loadAudioSafe('enemy_damage', 'assets/Audio/Sound_Effects/21_orc_damage_1.wav');
    this.loadAudioSafe('enemy_death', 'assets/Audio/Sound_Effects/24_orc_death_spin.wav');
  }

  loadAudioSafe(key, path) {
    try {
      this.load.audio(key, path);
    } catch (e) {
      console.warn(`[SafeAudio] Warning loading audio ${key}:`, e);
    }
  }

  create() {
    this.createPlayerAnimations();
    this.createEnemyAnimations();
    this.createAnimalAnimations();

    // Proceed to Main Menu
    this.scene.start('MenuScene');
  }

  createPlayerAnimations() {
    const anims = this.anims;

    // Idle Animations (6 frames each)
    anims.create({
      key: 'player_idle_down',
      frames: anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'player_idle_right',
      frames: anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'player_idle_up',
      frames: anims.generateFrameNumbers('player', { start: 12, end: 17 }),
      frameRate: 6,
      repeat: -1
    });

    // Walk Animations (6 frames each)
    anims.create({
      key: 'player_walk_down',
      frames: anims.generateFrameNumbers('player', { start: 18, end: 23 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'player_walk_right',
      frames: anims.generateFrameNumbers('player', { start: 24, end: 29 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'player_walk_up',
      frames: anims.generateFrameNumbers('player', { start: 30, end: 35 }),
      frameRate: 8,
      repeat: -1
    });

    // Attack Animations (4 frames each)
    anims.create({
      key: 'player_attack_down',
      frames: anims.generateFrameNumbers('player', { start: 36, end: 39 }),
      frameRate: 12,
      repeat: 0
    });

    anims.create({
      key: 'player_attack_right',
      frames: anims.generateFrameNumbers('player', { start: 42, end: 45 }),
      frameRate: 12,
      repeat: 0
    });

    anims.create({
      key: 'player_attack_up',
      frames: anims.generateFrameNumbers('player', { start: 48, end: 51 }),
      frameRate: 12,
      repeat: 0
    });

    // Death Animation
    anims.create({
      key: 'player_death',
      frames: anims.generateFrameNumbers('player', { start: 54, end: 57 }),
      frameRate: 6,
      repeat: 0
    });
  }

  createEnemyAnimations() {
    const anims = this.anims;

    // Slime animations (32x32)
    anims.create({
      key: 'slime_idle',
      frames: anims.generateFrameNumbers('slime', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'slime_hop',
      frames: anims.generateFrameNumbers('slime', { start: 16, end: 19 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'slime_attack',
      frames: anims.generateFrameNumbers('slime', { start: 32, end: 36 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'slime_death',
      frames: anims.generateFrameNumbers('slime', { start: 64, end: 69 }),
      frameRate: 8,
      repeat: 0
    });

    // Skeleton animations (32x32)
    anims.create({
      key: 'skeleton_idle_down',
      frames: anims.generateFrameNumbers('skeleton', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'skeleton_walk_down',
      frames: anims.generateFrameNumbers('skeleton', { start: 18, end: 23 }),
      frameRate: 7,
      repeat: -1
    });

    anims.create({
      key: 'skeleton_attack_down',
      frames: anims.generateFrameNumbers('skeleton', { start: 36, end: 39 }),
      frameRate: 10,
      repeat: 0
    });

    anims.create({
      key: 'skeleton_death',
      frames: anims.generateFrameNumbers('skeleton', { start: 54, end: 57 }),
      frameRate: 6,
      repeat: 0
    });
  }

  createAnimalAnimations() {
    const anims = this.anims;

    // 4 frames each (2x2 grid of 32x32)
    ['chicken', 'cow', 'pig', 'sheep'].forEach((animal) => {
      anims.create({
        key: `${animal}_idle`,
        frames: anims.generateFrameNumbers(animal, { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1
      });
      anims.create({
        key: `${animal}_walk`,
        frames: anims.generateFrameNumbers(animal, { start: 2, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    });
  }
}
