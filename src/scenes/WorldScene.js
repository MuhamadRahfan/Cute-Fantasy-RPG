import Phaser from 'phaser';
import Player from '../entities/Player.js';
import GameState from '../systems/GameState.js';
import { TILE_SIZE } from '../config/gameConfig.js';
import { AUDIO_KEYS } from '../data/gameData.js';
import { NPCS } from '../data/npcs.js';
import { FARM_PLOTS, READY_STAGE, getCropStage, getCropProgress } from '../data/farm.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { getDialogue } from '../data/dialogues.js';

export const MAP_COLS = 64;
export const MAP_ROWS = 48;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE; // 1024 px
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE; // 768 px

const SAVE_KEY = 'cute_fantasy_rpg_save';
const DOOR_X = 15 * TILE_SIZE;
const DOOR_Y = 12 * TILE_SIZE;

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  init(data) {
    this.isNewGame = data.isNewGame !== false;
    this.saveData = data.saveData || null;
    this.uiBusy = false;
    this.uiLockedUntil = 0;
    this.lastPromptKey = null;
    this.nextFarmRefresh = 0;
  }

  create() {
    // Persistent RPG state (inventory, quests, farm, gold, flags).
    this.state = new GameState(this.saveData?.state || null, {
      legacyChestOpen: this.saveData?.chestOpen
    });
    this.registry.set('gameState', this.state);

    // Configure world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Obstacle collision group for trees, walls, fences, and water
    this.obstacles = this.physics.add.staticGroup();

    // Build the fantasy terrain and world layout
    this.buildWorldTerrain();

    // Spawn player in the village center or at the saved position
    const spawnX = Number.isFinite(this.saveData?.x) ? this.saveData.x : 240;
    const spawnY = Number.isFinite(this.saveData?.y) ? this.saveData.y : 220;
    this.player = new Player(this, spawnX, spawnY);
    this.player.spawnPoint = { x: 240, y: 220 };

    if (this.saveData && Number.isFinite(this.saveData.hp)) {
      this.player.hp = Phaser.Math.Clamp(this.saveData.hp, 1, this.player.maxHp);
    }

    // Player collides with world obstacles
    this.physics.add.collider(this.player, this.obstacles);

    // Setup Camera follow with smooth lerp and world boundaries
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player, true, 0.09, 0.09);
    camera.setRoundPixels(true);

    // Keyboard cursors as desktop/debug fallback
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E,J,K,ESC,P,Q,I');

    // Village NPCs, farmland plots, ambient animals and monsters
    this.spawnNPCs();
    this.spawnFarmPlots();
    this.spawnAnimals();
    this.spawnEnemies();

    // Setup audio manager helper
    this.soundManager = {
      play: (key, cfg) => {
        try {
          if (this.sound.get(key)) {
            this.sound.play(key, cfg);
          }
        } catch (e) {
          console.warn(`[SafeAudio] play suppressed for ${key}:`, e);
        }
      }
    };

    // Listen to touch inputs from UIScene
    this.moveVector = { x: 0, y: 0 };
    this.attackTriggered = false;

    const ui = this.scene.get('UIScene');
    this.uiHandlers = {
      move: (vec) => { this.moveVector = vec; },
      attack: () => { this.attackTriggered = true; },
      interact: () => { this.handleInteraction(); }
    };

    ui?.events?.on('joystick:move', this.uiHandlers.move);
    ui?.events?.on('button:attack', this.uiHandlers.attack);
    ui?.events?.on('button:interact', this.uiHandlers.interact);

    // Remove cross-scene listeners when this scene restarts.
    this.events.once('shutdown', () => {
      ui?.events?.off('joystick:move', this.uiHandlers.move);
      ui?.events?.off('button:attack', this.uiHandlers.attack);
      ui?.events?.off('button:interact', this.uiHandlers.interact);
      this.events.off('player:attack', this.onPlayerAttack);
    });

    this.refreshUI();

    // Create a baseline save immediately so CONTINUE works even on a quick exit.
    if (this.isNewGame) {
      this.saveGame();
    }
  }

  buildWorldTerrain() {
    // 1. Fill ground with base grass tiles
    for (let c = 0; c < MAP_COLS; c++) {
      for (let r = 0; r < MAP_ROWS; r++) {
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, 'tiles_grass_mid').setOrigin(0).setDepth(0);
      }
    }

    // 2. Farmland area in top-left (cols 4..12, rows 4..10)
    for (let c = 4; c < 12; c += 3) {
      for (let r = 4; r < 10; r += 3) {
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, 'tiles_farmland').setOrigin(0).setDepth(1);
      }
    }

    // 3. Sandy beach along the bottom edge (rows 43..47)
    for (let c = 0; c < MAP_COLS; c += 5) {
      for (let r = 43; r < MAP_ROWS; r += 3) {
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, 'tiles_beach').setOrigin(0).setDepth(1);
      }
    }

    // 4. North cliff ridge (rows 0..3)
    for (let c = 0; c < MAP_COLS; c += 3) {
      this.add.image(c * TILE_SIZE, 0, 'tiles_cliff').setOrigin(0).setDepth(1);
      const obs = this.obstacles.create(c * TILE_SIZE + 24, 24, null);
      obs.setSize(48, 48).setVisible(false);
    }

    // 5. Dirt path network connecting village to bridge
    for (let c = 10; c < 38; c++) {
      this.add.image(c * TILE_SIZE, 14 * TILE_SIZE, 'tiles_path_mid').setOrigin(0).setDepth(1);
    }
    for (let r = 10; r < 24; r++) {
      this.add.image(18 * TILE_SIZE, r * TILE_SIZE, 'tiles_path_mid').setOrigin(0).setDepth(1);
    }

    // 6. River flowing north-to-south (cols 38..42)
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 38; c < 43; c++) {
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, 'tiles_water_mid').setOrigin(0).setDepth(1);
      }
      // Add collision on river banks except near bridge (row 13..15)
      if (r < 12 || r > 16) {
        const waterObs = this.obstacles.create(40 * TILE_SIZE, r * TILE_SIZE + 8, null);
        waterObs.setSize(TILE_SIZE * 5, TILE_SIZE).setVisible(false);
      }
    }

    // 7. Wood Bridge across the river (col 37, row 13)
    this.add.image(36 * TILE_SIZE, 13 * TILE_SIZE, 'obj_bridge').setOrigin(0).setDepth(2);

    // 8. Blue-roof Village House (col 12, row 7)
    const house = this.add.image(12 * TILE_SIZE, 7 * TILE_SIZE, 'obj_house').setOrigin(0);
    house.setDepth(house.y + house.height);
    // House solid wall collision (bottom half)
    const houseObs = this.obstacles.create(15 * TILE_SIZE, 12 * TILE_SIZE, null);
    houseObs.setSize(80, 48).setVisible(false);

    // 9. Farm Fences enclosing the farm pen (rows 4..11, cols 3..14)
    for (let c = 3; c <= 13; c += 4) {
      const fence = this.add.image(c * TILE_SIZE, 11 * TILE_SIZE, 'obj_fences').setOrigin(0);
      fence.setDepth(fence.y + fence.height);
      const fenceObs = this.obstacles.create(c * TILE_SIZE + 32, 11 * TILE_SIZE + 32, null);
      fenceObs.setSize(64, 20).setVisible(false);
    }

    // 10. Chest in front of the house
    this.chest = this.physics.add.staticSprite(18 * TILE_SIZE, 13 * TILE_SIZE, 'obj_chest');
    this.chest.setDepth(this.chest.y + 8);
    this.chest.isOpen = Boolean(this.state.chestOpened);
    if (this.chest.isOpen) {
      this.chest.setTint(0xf0c674);
    }
    this.obstacles.add(this.chest);

    // 11. Oak Trees placed in groves with realistic trunk collision
    const treePositions = [
      { x: 50, y: 70 }, { x: 90, y: 60 }, { x: 300, y: 80 }, { x: 340, y: 120 },
      { x: 120, y: 280 }, { x: 160, y: 320 }, { x: 280, y: 340 }, { x: 340, y: 300 },
      // Forest across the river
      { x: 740, y: 100 }, { x: 800, y: 80 }, { x: 860, y: 140 }, { x: 780, y: 220 },
      { x: 880, y: 280 }, { x: 760, y: 380 }, { x: 840, y: 440 }, { x: 920, y: 400 }
    ];

    treePositions.forEach((pos) => {
      const tree = this.add.image(pos.x, pos.y, 'obj_tree').setOrigin(0.5, 0.9);
      // Depth = bottom of the sprite, so the player can walk behind the canopy.
      tree.setDepth(pos.y + tree.height * 0.1);
      // Trunk collision at the base of the tree
      const trunk = this.obstacles.create(pos.x, pos.y - 8, null);
      trunk.setSize(20, 16).setVisible(false);
    });

    // 12. Decorative flowers and rocks
    const decorPositions = [
      { x: 180, y: 180 }, { x: 260, y: 170 }, { x: 220, y: 260 },
      { x: 480, y: 210 }, { x: 540, y: 290 }, { x: 700, y: 190 }
    ];
    decorPositions.forEach((d) => {
      this.add.image(d.x, d.y, 'obj_decor').setOrigin(0, 0).setCrop(0, 0, 16, 16).setDepth(d.y + 16);
    });
  }

  spawnNPCs() {
    this.npcs = this.physics.add.staticGroup();
    this.npcEntries = NPCS.map((data) => {
      const npc = this.npcs.create(data.x, data.y, 'player', 0);
      npc.setFlipX(Boolean(data.flipX));
      npc.setTint(data.tint ?? 0xffffff);
      npc.setDepth(data.y + 10);
      npc.setSize(12, 12).setOffset(10, 18);
      npc.refreshBody();
      npc.npcId = data.id;
      npc.npcName = data.name;
      npc.anims.play('player_idle_down', true);

      const label = this.add.text(data.x, data.y - 22, data.name, {
        fontSize: '7px',
        color: '#ffe8b3',
        fontFamily: 'monospace',
        backgroundColor: '#131a24aa',
        padding: { left: 3, right: 3, top: 1, bottom: 1 }
      }).setOrigin(0.5, 1).setDepth(data.y + 11);

      return { npc, label };
    });

    this.physics.add.collider(this.player, this.npcs);
  }

  spawnFarmPlots() {
    this.farmPlots = FARM_PLOTS.map((plot, index) => {
      const graphics = this.add.graphics();
      graphics.setPosition(plot.x, plot.y);
      graphics.setDepth(2);

      return {
        id: String(index),
        x: plot.x,
        y: plot.y,
        graphics
      };
    });

    this.updateFarmVisuals();
  }

  updateFarmVisuals() {
    const now = Date.now();

    for (const plot of this.farmPlots) {
      const g = plot.graphics;
      g.clear();

      // Tilled soil marker on top of the existing farmland tile.
      g.fillStyle(0x5a3d24, 0.6);
      g.fillRoundedRect(-7, -7, 14, 14, 2);
      g.lineStyle(1, 0x8a6642, 0.85);
      g.strokeRoundedRect(-7, -7, 14, 14, 2);

      const crop = this.state.farmPlots[plot.id];
      if (!crop) continue;

      const stage = getCropStage(crop.plantedAt, now);

      if (stage === 0) {
        g.fillStyle(0xd9b44a, 1);
        g.fillRect(-1, 1, 2, 2);
        continue;
      }

      if (stage === 1) {
        g.lineStyle(2, 0x6fbf73, 1);
        g.beginPath();
        g.moveTo(0, 3);
        g.lineTo(0, -2);
        g.strokePath();
        g.fillStyle(0x8fd694, 1);
        g.fillCircle(-2, -2, 1.5);
        continue;
      }

      if (stage === 2) {
        g.lineStyle(2, 0x5faf64, 1);
        g.beginPath();
        g.moveTo(0, 3);
        g.lineTo(0, -5);
        g.strokePath();
        g.fillStyle(0x8fd694, 1);
        g.fillCircle(-3, -4, 2);
        g.fillCircle(3, -5, 2);
        continue;
      }

      // Ready to harvest.
      g.fillStyle(0xf3e5cf, 1);
      g.fillCircle(0, 2, 4);
      g.lineStyle(1, 0xffffff, 0.7);
      g.strokeCircle(0, 2, 4);
      g.fillStyle(0x6fbf73, 1);
      g.fillCircle(-3, -4, 2);
      g.fillCircle(3, -4, 2);
      g.fillCircle(0, -6, 2);
    }
  }

  spawnAnimals() {
    this.animals = this.physics.add.group();

    const animalData = [
      { type: 'chicken', x: 80, y: 160 },
      { type: 'chicken', x: 110, y: 176 },
      { type: 'cow', x: 96, y: 196 },
      { type: 'pig', x: 150, y: 164 },
      { type: 'sheep', x: 142, y: 198 }
    ];

    animalData.forEach((a) => {
      const sprite = this.animals.create(a.x, a.y, a.type);
      sprite.setSize(16, 14).setOffset(8, 12);
      sprite.setCollideWorldBounds(true);
      sprite.setDepth(a.y);
      sprite.anims.play(`${a.type}_idle`, true);

      // Autonomous gentle wandering
      this.time.addEvent({
        delay: Phaser.Math.Between(2500, 5000),
        loop: true,
        callback: () => {
          if (!sprite.active) return;
          if (Math.random() < 0.5) {
            const vx = Phaser.Math.Between(-20, 20);
            const vy = Phaser.Math.Between(-20, 20);
            sprite.setVelocity(vx, vy);
            sprite.anims.play(`${a.type}_walk`, true);
            if (vx !== 0) sprite.setFlipX(vx < 0);
          } else {
            sprite.setVelocity(0, 0);
            sprite.anims.play(`${a.type}_idle`, true);
          }
          sprite.setDepth(sprite.y);
        }
      });
    });

    this.physics.add.collider(this.animals, this.obstacles);
    this.physics.add.collider(this.player, this.animals);
  }

  spawnEnemies() {
    this.enemies = this.physics.add.group();

    // Slimes in the eastern forest
    const slimePositions = [
      { x: 720, y: 200 },
      { x: 780, y: 260 },
      { x: 840, y: 180 },
      { x: 800, y: 340 }
    ];

    slimePositions.forEach((pos) => {
      const slime = this.enemies.create(pos.x, pos.y, 'slime');
      slime.setSize(18, 14).setOffset(7, 12);
      slime.setCollideWorldBounds(true);
      slime.setDepth(pos.y);
      slime.hp = 3;
      slime.enemyType = 'slime';
      slime.anims.play('slime_idle', true);
      slime.isDying = false;
      slime.stunnedUntil = 0;

      // Simple AI wander & aggro logic
      slime.nextHopTime = 0;
      slime.updateAI = (time, player) => {
        if (!slime.active || slime.isDying || this.time.now < slime.stunnedUntil) return;
        slime.setDepth(slime.y);

        if (player.isDead) {
          slime.setVelocity(0, 0);
          slime.anims.play('slime_idle', true);
          return;
        }

        const dist = Phaser.Math.Distance.Between(slime.x, slime.y, player.x, player.y);

        if (dist < 110) {
          // Chase player
          const angle = Phaser.Math.Angle.Between(slime.x, slime.y, player.x, player.y);
          slime.setVelocity(Math.cos(angle) * 45, Math.sin(angle) * 45);
          slime.anims.play('slime_hop', true);
          slime.setFlipX(player.x < slime.x);
        } else if (time > slime.nextHopTime) {
          // Idle hop
          slime.nextHopTime = time + Phaser.Math.Between(2000, 4000);
          if (Math.random() < 0.6) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            slime.setVelocity(Math.cos(angle) * 25, Math.sin(angle) * 25);
            slime.anims.play('slime_hop', true);
          } else {
            slime.setVelocity(0, 0);
            slime.anims.play('slime_idle', true);
          }
        }
      };
    });

    // Skeleton guard near the ruins
    const skeleton = this.enemies.create(860, 220, 'skeleton');
    skeleton.setSize(16, 16).setOffset(8, 14);
    skeleton.setCollideWorldBounds(true);
    skeleton.setDepth(220);
    skeleton.hp = 5;
    skeleton.enemyType = 'skeleton';
    skeleton.anims.play('skeleton_idle_down', true);
    skeleton.isDying = false;
    skeleton.stunnedUntil = 0;

    skeleton.updateAI = (time, player) => {
      if (!skeleton.active || skeleton.isDying || this.time.now < skeleton.stunnedUntil) return;
      skeleton.setDepth(skeleton.y);

      if (player.isDead) {
        skeleton.setVelocity(0, 0);
        skeleton.anims.play('skeleton_idle_down', true);
        return;
      }

      const dist = Phaser.Math.Distance.Between(skeleton.x, skeleton.y, player.x, player.y);

      if (dist < 130) {
        const angle = Phaser.Math.Angle.Between(skeleton.x, skeleton.y, player.x, player.y);
        skeleton.setVelocity(Math.cos(angle) * 50, Math.sin(angle) * 50);
        skeleton.anims.play('skeleton_walk_down', true);
        skeleton.setFlipX(player.x < skeleton.x);
      } else {
        skeleton.setVelocity(0, 0);
        skeleton.anims.play('skeleton_idle_down', true);
      }
    };

    this.physics.add.collider(this.enemies, this.obstacles);

    // Enemy touches player -> damages player
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (player.active && enemy.active && !enemy.isDying) {
        player.takeDamage(1, enemy.x, enemy.y);
      }
    });

    // Listen to player attack broadcast
    this.onPlayerAttack = (atk) => this.checkCombatHits(atk);
    this.events.on('player:attack', this.onPlayerAttack);
  }

  checkCombatHits(atk) {
    // Attack reach box based on facing direction
    let hitX = atk.x;
    let hitY = atk.y;
    const reach = 22;

    if (atk.direction === 'right') hitX += reach;
    else if (atk.direction === 'left') hitX -= reach;
    else if (atk.direction === 'up') hitY -= reach;
    else if (atk.direction === 'down') hitY += reach;

    const hitRect = new Phaser.Geom.Rectangle(hitX - 14, hitY - 14, 28, 28);
    let hitAny = false;

    this.enemies.children.each((enemy) => {
      if (!enemy.active || enemy.isDying) return;
      if (Phaser.Geom.Rectangle.Overlaps(hitRect, enemy.getBounds())) {
        hitAny = true;
        enemy.hp -= atk.damage;

        // Sound & visual hit feedback
        this.soundManager.play(AUDIO_KEYS.SWORD_HIT, { volume: 0.8 });
        enemy.setTint(0xffffff);
        this.cameras.main.shake(80, 0.004);

        // Pause AI briefly so the knockback is actually visible.
        enemy.stunnedUntil = this.time.now + 200;

        // Knockback enemy
        const kbAngle = Phaser.Math.Angle.Between(atk.x, atk.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(kbAngle) * 140, Math.sin(kbAngle) * 140);

        this.time.delayedCall(120, () => {
          if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
          this.defeatEnemy(enemy);
        }
      }
    });

    if (!hitAny) {
      this.soundManager.play(AUDIO_KEYS.SWORD_MISS, { volume: 0.5 });
    }
  }

  defeatEnemy(enemy) {
    if (enemy.isDying) return;

    enemy.isDying = true;
    this.soundManager.play(AUDIO_KEYS.ENEMY_DEATH, { volume: 0.85 });
    enemy.setVelocity(0, 0);
    if (enemy.body) enemy.body.enable = false;

    const deathAnim = enemy.enemyType === 'slime' ? 'slime_death' : 'skeleton_death';
    enemy.anims.play(deathAnim, true);

    this.events.emit('enemy:defeated', enemy.enemyType);
    this.grantEnemyRewards(enemy.enemyType);

    this.tweens.add({
      targets: enemy,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        enemy.destroy();
      }
    });
  }

  grantEnemyRewards(enemyType) {
    const isSlime = enemyType === 'slime';
    const drops = isSlime
      ? [{ id: 'slime_gel', chance: 1 }, { id: 'potion', chance: 0.15 }]
      : [{ id: 'bone', chance: 1 }, { id: 'potion', chance: 0.2 }];

    const gained = [];
    for (const drop of drops) {
      if (Math.random() > drop.chance) continue;
      if (this.state.addItem(drop.id, 1)) {
        gained.push(`${ITEMS[drop.id]?.name || drop.id} x1`);
      }
    }

    const gold = isSlime ? 2 : 4;
    this.state.gold += gold;
    this.applyTrack('kill', enemyType, 1);

    if (gained.length > 0) {
      this.events.emit('ui:notify', `${gained.join(', ')}  +${gold} koin`);
    }

    this.refreshUI();
    this.saveGame();
  }

  getNearbyInteraction() {
    const playerX = this.player.x;
    const playerY = this.player.y;
    let best = null;

    const consider = (type, object, maxDistance, label) => {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, object.x, object.y);
      if (distance > maxDistance) return;
      if (best && best.distance <= distance) return;
      best = { type, object, distance, label };
    };

    if (this.chest && !this.state.chestOpened) {
      consider('chest', this.chest, 34, 'Buka peti');
    }

    consider('door', { x: DOOR_X, y: DOOR_Y }, 36, 'Periksa pintu');

    for (const entry of this.npcEntries || []) {
      consider('npc', entry.npc, 42, `Bicara dengan ${entry.npc.npcName}`);
    }

    for (const plot of this.farmPlots || []) {
      const crop = this.state.farmPlots[plot.id];
      if (!crop) {
        consider('plot', plot, 26, 'Cangkul & tanam bibit');
        continue;
      }

      const stage = getCropStage(crop.plantedAt);
      consider(
        'plot',
        plot,
        26,
        stage >= READY_STAGE ? 'Panen Lobak' : 'Lihat tanaman'
      );
    }

    return best;
  }

  updateInteractionPrompt() {
    const nearby = this.getNearbyInteraction();
    const key = nearby
      ? `${nearby.type}|${nearby.object.id ?? nearby.object.npcId ?? ''}|${nearby.label}`
      : '';

    if (key === this.lastPromptKey) return;
    this.lastPromptKey = key;
    this.events.emit('ui:prompt', nearby ? `ACT: ${nearby.label}` : '');
  }

  handleInteraction() {
    if (this.uiBusy || this.game.loop.time < this.uiLockedUntil) return;

    const nearby = this.getNearbyInteraction();
    if (!nearby) {
      this.events.emit('ui:notify', 'Tidak ada objek di dekatmu.');
      return;
    }

    if (nearby.type === 'chest') {
      this.openChest();
      return;
    }

    if (nearby.type === 'door') {
      this.soundManager.play(AUDIO_KEYS.DOOR_OPEN, { volume: 0.9 });
      this.events.emit('ui:notify', 'Pintu Rumah Terkunci dengan Rapi.');
      return;
    }

    if (nearby.type === 'npc') {
      this.openDialog(nearby.object);
      return;
    }

    if (nearby.type === 'plot') {
      this.interactPlot(nearby.object);
    }
  }

  openChest() {
    if (this.state.chestOpened) {
      this.events.emit('ui:notify', 'Peti ini sudah kosong.');
      return;
    }

    this.state.chestOpened = true;
    this.state.addItem('potion', 1);
    this.state.addItem('turnip_seed', 3);
    this.state.gold += 5;

    this.chest.isOpen = true;
    this.chest.setTint(0xf0c674);
    this.soundManager.play(AUDIO_KEYS.CHEST_OPEN, { volume: 0.9 });
    this.events.emit('ui:notify', 'Peti: Ramuan Herbal x1, Bibit Lobak x3, 5 koin!');

    this.lastPromptKey = null;
    this.refreshUI();
    this.saveGame();
  }

  interactPlot(plot) {
    const crop = this.state.farmPlots[plot.id];

    if (!crop) {
      if (!this.state.hasItem('turnip_seed', 1)) {
        this.events.emit('ui:notify', 'Butuh Bibit Lobak untuk menanam.');
        return;
      }

      this.state.removeItem('turnip_seed', 1);
      this.state.farmPlots[plot.id] = {
        crop: 'turnip',
        plantedAt: Date.now()
      };
      this.events.emit('ui:notify', 'Menanam Bibit Lobak. Panen dalam ~30 detik.');
      this.updateFarmVisuals();
      this.refreshUI();
      this.saveGame();
      return;
    }

    const stage = getCropStage(crop.plantedAt);
    if (stage < READY_STAGE) {
      const progress = getCropProgress(crop.plantedAt);
      this.events.emit('ui:notify', `Lobak sedang tumbuh (${progress}%).`);
      return;
    }

    delete this.state.farmPlots[plot.id];
    this.state.addItem('turnip', 1);
    this.soundManager.play(AUDIO_KEYS.CHEST_OPEN, { volume: 0.5 });
    this.events.emit('ui:notify', 'Panen Lobak x1!');
    this.applyTrack('harvest', 'turnip', 1);
    this.updateFarmVisuals();
    this.refreshUI();
    this.saveGame();
  }

  openDialog(npc) {
    const dialogue = getDialogue(npc.npcId, this.state);

    this.uiBusy = true;
    this.events.emit('ui:prompt', '');
    this.scene.launch('DialogScene', {
      name: npc.npcName,
      lines: dialogue.lines,
      actions: dialogue.actions
    });
    this.scene.pause();
  }

  onDialogClosed(actions = []) {
    this.applyDialogActions(actions);
    this.uiBusy = false;
    this.uiLockedUntil = this.game.loop.time + 250;
    this.lastPromptKey = null;
    this.scene.resume();
    this.refreshUI();
    this.saveGame();
  }

  applyDialogActions(actions = []) {
    for (const action of actions) {
      if (action.type === 'startQuest') {
        if (this.state.startQuest(action.id)) {
          const quest = QUESTS[action.id];
          this.events.emit('ui:notify', `Quest baru: ${quest?.title || action.id}`);
        }
        continue;
      }

      if (action.type === 'track') {
        this.applyTrack(action.kind, action.target, action.amount || 1);
        continue;
      }

      if (action.type === 'giveItem') {
        if (action.once && this.state.flags[action.once]) continue;
        if (!this.state.addItem(action.id, action.amount || 1)) continue;

        if (action.once) this.state.flags[action.once] = true;
        const item = ITEMS[action.id];
        this.events.emit(
          'ui:notify',
          `Mendapat ${item?.name || action.id} x${action.amount || 1}.`
        );
      }
    }
  }

  applyTrack(type, target, amount = 1) {
    const completed = this.state.track(type, target, amount);
    for (const quest of completed) {
      this.soundManager.play(AUDIO_KEYS.CHEST_OPEN, { volume: 0.6 });
      this.events.emit('ui:notify', `Quest selesai: ${quest.title}!`);
    }
    return completed;
  }

  openInventory() {
    if (this.uiBusy) return;
    this.uiBusy = true;
    this.lastPromptKey = null;
    this.events.emit('ui:prompt', '');
    this.scene.launch('InventoryScene');
    this.scene.pause();
  }

  onInventoryClosed() {
    this.uiBusy = false;
    this.uiLockedUntil = this.game.loop.time + 250;
    this.lastPromptKey = null;
    this.scene.resume();
    this.refreshUI();
  }

  openQuests() {
    if (this.uiBusy) return;
    this.uiBusy = true;
    this.lastPromptKey = null;
    this.events.emit('ui:prompt', '');
    this.scene.launch('QuestScene');
    this.scene.pause();
  }

  onQuestClosed() {
    this.uiBusy = false;
    this.uiLockedUntil = this.game.loop.time + 250;
    this.lastPromptKey = null;
    this.scene.resume();
    this.refreshUI();
  }

  refreshUI() {
    if (this.player) {
      this.events.emit('player:healthChanged', this.player.hp, this.player.maxHp);
    }
    this.events.emit('ui:refresh');
  }

  saveGame() {
    if (!this.player || !this.state) return false;

    const data = {
      version: 2,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      hp: this.player.hp,
      chestOpen: this.state.chestOpened,
      state: this.state.serialize(),
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('[Save] Gagal menyimpan game:', error);
      return false;
    }
  }

  update(time, delta) {
    if (this.player && this.player.active && !this.uiBusy) {
      // Desktop / keyboard fallback controls.
      if (this.keys) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.I) && time >= this.uiLockedUntil) {
          this.openInventory();
          return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && time >= this.uiLockedUntil) {
          this.openQuests();
          return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.J)) {
          this.attackTriggered = true;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.K)) {
          this.handleInteraction();
        }

        const pausePressed = Phaser.Input.Keyboard.JustDown(this.keys.ESC) ||
          Phaser.Input.Keyboard.JustDown(this.keys.P);
        if (pausePressed && time > (this.pauseLockedUntil || 0)) {
          this.saveGame();
          this.scene.pause();
          this.scene.launch('PauseScene');
          return;
        }
      }

      this.updateInteractionPrompt();
      this.player.update(this.moveVector, this.attackTriggered);
    }
    this.attackTriggered = false;

    // Refresh crop visuals a few times per second so growth is visible.
    if (time > this.nextFarmRefresh) {
      this.nextFarmRefresh = time + 500;
      this.updateFarmVisuals();
    }

    // Update enemies AI
    if (this.enemies) {
      this.enemies.children.each((enemy) => {
        if (enemy.active && enemy.updateAI) {
          enemy.updateAI(time, this.player);
        }
      });
    }
  }
}
