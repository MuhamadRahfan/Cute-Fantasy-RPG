import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldScene from './scenes/WorldScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';

// Register all modular scenes
const config = {
  ...gameConfig,
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    WorldScene,
    UIScene,
    PauseScene
  ]
};

// Initialize Phaser 3 Game instance
const game = new Phaser.Game(config);

// Handle orientation and window resizing gracefully
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
  }
});

export default game;
