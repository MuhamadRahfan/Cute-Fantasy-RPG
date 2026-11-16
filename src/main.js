import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';
import { gameConfig } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldScene from './scenes/WorldScene.js';
import UIScene from './scenes/UIScene.js';
import DialogScene from './scenes/DialogScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import QuestScene from './scenes/QuestScene.js';
import PauseScene from './scenes/PauseScene.js';

// Register all modular scenes. Later scenes render above earlier ones.
const config = {
  ...gameConfig,
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    WorldScene,
    UIScene,
    DialogScene,
    InventoryScene,
    QuestScene,
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

/**
 * Android lifecycle helpers. Everything is guarded so the web build keeps
 * working on browsers where these plugins are not available.
 */
async function initNativeLifecycle() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await ScreenOrientation.lock({ orientation: 'landscape' });
  } catch (error) {
    console.warn('[Native] Orientation lock unavailable:', error);
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#0b0e14' });
  } catch (error) {
    console.warn('[Native] Status bar setup skipped:', error);
  }

  try {
    await App.addListener('backButton', () => {
      if (game.scene.isActive('DialogScene')) {
        game.scene.getScene('DialogScene')?.closeDialog?.();
        return;
      }

      if (game.scene.isActive('InventoryScene')) {
        game.scene.getScene('InventoryScene')?.closeInventory?.();
        return;
      }

      if (game.scene.isActive('QuestScene')) {
        game.scene.getScene('QuestScene')?.closeQuest?.();
        return;
      }

      if (game.scene.isActive('PauseScene')) {
        game.scene.getScene('PauseScene')?.resumeWorld?.();
        return;
      }

      if (game.scene.isActive('WorldScene')) {
        game.scene.pause('WorldScene');
        game.scene.launch('PauseScene');
        return;
      }

      // On the main menu (or while loading) the back button exits the app.
      if (
        game.scene.isActive('MenuScene') ||
        game.scene.isActive('PreloadScene') ||
        game.scene.isActive('BootScene')
      ) {
        App.exitApp().catch(() => {});
      }
    });

    await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        game.loop.wake();
        return;
      }

      const world = game.scene.getScene('WorldScene');
      world?.saveGame?.();
      game.loop.sleep();
    });
  } catch (error) {
    console.warn('[Native] App lifecycle listeners unavailable:', error);
  }
}

initNativeLifecycle();

export default game;
