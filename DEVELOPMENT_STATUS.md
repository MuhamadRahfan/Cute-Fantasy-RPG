# Cute Fantasy RPG — Development Status

> Last updated: 2026-11-16 (after RPG systems integration)

## Project Identity
- **Title**: Cute Fantasy RPG
- **Package ID**: `com.cutefantasy.rpg`
- **Orientation**: Landscape (Touchscreen + Virtual Joystick)
- **Engine**: Phaser 3.88 (Arcade Physics, ES Modules, Vite)
- **Wrapper**: Capacitor 7 (Android)

---

## Verification Snapshot
- `npm run build` — **PASS** (`dist` ~67 KB app + ~1.48 MB Phaser)
- `npm run dev` — **PASS** (Termux-safe `node .../vite.js` scripts)
- GameState / farming logic tests — **PASS** (Node + esbuild bundle)
- Android project + `npm run cap:sync` — **done**
- GitHub Actions workflow — **configured, not yet executed** (needs push)
- Local APK build — **not possible in Termux** (no JDK / Android SDK); CI will build it

---

## Roadmap & Phase Status

### Phase 1 — Foundation [DONE]
- [x] Dependencies installed (`phaser`, `vite`, `@capacitor/*`)
- [x] Asset pipeline & public directory structure
- [x] HTML / CSS Responsive Landscape Canvas
- [x] Phaser Game Configuration & Scene Manager
- [x] BootScene & PreloadScene (sprite sheets, tilesets, audio)
- [x] Player Controller (8-way direction, animations, physics)
- [x] Virtual Joystick + keyboard fallback (move / attack / interact / pause)
- [x] Follow camera & world bounds

### Phase 2 — World [MOSTLY DONE]
- [x] Terrain (grass, path, water, beach, cliff, farmland)
- [x] Static collision layers (water, cliff, buildings, fences, trees)
- [x] Y-sorted entities (house, fences, trees, chest, player)
- [x] House with door interaction text
- [x] Interactable chest (open state persisted)
- [x] 1024×768 open world bounds
- [ ] Replace 3,000+ terrain images with RenderTexture / tilemap for mobile perf
- [ ] Proper autotile edges for beach & cliff (currently repeated 5×3 / 3×6 stamps)

### Phase 3 — RPG Core [MOSTLY DONE]
- [x] Enemy system (Slime & Skeleton, wander/chase)
- [x] Combat (melee hitbox, damage, knockback, stun window)
- [x] Audio effects with safe fallback + pitch variation
- [x] Interaction system (chest, door, NPC, farm plots)
- [x] NPC entity & typewriter multi-line dialog box
- [x] Inventory (12 slots, use, drop, starter items)
- [x] Enemy loot drops (Gel Slime, Tulang Kuno, potion, gold)
- [ ] Enemy attack telegraph / attack animations

### Phase 4 — Advanced [MOSTLY DONE]
- [x] Ambient farm animals (chicken, cow, pig, sheep)
- [x] Full save / load (position, HP, inventory, quests, farm, gold, flags)
- [x] Data-driven quest system (talk / kill / harvest objectives + rewards)
- [x] Farming system (planting, timed growth stages, harvesting)
- [x] Save format version 2 + legacy v1 migration
- [ ] Audio settings & volume sliders
- [ ] Capacitor Preferences (still uses localStorage)

### Phase 5 — Android [DONE]
- [x] Capacitor Android project initialized & synced
- [x] Orientation/status-bar plugins installed
- [x] Landscape lock (`sensorLandscape` + ScreenOrientation plugin)
- [x] Android hardware back button handler (closes overlays / opens pause)
- [x] App pause / resume lifecycle management (auto-save + loop sleep/wake)

### Phase 6 — CI/CD & Build [IN PROGRESS]
- [x] GitHub Actions workflow (`.github/workflows/android-build.yml`)
- [x] Gradle wrapper tracked in git
- [x] JDK 21 + Android SDK 35 configured (Capacitor 7)
- [x] Initial commit created
- [ ] Add Git remote & push to trigger CI
- [ ] Verify debug APK artifact
- [ ] Release APK signing setup

---

## Known Limitations / Next Up
- No real tilemap; terrain uses individual images (performance risk on low-end devices).
- Beach/cliff visuals repeat stamp motifs instead of continuous edges.
- Combat is contact-damage based; skeleton/slime have no dedicated attack animation.
- Defeated enemies and their spawn positions are not persisted between sessions.
- Crops use procedural graphics (no dedicated crop spritesheet in the asset pack).
- No shop/economy loop yet; gold is earned but not spent.
- No audio settings UI yet; BGM/SFX volumes are fixed in code.
