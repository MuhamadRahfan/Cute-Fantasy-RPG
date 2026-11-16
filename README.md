# ⚔️ Cute Fantasy RPG (Android & Web)

Game 2D Top-Down Open World Fantasy RPG dengan gaya pixel art yang imut, dunia luas, karakter yang dapat dikendalikan, pertarungan real-time, monster (Slime & Skeleton), hewan ternak pasif, sistem interaksi peti harta, pintu rumah, HUD darah, dan Virtual Joystick mobile khusus touchscreen Android landscape.

---

## 🛠️ Arsitektur & Teknologi
- **Engine**: Phaser 3 (Arcade Physics, ES Modules)
- **Dev Server & Bundler**: Vite
- **Mobile Wrapper**: Capacitor 7 (Android)
- **Controls**: Virtual Joystick (8 arah + deadzone), Tombol Aksi (Attack, Interact, Pause)
- **CI/CD**: GitHub Actions (`.github/workflows/build-apk.yml`)

---

## 🚀 Cara Menjalankan di Development Mode (Lokal)

### 1. Prasyarat
- Node.js (v18+) & npm

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
npx cap add android   # Hanya jika folder android belum ada
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

Workflow GitHub Actions telah dikonfigurasi di [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

### Alur Kerja:
1. Setiap kali melakukan **Push** ke branch `main`, atau membuat **Pull Request**, atau memicu **workflow_dispatch** secara manual di tab Actions GitHub.
2. Server runner GitHub (Ubuntu) akan otomatis menyiapkan Java 17, Android SDK, menginstal dependency, menjalankan Vite build, menyinkronkan Capacitor, dan mengompilasi APK.
3. File APK hasil kompilasi akan otomatis diunggah ke bagian **Artifacts** di halaman detail workflow run:
   - `Cute-Fantasy-RPG-debug.apk` (Siap di-install langsung di HP Android)
   - `Cute-Fantasy-RPG-release.apk` (Unsigned / perlu di-sign dengan keystore produksi untuk rilis Play Store).

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
