import Phaser from 'phaser';

export default class QuestScene extends Phaser.Scene {
  constructor() {
    super('QuestScene');
  }

  create() {
    this.world = this.scene.get('WorldScene');
    this.state = this.registry.get('gameState');
    this.closed = false;

    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0)
      .setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x131a24, 0.98);
    panel.fillRoundedRect(40, 24, width - 80, height - 48, 7);
    panel.lineStyle(2, 0xf0c674, 1);
    panel.strokeRoundedRect(40, 24, width - 80, height - 48, 7);

    this.add.text(width / 2, 40, 'CATATAN QUEST', {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.createQuestList();

    this.createCloseButton(width / 2, height - 44);

    this.input.keyboard.on('keydown-Q', () => this.closeQuest());
    this.input.keyboard.on('keydown-ESC', () => this.closeQuest());
  }

  createQuestList() {
    const quests = this.state?.getQuestList() || [];
    let y = 62;

    if (quests.length === 0) {
      this.add.text(this.scale.width / 2, 130, 'Belum ada quest.', {
        fontSize: '10px',
        color: '#c5c8c6',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      return;
    }

    for (const quest of quests) {
      const completed = quest.status === 'completed';
      const color = completed ? '#2ec4b6' : '#ffd166';
      const status = completed ? 'SELESAI' : 'AKTIF';

      this.add.text(56, y, `${quest.title}  [${status}]`, {
        fontSize: '10px',
        color,
        fontStyle: 'bold',
        fontFamily: 'monospace'
      });
      y += 14;

      for (const objective of quest.objectives) {
        this.add.text(64, y, `- ${objective.label}: ${objective.current}/${objective.amount}`, {
          fontSize: '8px',
          color: completed ? '#8abeb7' : '#c5c8c6',
          fontFamily: 'monospace'
        });
        y += 11;
      }

      y += 5;
    }
  }

  createCloseButton(x, y) {
    const bg = this.add.graphics();
    bg.fillStyle(0x232d3d, 1);
    bg.fillRoundedRect(x - 45, y - 11, 90, 22, 4);
    bg.lineStyle(1, 0x8abeb7, 1);
    bg.strokeRoundedRect(x - 45, y - 11, 90, 22, 4);

    this.add.text(x, y, 'TUTUP', {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, 90, 22).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.closeQuest());
  }

  closeQuest() {
    if (this.closed) return;
    this.closed = true;

    if (this.world && typeof this.world.onQuestClosed === 'function') {
      this.world.onQuestClosed();
    }
    this.scene.stop();
  }
}
