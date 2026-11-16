import Phaser from 'phaser';
import VirtualJoystick from '../systems/VirtualJoystick.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const { width, height } = this.scale;

    // 1. Virtual Joystick on bottom-left
    const joyX = 64;
    const joyY = height - 64;
    this.joystick = new VirtualJoystick(this, joyX, joyY, 44);

    // 2. Action buttons on bottom-right
    this.createActionButtons(width, height);

    // 3. Top HUD: HP hearts and title indicator
    this.createHUD(width, height);

    // 4. Notification banner toast
    this.createNotificationSystem(width, height);

    // Hook WorldScene events
    const worldScene = this.scene.get('WorldScene');
    if (worldScene) {
      this.onHealthChanged = (hp, maxHp) => this.updateHealthBar(hp, maxHp);
      this.onNotify = (msg) => this.showNotification(msg);

      worldScene.events.on('player:healthChanged', this.onHealthChanged);
      worldScene.events.on('ui:notify', this.onNotify);

      // The first health event is emitted before UIScene is created, so sync once here.
      if (worldScene.player) {
        this.updateHealthBar(worldScene.player.hp, worldScene.player.maxHp);
      }

      this.events.once('shutdown', () => {
        worldScene.events.off('player:healthChanged', this.onHealthChanged);
        worldScene.events.off('ui:notify', this.onNotify);
      });
    }
  }

  createActionButtons(width, height) {
    // Attack button (Primary, large)
    const atkX = width - 48;
    const atkY = height - 48;
    this.createRoundButton(atkX, atkY, 24, 'ATK', 0xe63946, () => {
      this.events.emit('button:attack');
    });

    // Interact button (Secondary)
    const actX = width - 96;
    const actY = height - 36;
    this.createRoundButton(actX, actY, 18, 'ACT', 0x457b9d, () => {
      this.events.emit('button:interact');
    });

    // Pause button on top-right
    const pauseX = width - 24;
    const pauseY = 18;
    this.createSmallButton(pauseX, pauseY, '||', () => {
      this.scene.pause('WorldScene');
      this.scene.launch('PauseScene');
    });
  }

  createRoundButton(x, y, radius, label, color, callback) {
    const btn = this.add.container(x, y);

    const circle = this.add.graphics();
    circle.fillStyle(color, 0.85);
    circle.fillCircle(0, 0, radius);
    circle.lineStyle(2, 0xffffff, 0.9);
    circle.strokeCircle(0, 0, radius);
    btn.add(circle);

    const text = this.add.text(0, 0, label, {
      fontSize: radius > 20 ? '11px' : '9px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    btn.add(text);

    const zone = this.add.zone(0, 0, radius * 2.2, radius * 2.2).setInteractive();
    btn.add(zone);

    zone.on('pointerdown', () => {
      btn.setScale(0.9);
      callback();
    });

    const release = () => btn.setScale(1);
    zone.on('pointerup', release);
    zone.on('pointerout', release);
  }

  createSmallButton(x, y, label, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(0x1d2d44, 0.85);
    bg.fillRoundedRect(x - 14, y - 12, 28, 24, 4);
    bg.lineStyle(1, 0x8abeb7, 0.9);
    bg.strokeRoundedRect(x - 14, y - 12, 28, 24, 4);

    this.add.text(x, y, label, {
      fontSize: '11px',
      color: '#f0c674',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, 32, 28).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', callback);
  }

  createHUD(width, height) {
    // Health bar container on top-left
    this.hudContainer = this.add.container(12, 12);

    const bgBox = this.add.graphics();
    bgBox.fillStyle(0x0e131b, 0.75);
    bgBox.fillRoundedRect(0, 0, 110, 24, 4);
    bgBox.lineStyle(1, 0x3e4c5e, 1);
    bgBox.strokeRoundedRect(0, 0, 110, 24, 4);
    this.hudContainer.add(bgBox);

    this.hpText = this.add.text(8, 6, 'HP: 6/6', {
      fontSize: '10px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.hpText);

    this.hpBar = this.add.graphics();
    this.hudContainer.add(this.hpBar);
    this.updateHealthBar(6, 6);
  }

  updateHealthBar(hp, maxHp) {
    if (!this.hpBar || !this.hpText) return;
    this.hpText.setText(`HP: ${hp}/${maxHp}`);

    this.hpBar.clear();
    const barWidth = 48;
    const barHeight = 8;
    const barX = 54;
    const barY = 8;

    this.hpBar.fillStyle(0x333333, 0.9);
    this.hpBar.fillRect(barX, barY, barWidth, barHeight);

    const pct = Math.max(0, Math.min(1, hp / maxHp));
    const fillCol = pct > 0.5 ? 0x2ec4b6 : (pct > 0.25 ? 0xffb703 : 0xe63946);
    this.hpBar.fillStyle(fillCol, 1);
    this.hpBar.fillRect(barX, barY, barWidth * pct, barHeight);
  }

  createNotificationSystem(width, height) {
    this.toastText = this.add.text(width / 2, 28, '', {
      fontSize: '10px',
      color: '#ffd166',
      backgroundColor: '#1b2330dd',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
      fontFamily: 'monospace'
    }).setOrigin(0.5).setAlpha(0);
  }

  showNotification(message) {
    if (!this.toastText) return;
    this.toastText.setText(message);
    this.toastText.setAlpha(1);

    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      duration: 800,
      delay: 1800
    });
  }

  update() {
    if (this.joystick) {
      const vec = this.joystick.getVector();
      this.events.emit('joystick:move', vec);
    }
  }
}
