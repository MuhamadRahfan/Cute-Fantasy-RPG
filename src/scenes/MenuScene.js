import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background decoration - dark fantasy theme
    const bg = this.add.rectangle(0, 0, width, height, 0x121722).setOrigin(0);

    // Decorative terrain preview in background
    for (let x = 0; x < width; x += 16) {
      this.add.image(x, height - 16, 'tiles_grass_mid').setOrigin(0);
    }
    this.add.image(width / 2, height - 52, 'obj_tree').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(width / 2 - 80, height - 28, 'chicken', 0).setScale(1.2);
    this.add.image(width / 2 + 80, height - 28, 'cow', 0).setScale(1.2);

    // Title text with shadow
    const titleShadow = this.add.text(width / 2 + 1, 46, 'CUTE FANTASY RPG', {
      fontSize: '24px',
      color: '#1a1006',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const titleText = this.add.text(width / 2, 45, 'CUTE FANTASY RPG', {
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Floating bobbing title tween
    this.tweens.add({
      targets: [titleText, titleShadow],
      y: '+=4',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subText = this.add.text(width / 2, 72, '2D Open World Adventure', {
      fontSize: '11px',
      color: '#8abeb7',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Menu Buttons
    const startY = 105;
    const spacing = 28;

    this.createButton(width / 2, startY, 'NEW GAME', () => this.startNewGame());
    this.createButton(width / 2, startY + spacing, 'CONTINUE', () => this.continueGame());
    this.createButton(width / 2, startY + spacing * 2, 'SETTINGS', () => this.openSettings());
    this.createButton(width / 2, startY + spacing * 3, 'CREDITS', () => this.openCredits());

    // Play BGM safely on first user touch
    this.input.once('pointerdown', () => {
      this.playBGM();
    });
  }

  playBGM() {
    if (!this.sound.get('bgm_battle')) {
      try {
        const bgm = this.sound.add('bgm_battle', { loop: true, volume: 0.35 });
        bgm.play();
      } catch (e) {
        console.warn('[Audio] BGM start suppressed:', e);
      }
    }
  }

  createButton(x, y, text, callback) {
    const btnBox = this.add.graphics();
    const btnWidth = 140;
    const btnHeight = 22;

    const drawBox = (isHover) => {
      btnBox.clear();
      btnBox.fillStyle(isHover ? 0x2e3846 : 0x1e2530, 0.9);
      btnBox.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 4);
      btnBox.lineStyle(1, isHover ? 0xf0c674 : 0x4a5568, 1);
      btnBox.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 4);
    };

    drawBox(false);

    const btnText = this.add.text(x, y, text, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => drawBox(true));
    hitZone.on('pointerout', () => drawBox(false));
    hitZone.on('pointerdown', () => {
      this.playBGM();
      this.sound.play('player_attack', { volume: 0.3, rate: 1.4 });
      callback();
    });
  }

  startNewGame() {
    // Clear save flag or pass fresh state
    this.scene.start('WorldScene', { isNewGame: true });
    this.scene.start('UIScene');
  }

  continueGame() {
    let saveData = null;
    try {
      saveData = JSON.parse(localStorage.getItem('cute_fantasy_rpg_save') || 'null');
    } catch (e) {
      console.warn('[Save] Gagal membaca save:', e);
    }

    if (!saveData || !Number.isFinite(saveData.x) || !Number.isFinite(saveData.y)) {
      const message = this.add.text(this.scale.width / 2, this.scale.height - 60, 'Belum ada data save.', {
        fontSize: '10px',
        color: '#ff8a80',
        fontFamily: 'monospace'
      }).setOrigin(0.5);

      this.time.delayedCall(1500, () => message.destroy());
      return;
    }

    this.scene.start('WorldScene', { isNewGame: false, saveData });
    this.scene.start('UIScene');
  }

  openSettings() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a212d, 1);
    box.fillRoundedRect(width / 2 - 110, height / 2 - 60, 220, 120, 6);
    box.lineStyle(2, 0xf0c674, 1);
    box.strokeRoundedRect(width / 2 - 110, height / 2 - 60, 220, 120, 6);

    const title = this.add.text(width / 2, height / 2 - 45, 'PENGATURAN', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const info = this.add.text(width / 2, height / 2 - 15, 'BGM: 40% | SFX: 80%\nMode: Landscape Android', {
      fontSize: '11px',
      color: '#c5c8c6',
      align: 'center',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width / 2, height / 2 + 35, '[ TUTUP ]', {
      fontSize: '12px',
      color: '#81a2be',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      box.destroy();
      title.destroy();
      info.destroy();
      closeBtn.destroy();
    });
  }

  openCredits() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1a212d, 1);
    box.fillRoundedRect(width / 2 - 130, height / 2 - 70, 260, 140, 6);
    box.lineStyle(2, 0x8abeb7, 1);
    box.strokeRoundedRect(width / 2 - 130, height / 2 - 70, 260, 140, 6);

    const title = this.add.text(width / 2, height / 2 - 50, 'KREDIT PENGEMBANGAN', {
      fontSize: '13px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const info = this.add.text(width / 2, height / 2 - 10, 'Graphics: Caz Cute Fantasy RPG\nAudio: Leohpaz (Music & SFX)\nEngine: Phaser 3 + Vite + Capacitor', {
      fontSize: '10px',
      color: '#e0e0e0',
      align: 'center',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width / 2, height / 2 + 45, '[ KEMBALI ]', {
      fontSize: '12px',
      color: '#81a2be',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      box.destroy();
      title.destroy();
      info.destroy();
      closeBtn.destroy();
    });
  }
}
