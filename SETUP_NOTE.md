# Mission Alarm — Setup Notes

## What's built so far

- **Navigation**: Home (alarm list) → Edit Alarm → Alarm Ringing (full-screen) → Dismiss Success
- **Memory Match challenge**: fully working game logic, difficulty scales by day-of-week and snooze count
- **Zustand store**: alarms + streak/stats persisted to AsyncStorage
- **Alarm scheduling**: notifee-based trigger notifications with full-screen intent (Android) / critical alerts (iOS)
- **Volume protection**: native Android module (`VolumeObserverModule`) that detects volume drops on the ALARM stream and snaps it back up; iOS fallback shows an on-screen message since Apple doesn't allow forcing volume back

## Before running

1. `cd MissionAlarm && npm install` (already done in this build)
2. **Add a real alarm sound file**: drop an `alarm_default.mp3` into:
   - `android/app/src/main/res/raw/alarm_default.mp3` (Android)
   - add to Xcode project bundle for iOS
3. **Android permissions** — add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
   <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   <uses-permission android:name="android.permission.VIBRATE" />
   ```
4. **iOS** — enable Critical Alerts capability in Xcode (requires special entitlement from Apple, must request separately — not auto-approved)
5. Run:
   - Android: `npx react-native run-android`
   - iOS: `cd ios && pod install && cd .. && npx react-native run-ios`

## Known gaps to build next

- Snooze doesn't yet actually reschedule a real native trigger for +5 min (stub in `AlarmRingingScreen.handleSnooze`)
- No onboarding flow for requesting DND/alarm permissions with friendly explanations
- Sound file is referenced but not included (copyright — you'll need to source/license your own alarm tones)
- iOS Critical Alerts entitlement must be requested from Apple before this fully works on iOS
