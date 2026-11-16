# Cute Fantasy RPG — Development Status

> Last updated: 2026-11-16 (after blocker fixes + initial commit)

## Project Identity
- **Title**: Cute Fantasy RPG
- **Package ID**: `com.cutefantasy.rpg`
- **Orientation**: Landscape (Touchscreen + Virtual Joystick)
- **Engine**: Phaser 3.88 (Arcade Physics, ES Modules, Vite)
- **Wrapper**: Capacitor 7 (Android)

---

## Verification Snapshot
- `npm run build` — **PASS** (`dist` ~29 KB app + ~1.48 MB Phaser)
- `npm run dev` — **PASS** (Termux-safe `node .../vite.js` scripts)
- Android project + `npx cap sync android` — **done**
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

### Phase 3 — RPG Core [PARTIAL]
- [x] Enemy system (Slime & Skeleton, wander/chase)
- [x] Combat (melee hitbox, damage, knockback, stun window)
- [x] Audio effects with safe fallback + pitch variation
- [x] Interaction system (chest, door)
- [ ] NPC entity & multi-line dialog box
- [ ] Inventory (slots, items, use, drop, chest storage)
- [ ] Enemy attack telegraph / attack animations

### Phase 4 — Advanced [PARTIAL]
- [x] Ambient farm animals (chicken, cow, pig, sheep)
- [x] Basic save / load (player position, HP, chest state)
- [ ] Quest system (data-driven, objectives, rewards)
- [ ] Farming system (tilling, planting, growth, harvest)
- [ ] Audio settings & volume sliders
- [ ] Save versioning / Capacitor Preferences

### Phase 5 — Android [PARTIAL]
- [x] Capacitor Android project initialized & synced
- [x] Orientation/status-bar plugins installed
- [ ] Lock landscape in AndroidManifest or via plugin call
- [ ] Android hardware back button handler
- [ ] App pause / resume lifecycle management

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
- CONTINUE loads position/HP/chest only — enemies, quests, and inventory are not persisted.
- No NPC, dialog, inventory, quest, or farming systems yet.
- Android landscape/back-button/status-bar behavior still needs implementation.
