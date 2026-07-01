# MissionAlarm — Developer Command Reference

A complete reference of every command used to set up, build, and distribute
the MissionAlarm React Native app using GitHub Codespaces.

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Project Scaffold](#2-project-scaffold)
3. [Install Dependencies](#3-install-dependencies)
4. [Folder Structure](#4-folder-structure)
5. [Android Permissions](#5-android-permissions)
6. [Fix Build Performance](#6-fix-build-performance)
7. [Build the APK](#7-build-the-apk)
8. [Download APK from Codespaces](#8-download-apk-from-codespaces)
9. [Install ADB on Windows](#9-install-adb-on-windows)
10. [Connect Phone via ADB](#10-connect-phone-via-adb)
11. [Daily Development Commands](#11-daily-development-commands)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Environment Setup

### Install Node Version Manager (nvm) and Node 20

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node --version    # should print v20.x.x
npm --version
```

**Why:** React Native requires Node 18+ to run Metro bundler and the CLI tools.
nvm lets you switch Node versions per project without breaking other things.

### Install Java 17 (required for Android builds)

```bash
java -version     # check what's already installed — needs to be 17

# If not 17:
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk
sudo update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

java -version     # must now print 17.x.x
```

**Why:** Gradle 8 (used by React Native 0.73+) requires exactly Java 17.
Using Java 11 or 21 causes Gradle to hang silently with no error output.

### Install Android SDK

```bash
sudo apt-get install -y wget unzip
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip -d android-sdk
mkdir -p android-sdk/cmdline-tools/latest
mv android-sdk/cmdline-tools/* android-sdk/cmdline-tools/latest/ 2>/dev/null || true

export ANDROID_HOME=$HOME/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH' >> ~/.bashrc
source ~/.bashrc

# Accept licenses and install required packages
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

**Why:** The Android SDK contains the compiler toolchain (`aapt`, `dx`, `zipalign`)
that Gradle uses to package your JS + native code into an installable APK.
`platform-tools` includes ADB for device communication.

---

## 2. Project Scaffold

### Create a new React Native project

```bash
npm install -g @react-native-community/cli
npx @react-native-community/cli init MissionAlarm
cd MissionAlarm
```

**Why:** The community CLI scaffolds the full Android + iOS native project,
`package.json`, Metro config, Babel config, and boilerplate entry point so
you don't have to write 200+ lines of config from scratch.

### Set a PROJECT variable (avoids typing the long path repeatedly)

```bash
export PROJECT=/workspaces/MissionAlarm/MissionAlarm
echo "Project root: $PROJECT"
ls $PROJECT
```

**Why:** All subsequent commands reference `$PROJECT` instead of the full path.
This variable is session-scoped — re-run this line if you open a new terminal.

### Remove boilerplate App.tsx (replaced by our App.js)

```bash
rm $PROJECT/App.tsx
```

**Why:** React Native resolves `.tsx` before `.js` — if both exist, the
boilerplate `App.tsx` wins and your custom `App.js` is silently ignored.
Deleting it ensures the correct file is loaded.

---

## 3. Install Dependencies

```bash
cd $PROJECT

# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Navigation peer dependencies (required by React Navigation)
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler

# State management + persistent storage
npm install zustand @react-native-async-storage/async-storage

# Alarm scheduling — full-screen notifications that fire even when app is killed
npm install @notifee/react-native

# Alarm sound playback
npm install react-native-sound

# Background timer for snooze rescheduling
npm install react-native-background-timer

# Date/time utilities
npm install date-fns
```

**Why each package:**

| Package | Purpose |
|---|---|
| `@react-navigation/*` | Screen-to-screen navigation (Home → Edit → Ringing → Success) |
| `react-native-screens` | Uses native OS screen containers for better performance |
| `react-native-safe-area-context` | Keeps UI away from notches and system bars |
| `react-native-gesture-handler` | Required by React Navigation for swipe gestures |
| `zustand` | Lightweight global state for alarms + streak data |
| `@react-native-async-storage/async-storage` | Persists alarms to device storage across app restarts |
| `@notifee/react-native` | Schedules exact-time alarm notifications with full-screen intent |
| `react-native-sound` | Plays the alarm audio on the dedicated STREAM_ALARM channel |
| `react-native-background-timer` | Keeps timers running when the app is in the background |
| `date-fns` | Formats dates and computes next alarm trigger times |

---

## 4. Folder Structure

```bash
mkdir -p $PROJECT/src/screens
mkdir -p $PROJECT/src/components
mkdir -p $PROJECT/src/navigation
mkdir -p $PROJECT/src/store
mkdir -p $PROJECT/src/utils
mkdir -p $PROJECT/src/hooks
mkdir -p $PROJECT/src/assets/sounds

# Create the raw folder Android needs for bundled sound files
mkdir -p $PROJECT/android/app/src/main/res/raw
```

**Why:** React Native has no enforced structure, but this layout separates
concerns cleanly. `res/raw` is where Android looks for bundled audio files
that can be played via `react-native-sound`.

---

## 5. Android Permissions

```bash
sed -i 's|<uses-permission android:name="android.permission.INTERNET" />|<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n    <uses-permission android:name="android.permission.VIBRATE" />\n    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />|' \
  $PROJECT/android/app/src/main/AndroidManifest.xml

# Verify
cat $PROJECT/android/app/src/main/AndroidManifest.xml
```

**Why each permission:**

| Permission | Purpose |
|---|---|
| `SCHEDULE_EXACT_ALARM` | Fires alarm at the exact second set, not approximate |
| `USE_FULL_SCREEN_INTENT` | Shows alarm over the lock screen, like native clock apps |
| `WAKE_LOCK` | Prevents CPU from sleeping while alarm is ringing |
| `VIBRATE` | Allows vibration as a backup to sound |
| `ACCESS_NOTIFICATION_POLICY` | Required to bypass Do Not Disturb mode |

---

## 6. Fix Build Performance

```bash
# Build only x86_64 (matches Codespaces CPU — no need to build 4 architectures)
sed -i 's/reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64/reactNativeArchitectures=x86_64/' \
  $PROJECT/android/gradle.properties

# Disable new architecture for now (reduces compile complexity)
sed -i 's/newArchEnabled=true/newArchEnabled=false/' \
  $PROJECT/android/gradle.properties

# Disable Gradle daemon (prevents memory issues in Codespaces)
echo "org.gradle.daemon=false" >> $PROJECT/android/gradle.properties

# Enable configuration cache and build cache (speeds up subsequent builds)
echo "org.gradle.configuration-cache=true" >> $PROJECT/android/gradle.properties
echo "org.gradle.caching=true" >> $PROJECT/android/gradle.properties

# Verify changes
grep -E "reactNativeArchitectures|newArchEnabled|daemon|cache" \
  $PROJECT/android/gradle.properties
```

**Why:** The default config builds for 4 CPU architectures simultaneously.
In Codespaces with no swap memory this causes the linker to stall with zero
output — it looks like the build is frozen but it's actually out of memory.
Building only `x86_64` cuts build time from 15+ minutes to under 2 minutes.
Configuration cache means subsequent builds reuse previous task outputs,
bringing it down further to under 1 minute.

---

## 7. Build the APK

### First build (downloads Gradle + all dependencies ~500MB)

```bash
cd $PROJECT/android
./gradlew assembleDebug --no-daemon
```

**Why `--no-daemon`:** The Gradle daemon is a long-running background process
that speeds up repeated builds but consumes significant RAM. In Codespaces,
running without the daemon is more stable.

Expected output:
```
BUILD SUCCESSFUL in Xm Xs
282 actionable tasks: 129 executed, 153 up-to-date
```

APK location:
```
$PROJECT/android/app/build/outputs/apk/debug/app-debug.apk
```

### Subsequent builds (uses cache — much faster)

```bash
cd $PROJECT/android
./gradlew assembleDebug --no-daemon
# Typically completes in 30–60 seconds
```

### Clean build (when you suspect stale cache)

```bash
cd $PROJECT/android
./gradlew clean
./gradlew assembleDebug --no-daemon
```

### Kill stale Gradle processes (if build hangs)

```bash
pkill -f gradle 2>/dev/null
pkill -f java 2>/dev/null
sleep 3
echo "cleared"
```

---

## 8. Download APK from Codespaces

The Codespaces browser UI fails to download large files (49MB APK).
Use a local HTTP server instead:

### Step 1 — Copy APK to workspace root

```bash
cp $PROJECT/android/app/build/outputs/apk/debug/app-debug.apk \
  /workspaces/MissionAlarm/app-debug.apk
```

**Why:** Files at the workspace root download more reliably from the
Codespaces Explorer sidebar than files deep inside `build/` directories.

### Step 2 — Serve via HTTP (most reliable method)

```bash
cd /workspaces/MissionAlarm/MissionAlarm/android/app/build/outputs/apk/debug/
python3 -m http.server 8080
```

Then in Codespaces:
```
PORTS tab → port 8080 → right-click → Port Visibility → Public
Copy the Forwarded Address URL
Open: https://<your-codespace-url>-8080.app.github.dev/app-debug.apk
```

**Why:** Codespaces port forwarding tunnels traffic from a public HTTPS URL
to the local port inside your container. The browser downloads the APK
directly from that tunnel — no intermediate storage needed.

Stop the server after download:
```bash
# Press Ctrl+C
```

### Step 3 — Alternative: split into small chunks

If port forwarding is blocked:

```bash
# Split APK into 10MB pieces (each downloads fine from Explorer sidebar)
split -b 10m \
  $PROJECT/android/app/build/outputs/apk/debug/app-debug.apk \
  /workspaces/MissionAlarm/apk_part_

ls -lh /workspaces/MissionAlarm/apk_part_*
```

Download each `apk_part_*` file from Explorer, then reassemble on Windows:

```cmd
cd C:\Users\gaura\Downloads
copy /b apk_part_aa + apk_part_ab + apk_part_ac + apk_part_ad MissionAlarm.apk
```

---

## 9. Install ADB on Windows

### Option A — winget (recommended, Windows 10/11)

```powershell
# Run in PowerShell as Administrator
winget install Google.PlatformTools
# Close and reopen terminal after install
adb version
```

### Option B — Manual install + PATH

Download Platform Tools from:
`https://developer.android.com/tools/releases/platform-tools`

Then add to PATH (run in PowerShell as Administrator — one single line):

```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";C:\Users\gaura\Downloads\platform-tools-latest-windows\platform-tools", "User")
```

Close all terminals, open a new Command Prompt:

```cmd
adb version
# Should print: Android Debug Bridge version 1.0.41
```

**Why:** ADB (Android Debug Bridge) is the communication layer between your
PC and your Android device. It's used to install APKs, view logs, run shell
commands, and enable wireless debugging — essential for development.

---

## 10. Connect Phone via ADB

### Enable Developer Options on phone

```
Settings → About Phone → tap "Build Number" 7 times
→ "You are now a developer!" message appears
Settings → Developer Options → turn ON
```

### Enable Wireless Debugging

```
Settings → Developer Options → Wireless Debugging → ON
Tap "Wireless Debugging" → note the IP address and port (e.g. 192.168.1.5:45678)
```

### Connect via ADB

```cmd
adb connect 192.168.1.5:45678
adb devices
# Should show: 192.168.1.5:45678    device
```

### Install APK directly to phone

```cmd
adb install C:\Users\gaura\Downloads\app-debug.apk
```

### Reinstall (preserving app data)

```cmd
adb install -r C:\Users\gaura\Downloads\app-debug.apk
```

---

## 11. Daily Development Commands

### Start Metro bundler (JS live reload)

```bash
cd $PROJECT
npx react-native start
```

**Why:** Metro is the JavaScript bundler for React Native. It watches your
`src/` files for changes and pushes updates to the app instantly — no rebuild
needed for JS-only changes.

### Start with clean cache (when imports/modules misbehave)

```bash
npx react-native start --reset-cache
```

### Check environment for issues

```bash
npx react-native doctor
```

**Why:** Diagnoses common setup problems — wrong Java version, missing SDK
components, missing Xcode tools — and tells you exactly what to fix.

### View Android logs (filter to your app only)

```cmd
# On Windows with ADB connected:
adb logcat | findstr MissionAlarm

# In Codespaces:
adb logcat | grep MissionAlarm
```

### View Metro / JS errors

```bash
# Metro prints JS errors directly in its terminal
# For native crashes, check logcat above
```

### Rebuild after adding a native module

```bash
# Whenever you add a package with native code (Java/Kotlin/Swift),
# you must do a full rebuild — Metro reload alone won't work
cd $PROJECT/android
./gradlew assembleDebug --no-daemon
```

---

## 12. Troubleshooting

### Build hangs with no output

```bash
# 1. Kill stale processes
pkill -f gradle && pkill -f java && sleep 3

# 2. Check memory
free -h    # need at least 1.5GB available

# 3. Run without piping — piping to tail hides output and can cause hangs
cd $PROJECT/android
./gradlew assembleDebug --no-daemon    # NO "| tail -10" at the end
```

### "App.tsx takes priority over App.js"

```bash
ls $PROJECT/App.*    # if both exist, delete App.tsx
rm $PROJECT/App.tsx
```

### Gradle "Could not resolve" dependency errors

```bash
# Check internet connectivity from Codespaces
curl -I https://repo.maven.apache.org

# If blocked, the Codespaces machine type may have restricted egress
# Switch to a larger Codespaces machine: Codespaces settings → Change machine type
```

### Metro "Unable to resolve module" errors

```bash
# Module not found after install — clear cache
npx react-native start --reset-cache

# If still failing — the package may need a rebuild (has native code)
cd $PROJECT/android && ./gradlew assembleDebug --no-daemon
```

### ADB device not found

```cmd
adb kill-server
adb start-server
adb devices

# If phone shows "unauthorized" — check phone screen for RSA key prompt and tap Allow
```

### Port 8080 not accessible in Codespaces

```
PORTS tab → check if port 8080 is listed
If not: forward it manually → click "+" → type 8080
Right-click → Port Visibility → Public
```

---

## Project File Reference

```
MissionAlarm/
├── App.js                          # Entry point — navigation + store init
├── index.js                        # Registers App with React Native runtime
├── src/
│   ├── store/
│   │   └── useAlarmStore.js        # Zustand store — alarms, streak, stats
│   ├── utils/
│   │   ├── alarmScheduler.js       # Notifee alarm scheduling + trigger calc
│   │   ├── difficulty.js           # Pairs required based on day + snooze count
│   │   └── soundManager.js        # Alarm sound + volume lock logic
│   ├── components/
│   │   └── MemoryMatchGrid.js      # The memory match game component
│   ├── screens/
│   │   ├── HomeScreen.js           # Alarm list + streak card
│   │   ├── EditAlarmScreen.js      # Create / edit alarm
│   │   ├── AlarmRingingScreen.js   # Full-screen ringing + challenge
│   │   └── DismissSuccessScreen.js # Post-dismiss stats + streak
│   └── navigation/
│       └── RootNavigator.js        # Stack navigator wiring all screens
└── android/
    └── app/src/main/
        ├── java/com/missionalarm/
        │   ├── VolumeObserverModule.java   # Native: monitors alarm stream volume
        │   ├── VolumeObserverPackage.java  # Registers native module with RN
        │   └── MainApplication.kt          # Registers VolumeObserverPackage
        ├── res/raw/
        │   └── alarm_default.mp3           # Alarm sound file (add your own)
        └── AndroidManifest.xml             # Permissions declaration
```

---

*Last updated during active development session. Add new commands here as the project grows.*