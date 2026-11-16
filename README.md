# ⚔️ Cute Fantasy RPG (Android & Web)

Game 2D Top-Down Open World Fantasy RPG dengan gaya pixel art yang imut, dunia luas, karakter yang dapat dikendalikan, pertarungan real-time, monster (Slime & Skeleton), hewan ternak pasif, sistem interaksi peti harta, pintu rumah, HUD darah, dan Virtual Joystick mobile khusus touchscreen Android landscape.

---

## 🛠️ Arsitektur & Teknologi
- **Engine**: Phaser 3 (Arcade Physics, ES Modules)
- **Dev Server & Bundler**: Vite
- **Mobile Wrapper**: Capacitor 7 (Android)
- **Controls**: Virtual Joystick (8 arah + deadzone), Tombol Aksi (Attack, Interact, Pause)
- **CI/CD**: GitHub Actions (`.github/workflows/android-build.yml`)

---

## 🚀 Cara Menjalankan di Development Mode (Lokal)

### 1. Prasyarat
- Node.js (v20+) & npm

### 2. Instalasi Dependency
```bash
npm install
```

### 3. Menjalankan Server Lokal (Vite)
```bash
npm run dev
```
Buka browser pada alamat yang ditampilkan (default: `http://localhost:3000`).

---

## 📱 Cara Membangun APK Android (Lokal)

### 1. Build Web Assets
```bash
npm run build
```

### 2. Sinkronisasi dengan Android Platform (Capacitor)
```bash
# Di Termux gunakan npm script (shebang /usr/bin/env tidak tersedia):
npm run cap:sync

# Di desktop/CI bisa juga:
npx cap sync android
```

### 3. Kompilasi APK dengan Gradle
```bash
cd android
./gradlew assembleDebug
```
Hasil file APK Debug akan berada di:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🤖 Otomatisasi Build APK via GitHub Actions

Workflow GitHub Actions telah dikonfigurasi di [`.github/workflows/android-build.yml`](.github/workflows/android-build.yml).

### Alur Kerja:
1. Berjalan otomatis saat **Push** ke branch `main`, atau manual lewat **workflow_dispatch** di tab Actions GitHub.
2. Runner Ubuntu menyiapkan Node.js 20, JDK 21, Android SDK 35, menginstal dependency (`npm ci`), menjalankan Vite build, sinkronisasi Capacitor, lalu `./gradlew assembleDebug`.
3. File `app-debug.apk` diunggah sebagai artifact **`Cute-Fantasy-RPG-debug`** di halaman detail workflow run. Artifact dapat diunduh, diekstrak, lalu di-install di HP Android.

---

## 🎮 Kontrol Game
- **Mobile Touchscreen (Landscape)**:
  - **Joystick Kiri**: Gerak 8-arah (berjalan halus).
  - **Tombol Kanan (ATK)**: Serangan tebasan pedang ke arah hadap karakter.
  - **Tombol Kanan (ACT)**: Interaksi objek (membuka peti, memeriksa pintu rumah).
  - **Tombol Atas (||)**: Menu jeda / Pause game (Resume, Save, Menu Utama).
- **Desktop Keyboard (Pengujian)**:
  - `W, A, S, D` atau Tombol Panah: Gerak karakter.
  - `Space` / `J`: Serang.
  - `E` / `K`: Interaksi.
