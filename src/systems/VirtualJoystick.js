export default class VirtualJoystick {
  /**
   * @param {Phaser.Scene} scene - The UI scene hosting the joystick
   * @param {number} x - Base X position
   * @param {number} y - Base Y position
   * @param {number} radius - Base radius
   */
  constructor(scene, x, y, radius = 46) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.radius = radius;
    this.deadZone = 8;

    this.pointer = null;
    this.forceX = 0;
    this.forceY = 0;
    this.isDown = false;

    this.createGraphics();
    this.setupEvents();
  }

  createGraphics() {
    this.container = this.scene.add.container(this.baseX, this.baseY);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // Outer ring base
    this.baseCircle = this.scene.add.graphics();
    this.baseCircle.fillStyle(0x000000, 0.35);
    this.baseCircle.fillCircle(0, 0, this.radius);
    this.baseCircle.lineStyle(2, 0x4a90e2, 0.65);
    this.baseCircle.strokeCircle(0, 0, this.radius);
    this.container.add(this.baseCircle);

    // Inner thumb knob
    this.thumbKnob = this.scene.add.graphics();
    this.thumbKnob.fillStyle(0x4a90e2, 0.85);
    this.thumbKnob.fillCircle(0, 0, this.radius * 0.42);
    this.thumbKnob.lineStyle(2, 0xffffff, 0.9);
    this.thumbKnob.strokeCircle(0, 0, this.radius * 0.42);
    this.container.add(this.thumbKnob);

    // Interactive zone covering bottom-left of screen
    this.hitZone = this.scene.add.zone(0, 0, this.radius * 3.2, this.radius * 3.2);
    this.hitZone.setOrigin(0.5);
    this.hitZone.setInteractive();
    this.container.add(this.hitZone);
  }

  setupEvents() {
    this.scene.input.on('pointerdown', (pointer) => {
      // Only capture pointers on left half of screen
      if (pointer.x < this.scene.scale.width * 0.45 && !this.isDown) {
        this.pointer = pointer;
        this.isDown = true;
        this.updatePosition(pointer.x, pointer.y);
      }
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (this.isDown && this.pointer && this.pointer.id === pointer.id) {
        this.updatePosition(pointer.x, pointer.y);
      }
    });

    const releaseHandler = (pointer) => {
      if (this.isDown && this.pointer && this.pointer.id === pointer.id) {
        this.reset();
      }
    };

    this.scene.input.on('pointerup', releaseHandler);
    this.scene.input.on('pointerout', releaseHandler);
  }

  updatePosition(touchX, touchY) {
    const dx = touchX - this.baseX;
    const dy = touchY - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.deadZone) {
      this.forceX = 0;
      this.forceY = 0;
      this.thumbKnob.setPosition(0, 0);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDistance = Math.min(distance, this.radius);

    this.thumbKnob.x = Math.cos(angle) * clampedDistance;
    this.thumbKnob.y = Math.sin(angle) * clampedDistance;

    // Output normalized force vector
    this.forceX = this.thumbKnob.x / this.radius;
    this.forceY = this.thumbKnob.y / this.radius;
  }

  reset() {
    this.isDown = false;
    this.pointer = null;
    this.forceX = 0;
    this.forceY = 0;
    this.thumbKnob.setPosition(0, 0);
  }

  getVector() {
    return {
      x: this.forceX,
      y: this.forceY,
      isDown: this.isDown
    };
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
  }
}
