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

    // 2. Action buttons on bottom-right + top-right shortcuts
    this.createActionButtons(width, height);

    // 3. Top HUD: HP bar, gold and active quest tracker
    this.createHUD(width, height);
    this.createQuestTracker(width);

    // 4. Notification banner toast + interaction prompt
    this.createNotificationSystem(width, height);
    this.createInteractionPrompt(width, height);

    // Hook WorldScene events
    const worldScene = this.scene.get('WorldScene');
    this.worldScene = worldScene;

    if (worldScene) {
      this.onHealthChanged = (hp, maxHp) => this.updateHealthBar(hp, maxHp);
      this.onNotify = (msg) => this.showNotification(msg);
      this.onPrompt = (msg) => this.showPrompt(msg);
      this.onRefresh = () => this.syncWorldState();

      worldScene.events.on('player:healthChanged', this.onHealthChanged);
      worldScene.events.on('ui:notify', this.onNotify);
      worldScene.events.on('ui:prompt', this.onPrompt);
      worldScene.events.on('ui:refresh', this.onRefresh);

      // WorldScene is created before UIScene, so sync the initial state here.
      if (worldScene.player) {
        this.updateHealthBar(worldScene.player.hp, worldScene.player.maxHp);
      }
      this.syncWorldState();

      this.events.once('shutdown', () => {
        worldScene.events.off('player:healthChanged', this.onHealthChanged);
        worldScene.events.off('ui:notify', this.onNotify);
        worldScene.events.off('ui:prompt', this.onPrompt);
        worldScene.events.off('ui:refresh', this.onRefresh);
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

    // Quest log button
    this.createSmallButton(width - 92, 18, 'Q', () => {
      this.worldScene?.openQuests?.();
    });

    // Inventory button
    this.createSmallButton(width - 58, 18, 'TAS', () => {
      this.worldScene?.openInventory?.();
    });

    // Pause button on top-right
    this.createSmallButton(width - 24, 18, '||', () => {
      this.worldScene?.saveGame?.();
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
      fontSize: label.length > 1 ? 8 : 11,
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
    bgBox.fillStyle(0x0e131b, 0.78);
    bgBox.fillRoundedRect(0, 0, 110, 40, 4);
    bgBox.lineStyle(1, 0x3e4c5e, 1);
    bgBox.strokeRoundedRect(0, 0, 110, 40, 4);
    this.hudContainer.add(bgBox);

    this.hpText = this.add.text(8, 5, 'HP: 6/6', {
      fontSize: '10px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.hpText);

    this.hpBar = this.add.graphics();
    this.hudContainer.add(this.hpBar);

    this.goldText = this.add.text(8, 25, 'Koin: 0', {
      fontSize: '9px',
      color: '#ffd166',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.goldText);

    this.updateHealthBar(6, 6);
  }

  createQuestTracker(width) {
    this.questText = this.add.text(width - 12, 40, '', {
      fontSize: '8px',
      color: '#ffd166',
      align: 'right',
      fontFamily: 'monospace',
      backgroundColor: '#0e131bcc',
      padding: { left: 5, right: 5, top: 3, bottom: 3 },
      wordWrap: { width: 190, useAdvancedWrap: true }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.questText.on('pointerdown', () => {
      this.worldScene?.openQuests?.();
    });
    this.questText.setVisible(false);
  }

  updateHealthBar(hp, maxHp) {
    if (!this.hpBar || !this.hpText) return;
    this.hpText.setText(`HP: ${hp}/${maxHp}`);

    this.hpBar.clear();
    const barWidth = 48;
    const barHeight = 8;
    const barX = 54;
    const barY = 6;

    this.hpBar.fillStyle(0x333333, 0.9);
    this.hpBar.fillRect(barX, barY, barWidth, barHeight);

    const pct = Math.max(0, Math.min(1, hp / maxHp));
    const fillCol = pct > 0.5 ? 0x2ec4b6 : (pct > 0.25 ? 0xffb703 : 0xe63946);
    this.hpBar.fillStyle(fillCol, 1);
    this.hpBar.fillRect(barX, barY, barWidth * pct, barHeight);
  }

  syncWorldState() {
    const state = this.worldScene?.state || this.registry.get('gameState');
    if (!state) return;

    this.updateGold(state.gold);
    this.updateQuestTracker(state);
  }

  updateGold(gold) {
    if (!this.goldText) return;
    this.goldText.setText(`Koin: ${gold}`);
  }

  updateQuestTracker(state) {
    if (!this.questText) return;

    const summary = state.getActiveQuestSummary();
    if (!summary) {
      this.questText.setText('');
      this.questText.setVisible(false);
      return;
    }

    this.questText.setText(`QUEST: ${summary.title}\n${summary.text}`);
    this.questText.setVisible(true);
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

  createInteractionPrompt(width, height) {
    this.promptText = this.add.text(width / 2, height - 18, '', {
      fontSize: '9px',
      color: '#131a24',
      backgroundColor: '#ffd166ee',
      padding: { left: 7, right: 7, top: 3, bottom: 3 },
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
  }

  showPrompt(message) {
    if (!this.promptText) return;
    this.promptText.setText(message || '');
    this.promptText.setAlpha(message ? 1 : 0);
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
