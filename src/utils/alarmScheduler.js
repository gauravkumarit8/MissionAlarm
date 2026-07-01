import notifee, {
  AndroidImportance,
  AndroidCategory,
  TriggerType,
  RepeatFrequency,
  AndroidNotificationSetting,
} from '@notifee/react-native';
import { Platform } from 'react-native';

const ALARM_CHANNEL_ID = 'mission-alarm-channel';

/**
 * Must be called once at app startup (e.g. in App.tsx).
 * Creates the Android notification channel that's used to fire
 * full-screen alarm intents even when the app is backgrounded/killed.
 */
export async function setupAlarmChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'Alarms',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      bypassDnd: true, // requires user to grant "Do Not Disturb access" for full effect
    });
  }

  await notifee.requestPermission();

  // Android 12+ requires explicit exact-alarm permission
  if (Platform.OS === 'android') {
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
      // Deep-links to system settings so the user can grant "Alarms & reminders"
      await notifee.openAlarmPermissionSettings();
    }
  }
}

/**
 * Schedules a single alarm to fire at the given Date.
 * Uses a full-screen notification intent so it wakes the device
 * and launches the app's ringing screen directly, similar to native clock apps.
 */
export async function scheduleAlarm(alarm) {
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: alarm.nextTriggerAt, // epoch ms
    alarmManager: {
      allowWhileIdle: true, // fires even in Doze mode
    },
  };

  await notifee.createTriggerNotification(
    {
      id: alarm.id,
      title: alarm.label || 'Alarm',
      body: 'Tap to open your wake-up challenge',
      android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: 'default', // launches the app full-screen, even over lock screen
        },
        pressAction: { id: 'default' },
        autoCancel: false,
        ongoing: true,
        loopSound: true,
      },
      ios: {
        sound: 'default.wav',
        critical: true, // requires Critical Alerts entitlement from Apple
        interruptionLevel: 'critical',
      },
      data: { alarmId: alarm.id },
    },
    trigger
  );
}

export async function cancelAlarm(alarmId) {
  await notifee.cancelTriggerNotification(alarmId);
}

/**
 * Computes the next epoch timestamp this alarm should fire at,
 * based on time-of-day + selected repeat days.
 */
export function computeNextTrigger({ hour, minute, repeatDays }) {
  const now = new Date();
  const candidate = new Date();
  candidate.setHours(hour, minute, 0, 0);

  if (!repeatDays || repeatDays.length === 0) {
    // one-off alarm: next occurrence of this time, today or tomorrow
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate.getTime();
  }

  // repeating alarm: find the next matching weekday (0=Sun..6=Sat)
  for (let i = 0; i < 8; i++) {
    const check = new Date(candidate);
    check.setDate(candidate.getDate() + i);
    const isToday = i === 0;
    const valid = repeatDays.includes(check.getDay()) && (!isToday || check > now);
    if (valid) return check.getTime();
  }
  return candidate.getTime();
}
