import { NativeModules, Platform } from 'react-native';

/**
 * On Android, we use the native RingtoneManager intent to let the user
 * pick from system sounds — no third-party package needed.
 * This is actually better UX since it shows the system sound picker
 * that users are already familiar with from their clock app.
 */
export function pickAlarmSound(callback) {
  if (Platform.OS === 'android') {
    // Use Android's built-in RingtoneManager picker
    // This requires a small native module (SoundPickerModule)
    NativeModules.SoundPickerModule?.pickRingtone((result) => {
      if (result) callback({ name: result.title, uri: result.uri, custom: true });
    });
  }
}
