import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Generate a simple 1x1 white texture for loading bars & particles if needed
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 4, 4);
    gfx.generateTexture('white_pixel', 4, 4);
    gfx.destroy();
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
