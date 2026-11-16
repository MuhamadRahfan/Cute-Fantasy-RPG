import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;

    // Dark semi-transparent overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0).setInteractive();

    // Pause Dialog Box
    const box = this.add.graphics();
    const boxW = 170;
    const boxH = 200;
    box.fillStyle(0x131a24, 0.96);
    box.fillRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 6);
    box.lineStyle(2, 0xf0c674, 1);
    box.strokeRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 6);

    this.add.text(width / 2, height / 2 - 88, 'GAME PAUSED', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const startY = height / 2 - 58;
    const spacing = 27;

    this.createButton(width / 2, startY, 'LANJUTKAN', () => {
      this.resumeWorld();
    });

    this.createButton(width / 2, startY + spacing, 'TAS', () => {
      this.openOverlay('InventoryScene');
    });

    this.createButton(width / 2, startY + spacing * 2, 'QUEST', () => {
      this.openOverlay('QuestScene');
    });

    this.createButton(width / 2, startY + spacing * 3, 'SIMPAN GAME', () => {
      this.saveProgress();
    });

    this.createButton(width / 2, startY + spacing * 4, 'MENU UTAMA', () => {
      const worldScene = this.scene.get('WorldScene');
      worldScene?.saveGame?.();
      this.scene.stop('WorldScene');
      this.scene.stop('UIScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    // ESC / P closes the pause menu.
    this.input.keyboard.on('keydown-ESC', () => this.resumeWorld());
    this.input.keyboard.on('keydown-P', () => this.resumeWorld());
    this.input.keyboard.on('keydown-I', () => this.openOverlay('InventoryScene'));
    this.input.keyboard.on('keydown-Q', () => this.openOverlay('QuestScene'));
  }

  resumeWorld() {
    const worldScene = this.scene.get('WorldScene');
    if (worldScene) {
      // Avoid immediately re-pausing from the same key press.
      worldScene.pauseLockedUntil = worldScene.game.loop.time + 300;
    }
    this.scene.resume('WorldScene');
    this.scene.stop();
  }

  openOverlay(sceneKey) {
    const worldScene = this.scene.get('WorldScene');
    if (!worldScene) return;

    this.scene.stop();
    if (sceneKey === 'InventoryScene') {
      worldScene.openInventory?.();
    } else {
      worldScene.openQuests?.();
    }
  }

  createButton(x, y, label, callback) {
    const btnW = 120;
    const btnH = 22;

    const bg = this.add.graphics();
    bg.fillStyle(0x232d3d, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
    bg.lineStyle(1, 0x4a5568, 1);
    bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);

    this.add.text(x, y, label, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', callback);
  }

  saveProgress() {
    const worldScene = this.scene.get('WorldScene');
    const saved = worldScene?.saveGame?.();

    const message = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 82,
      saved ? 'Data Tersimpan!' : 'Gagal menyimpan data.',
      {
        fontSize: '9px',
        color: saved ? '#2ec4b6' : '#ff8a80',
        fontFamily: 'monospace'
      }
    ).setOrigin(0.5);

    this.time.delayedCall(1400, () => message.destroy());
  }
}
