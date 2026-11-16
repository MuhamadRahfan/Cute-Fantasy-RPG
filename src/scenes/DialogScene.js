import Phaser from 'phaser';

export default class DialogScene extends Phaser.Scene {
  constructor() {
    super('DialogScene');
  }

  init(data) {
    this.speaker = data.name || 'Penduduk';
    this.lines = Array.isArray(data.lines) && data.lines.length > 0
      ? data.lines
      : ['...'];
    this.actions = data.actions || [];
    this.lineIndex = 0;
    this.charIndex = 0;
    this.typing = false;
    this.closed = false;
  }

  create() {
    const { width, height } = this.scale;

    // Soft dim so the dialog reads clearly without hiding the world.
    this.add.rectangle(0, 0, width, height, 0x000000, 0.18)
      .setOrigin(0)
      .setInteractive();

    const panelX = 24;
    const panelY = height - 98;
    const panelW = width - 48;
    const panelH = 84;

    const panel = this.add.graphics();
    panel.fillStyle(0x131a24, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    panel.lineStyle(2, 0xf0c674, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    const nameBox = this.add.graphics();
    nameBox.fillStyle(0xf0c674, 1);
    nameBox.fillRoundedRect(panelX + 10, panelY - 10, 120, 18, 4);

    this.add.text(panelX + 16, panelY - 7, this.speaker, {
      fontSize: '9px',
      color: '#131a24',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });

    this.dialogueText = this.add.text(panelX + 14, panelY + 14, '', {
      fontSize: '10px',
      color: '#f2f2f2',
      fontFamily: 'monospace',
      wordWrap: { width: panelW - 28 },
      lineSpacing: 3
    });

    this.arrow = this.add.text(panelX + panelW - 18, panelY + panelH - 18, '▼', {
      fontSize: '9px',
      color: '#f0c674',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.arrow,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.timer = this.time.addEvent({
      delay: 18,
      loop: true,
      callback: this.tickTypewriter,
      callbackScope: this
    });

    this.showLine();

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown-E', () => this.advance());
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.input.keyboard.on('keydown-K', () => this.advance());
  }

  showLine() {
    this.fullText = this.lines[this.lineIndex] || '';
    this.charIndex = 0;
    this.typing = true;
    this.dialogueText.setText('');
  }

  tickTypewriter() {
    if (!this.typing) return;

    this.charIndex += 1;
    this.dialogueText.setText(this.fullText.slice(0, this.charIndex));

    if (this.charIndex >= this.fullText.length) {
      this.typing = false;
    }
  }

  advance() {
    if (this.closed) return;

    if (this.typing) {
      this.typing = false;
      this.charIndex = this.fullText.length;
      this.dialogueText.setText(this.fullText);
      return;
    }

    if (this.lineIndex < this.lines.length - 1) {
      this.lineIndex += 1;
      this.showLine();
      return;
    }

    this.closeDialog();
  }

  closeDialog() {
    if (this.closed) return;
    this.closed = true;

    this.timer?.remove();

    const worldScene = this.scene.get('WorldScene');
    if (worldScene && typeof worldScene.onDialogClosed === 'function') {
      worldScene.onDialogClosed(this.actions);
    }

    this.scene.stop();
  }
}
