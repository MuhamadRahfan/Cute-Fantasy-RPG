import Phaser from 'phaser';
import { PLAYER_DATA, AUDIO_KEYS } from '../data/gameData.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Precise physics hitbox for feet (prevents getting stuck on trees/walls)
    this.body.setSize(12, 12);
    this.body.setOffset(10, 18);
    this.body.setCollideWorldBounds(true);

    // Player stats
    this.maxHp = PLAYER_DATA.maxHp;
    this.hp = PLAYER_DATA.initialHp;
    this.speed = PLAYER_DATA.speed;
    this.spawnPoint = { x, y };

    // State machine flags
    this.direction = 'down'; // 'down' | 'up' | 'right' | 'left'
    this.isAttacking = false;
    this.isDashing = false;
    this.isHurt = false;
    this.isDead = false;
    this.invulnerable = false;

    // Y-sorting depth
    this.setDepth(this.y);
  }

  update(moveVector, attackTriggered) {
    if (this.isDead) return;

    // Update Y-sorting depth based on feet coordinate
    this.setDepth(this.y + 10);

    // Keep the hurt knockback moving for its short duration instead of
    // cancelling it on the very next frame.
    if (this.isHurt) return;

    if (this.isAttacking) {
      this.setVelocity(0, 0);
      return;
    }

    if (attackTriggered) {
      this.performAttack();
      return;
    }

    this.handleMovement(moveVector);
  }

  handleMovement(vector) {
    let vx = vector.x || 0;
    let vy = vector.y || 0;

    // Check keyboard fallback if vector is near zero
    if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1 && this.scene.cursors) {
      if (this.scene.cursors.left.isDown || this.scene.keys?.A?.isDown) vx = -1;
      else if (this.scene.cursors.right.isDown || this.scene.keys?.D?.isDown) vx = 1;

      if (this.scene.cursors.up.isDown || this.scene.keys?.W?.isDown) vy = -1;
      else if (this.scene.cursors.down.isDown || this.scene.keys?.S?.isDown) vy = 1;
    }

    const length = Math.sqrt(vx * vx + vy * vy);

    if (length > 0.1) {
      // Normalize vector
      const normX = vx / length;
      const normY = vy / length;

      this.setVelocity(normX * this.speed, normY * this.speed);

      // Determine primary direction
      if (Math.abs(normX) > Math.abs(normY)) {
        this.direction = normX > 0 ? 'right' : 'left';
      } else {
        this.direction = normY > 0 ? 'down' : 'up';
      }

      this.playWalkAnimation();
    } else {
      this.setVelocity(0, 0);
      this.playIdleAnimation();
    }
  }

  playWalkAnimation() {
    if (this.direction === 'left') {
      this.setFlipX(true);
      this.anims.play('player_walk_right', true);
    } else {
      this.setFlipX(false);
      this.anims.play(`player_walk_${this.direction}`, true);
    }
  }

  playIdleAnimation() {
    if (this.direction === 'left') {
      this.setFlipX(true);
      this.anims.play('player_idle_right', true);
    } else {
      this.setFlipX(false);
      this.anims.play(`player_idle_${this.direction}`, true);
    }
  }

  performAttack() {
    this.isAttacking = true;
    this.setVelocity(0, 0);

    // Play attack sound with pitch variation
    this.scene.soundManager?.play(AUDIO_KEYS.PLAYER_ATTACK, {
      volume: 0.8,
      rate: Phaser.Math.FloatBetween(0.95, 1.05)
    });

    const animKey = this.direction === 'left' ? 'player_attack_right' : `player_attack_${this.direction}`;
    this.setFlipX(this.direction === 'left');
    this.anims.play(animKey, true);

    // Broadcast attack event for combat system
    this.scene.events.emit('player:attack', {
      x: this.x,
      y: this.y,
      direction: this.direction,
      damage: PLAYER_DATA.attackPower
    });

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      this.playIdleAnimation();
    });
  }

  takeDamage(amount, sourceX = 0, sourceY = 0) {
    if (this.invulnerable || this.isDead) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = true;
    this.isHurt = true;
    this.isAttacking = false;

    this.scene.soundManager?.play(AUDIO_KEYS.PLAYER_DAMAGE, { volume: 0.9 });
    this.scene.events.emit('player:healthChanged', this.hp, this.maxHp);

    // Apply knockback
    if (sourceX !== 0 || sourceY !== 0) {
      const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
      this.setVelocity(Math.cos(angle) * 110, Math.sin(angle) * 110);
    }

    // Flash red and blink
    this.setTint(0xff5555);
    this.scene.cameras.main.shake(120, 0.005);

    this.scene.time.delayedCall(160, () => {
      if (!this.active || this.isDead) return;
      this.clearTint();
      this.isHurt = false;
      this.playIdleAnimation();
    });

    if (this.hp <= 0) {
      this.die();
      return;
    }

    // Invulnerability blink
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 90,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.setAlpha(1);
        this.invulnerable = false;
      }
    });
  }

  die() {
    this.isDead = true;
    this.invulnerable = true;
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
    this.setVelocity(0, 0);
    this.scene.soundManager?.play(AUDIO_KEYS.PLAYER_DEATH, { volume: 0.9 });
    this.anims.play('player_death', true);

    this.scene.events.emit('player:dead');

    this.scene.time.delayedCall(1800, () => {
      this.respawn();
    });
  }

  respawn() {
    this.isDead = false;
    this.isAttacking = false;
    this.isHurt = false;
    this.invulnerable = false;
    this.hp = this.maxHp;
    this.scene.tweens.killTweensOf(this);
    this.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.clearTint();
    this.playIdleAnimation();

    this.scene.events.emit('player:healthChanged', this.hp, this.maxHp);
    this.scene.events.emit('player:respawned');
  }
}
