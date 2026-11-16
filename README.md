# ⚔️ Cute Fantasy RPG (Android & Web)

Game 2D Top-Down Open World Fantasy RPG dengan gaya pixel art yang imut, dunia luas, karakter yang dapat dikendalikan, pertarungan real-time, monster (Slime & Skeleton), hewan ternak pasif, NPC dengan dialog bercabang, inventory, quest, farming (tanam & panen lobak), peti harta, pintu rumah, HUD darah/koin, dan Virtual Joystick mobile khusus touchscreen Android landscape.

---

## 🛠️ Arsitektur & Teknologi
- **Engine**: Phaser 3 (Arcade Physics, ES Modules)
- **Dev Server & Bundler**: Vite
- **Mobile Wrapper**: Capacitor 7 (Android)
- **Controls**: Virtual Joystick (8 arah + deadzone), Tombol Aksi (Attack, Interact, Quest, Tas, Pause)
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
  - **Tombol Kanan (ACT)**: Interaksi objek (bicara NPC, buka peti, tanam/panen, periksa pintu).
  - **Tombol Atas (Q)**: Buka catatan quest. Tracker quest di kanan atas juga bisa disentuh.
  - **Tombol Atas (TAS)**: Buka inventory (pakai/buang item).
  - **Tombol Atas (||)**: Menu jeda / Pause game (Resume, Tas, Quest, Save, Menu Utama).
- **Desktop Keyboard (Pengujian)**:
  - `W, A, S, D` atau Tombol Panah: Gerak karakter.
  - `Space` / `J`: Serang.
  - `E` / `K`: Interaksi.
  - `I`: Inventory.
  - `Q`: Catatan quest.
  - `Esc` / `P`: Pause.

---

## 🧭 Alur Awal & Sistem RPG
1. Bicara dengan **Kepala Desa** di dekat titik spawn untuk memulai quest slime.
2. Seberangi jembatan kayu di timur desa, kalahkan 4 slime, lalu kembali ke Kepala Desa.
3. Bicara dengan **Pak Tani**, tanam Bibit Lobak di 6 petak kebun, tunggu ±30 detik, lalu panen 3 Lobak.
4. **Pedagang** memberi hadiah Ramuan Herbal sekali. Peti di depan rumah berisi Ramuan, Bibit, dan koin.
5. Inventory menyimpan item dan bisa memakai Ramuan/Lobak untuk memulihkan HP.
6. Save (otomatis saat peti/quest/kill/panen, atau via menu Pause) menyimpan posisi, HP, inventory, quest, kebun, koin, dan flag dialog.
