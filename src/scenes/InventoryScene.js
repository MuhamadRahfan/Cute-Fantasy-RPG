import Phaser from 'phaser';

const SLOT_COUNT = 12;
const COLS = 6;
const CELL = 40;
const GAP = 6;

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  create() {
    this.world = this.scene.get('WorldScene');
    this.state = this.registry.get('gameState');
    this.selectedId = null;
    this.closed = false;

    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.72)
      .setOrigin(0)
      .setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x131a24, 0.98);
    panel.fillRoundedRect(40, 22, width - 80, height - 44, 7);
    panel.lineStyle(2, 0x8abeb7, 1);
    panel.strokeRoundedRect(40, 22, width - 80, height - 44, 7);

    this.add.text(width / 2, 37, 'TAS PETUALANG', {
      fontSize: '12px',
      color: '#ffd166',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.slotContainer = this.add.container(0, 0);
    this.infoText = this.add.text(width / 2, 184, 'Pilih item untuk melihat detail.', {
      fontSize: '9px',
      color: '#c5c8c6',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: width - 110 }
    }).setOrigin(0.5);

    this.messageText = this.add.text(width / 2, 203, '', {
      fontSize: '8px',
      color: '#2ec4b6',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.createButton(156, 226, 'PAKAI', 0x2ec4b6, () => this.useSelected());
    this.createButton(252, 226, 'BUANG', 0xe63946, () => this.dropSelected());
    this.createButton(348, 226, 'TUTUP', 0x8abeb7, () => this.closeInventory());

    this.input.keyboard.on('keydown-I', () => this.closeInventory());
    this.input.keyboard.on('keydown-ESC', () => this.closeInventory());

    this.refresh();
  }

  createButton(x, y, label, color, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(0x232d3d, 1);
    bg.fillRoundedRect(x - 42, y - 11, 84, 22, 4);
    bg.lineStyle(1, color, 1);
    bg.strokeRoundedRect(x - 42, y - 11, 84, 22, 4);

    this.add.text(x, y, label, {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, 84, 22).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', callback);
  }

  refresh() {
    this.slotContainer.removeAll(true);

    const items = this.state ? this.state.getSlots() : [];
    if (this.selectedId && !items.some((item) => item.id === this.selectedId)) {
      this.selectedId = null;
    }
    if (!this.selectedId && items.length > 0) {
      this.selectedId = items[0].id;
    }

    const gridW = COLS * CELL + (COLS - 1) * GAP;
    const startX = (this.scale.width - gridW) / 2;
    const startY = 64;

    for (let index = 0; index < SLOT_COUNT; index++) {
      const item = items[index];
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = startX + col * (CELL + GAP);
      const y = startY + row * (CELL + GAP);
      const selected = item && item.id === this.selectedId;

      const slot = this.add.rectangle(x, y, CELL, CELL, 0x1b2330, 0.95)
        .setOrigin(0)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0xf0c674 : 0x3e4c5e, 1);

      const zone = this.add.zone(x, y, CELL, CELL).setOrigin(0).setInteractive();
      zone.on('pointerdown', () => {
        if (!item) return;
        this.selectedId = item.id;
        this.refresh();
      });

      this.slotContainer.add(slot);
      this.slotContainer.add(zone);

      if (!item) continue;

      const icon = this.add.circle(x + CELL / 2, y + CELL / 2, 11, item.color, 1);
      const letter = this.add.text(x + CELL / 2, y + CELL / 2, item.icon, {
        fontSize: '9px',
        color: '#0b0e14',
        fontStyle: 'bold',
        fontFamily: 'monospace'
      }).setOrigin(0.5);

      const count = this.add.text(x + CELL - 3, y + CELL - 2, `x${item.qty}`, {
        fontSize: '8px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(1, 1);

      this.slotContainer.add(icon);
      this.slotContainer.add(letter);
      this.slotContainer.add(count);
    }

    const selected = items.find((item) => item.id === this.selectedId);
    this.infoText.setText(selected
      ? `${selected.name}\n${selected.description}`
      : 'Tas kosong. Cari peti, monster, atau panen kebun.');
  }

  useSelected() {
    const item = this.state?.getSlots().find((entry) => entry.id === this.selectedId);
    if (!item) {
      this.setMessage('Tidak ada item yang dipilih.');
      return;
    }

    if (!item.heal) {
      this.setMessage(`${item.name} tidak bisa langsung dipakai.`);
      return;
    }

    const player = this.world?.player;
    if (!player) return;

    if (player.hp >= player.maxHp) {
      this.setMessage('HP sudah penuh.');
      return;
    }

    const healed = player.heal(item.heal);
    if (!healed) {
      this.setMessage('Tidak bisa memakai item sekarang.');
      return;
    }

    this.state.removeItem(item.id, 1);
    this.world.saveGame?.();
    this.setMessage(`${item.name} dipakai. HP +${item.heal}.`);
    this.refresh();
  }

  dropSelected() {
    const item = this.state?.getSlots().find((entry) => entry.id === this.selectedId);
    if (!item) {
      this.setMessage('Tidak ada item yang dipilih.');
      return;
    }

    this.state.removeItem(item.id, 1);
    this.world.saveGame?.();
    this.setMessage(`${item.name} dibuang.`);
    this.refresh();
  }

  setMessage(message) {
    this.messageText.setText(message);
  }

  closeInventory() {
    if (this.closed) return;
    this.closed = true;

    if (this.world && typeof this.world.onInventoryClosed === 'function') {
      this.world.onInventoryClosed();
    }
    this.scene.stop();
  }
}
