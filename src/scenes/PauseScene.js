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
    const boxW = 160;
    const boxH = 150;
    box.fillStyle(0x131a24, 0.95);
    box.fillRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 6);
    box.lineStyle(2, 0xf0c674, 1);
    box.strokeRoundedRect(width / 2 - boxW / 2, height / 2 - boxH / 2, boxW, boxH, 6);

    this.add.text(width / 2, height / 2 - 50, 'GAME PAUSED', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const startY = height / 2 - 15;
    const spacing = 28;

    this.createButton(width / 2, startY, 'LANJUTKAN', () => {
      this.resumeWorld();
    });

    this.createButton(width / 2, startY + spacing, 'SIMPAN GAME', () => {
      this.saveProgress();
    });

    this.createButton(width / 2, startY + spacing * 2, 'MENU UTAMA', () => {
      this.scene.stop('WorldScene');
      this.scene.stop('UIScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    // ESC / P closes the pause menu.
    this.input.keyboard.on('keydown-ESC', () => this.resumeWorld());
    this.input.keyboard.on('keydown-P', () => this.resumeWorld());
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

  createButton(x, y, label, callback) {
    const btnW = 110;
    const btnH = 22;

    const bg = this.add.graphics();
    bg.fillStyle(0x232d3d, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
    bg.lineStyle(1, 0x4a5568, 1);
    bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);

    const text = this.add.text(x, y, label, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', callback);
  }

  saveProgress() {
    const worldScene = this.scene.get('WorldScene');
    if (worldScene && worldScene.player) {
      const saveData = {
        x: Math.round(worldScene.player.x),
        y: Math.round(worldScene.player.y),
        hp: worldScene.player.hp,
        chestOpen: Boolean(worldScene.chest?.isOpen),
        timestamp: Date.now()
      };
      try {
        localStorage.setItem('cute_fantasy_rpg_save', JSON.stringify(saveData));
        const message = this.add.text(this.scale.width / 2, this.scale.height / 2 + 58, 'Data Tersimpan!', {
          fontSize: '9px',
          color: '#2ec4b6',
          fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.time.delayedCall(1400, () => message.destroy());
      } catch (e) {
        console.warn('Gagal menyimpan ke localStorage:', e);
      }
    }
  }
}
