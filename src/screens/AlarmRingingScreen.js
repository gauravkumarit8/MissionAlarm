import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, BackHandler } from 'react-native';
import MemoryMatchGrid from '../components/MemoryMatchGrid';
import {
  startAlarmSound,
  stopAlarmSound,
  startVolumeProtection,
  stopVolumeProtection,
  getIOSVolumeFallbackMessage,
} from '../utils/soundManager';
import { getPairsRequired, getRating } from '../utils/difficulty';
import { useAlarmStore } from '../store/useAlarmStore';

export default function AlarmRingingScreen({ route, navigation }) {
  const alarm = route.params?.alarm;
  const recordSuccessfulDismiss = useAlarmStore((s) => s.recordSuccessfulDismiss);
  const recordSnooze = useAlarmStore((s) => s.recordSnooze);
  const resetSnoozeCount = useAlarmStore((s) => s.resetSnoozeCount);
  const clearRingingAlarm = useAlarmStore((s) => s.clearRingingAlarm);

  const [progress, setProgress] = useState({ matched: 0, total: 0, flips: 0 });
  const [snoozeFeedback, setSnoozeFeedback] = useState(false);

  const pairsRequired = getPairsRequired({ snoozeCount: alarm?.snoozeCount || 0 });

  useEffect(() => {
    // Disable the hardware back button — back button should never dismiss an alarm
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);

    startAlarmSound(alarm?.soundFile || 'alarm_default.mp3').catch((e) =>
      console.warn('Could not start alarm sound', e)
    );
    startVolumeProtection();

    return () => {
      backSub.remove();
      stopAlarmSound();
      stopVolumeProtection();
    };
  }, [alarm]);

  const handleComplete = useCallback(
    ({ flips, timeSeconds }) => {
      const rating = getRating(flips, pairsRequired);
      stopAlarmSound();
      recordSuccessfulDismiss({ flips, timeSeconds, rating, pairsRequired });
      resetSnoozeCount(alarm?.id);
      clearRingingAlarm();
      navigation.replace('DismissSuccess', { flips, timeSeconds, rating });
    },
    [pairsRequired, alarm, navigation, recordSuccessfulDismiss, resetSnoozeCount, clearRingingAlarm]
  );

  const handleSnooze = useCallback(() => {
    stopAlarmSound();
    stopVolumeProtection();
    recordSnooze(alarm?.id);
    setSnoozeFeedback(true);

    setTimeout(() => {
      // In production: reschedule via notifee for now + 5 min and navigate back
      navigation.goBack();
    }, 600);
  }, [alarm, recordSnooze, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.time}>
          {new Date().getHours().toString().padStart(2, '0')}:
          {new Date().getMinutes().toString().padStart(2, '0')}
        </Text>
        <Text style={styles.label}>{alarm?.label || 'Alarm'}</Text>
        <View style={styles.ringPill}>
          <View style={styles.ringDot} />
          <Text style={styles.ringText}>Alarm ringing</Text>
        </View>
      </View>

      <Text style={styles.instructions}>
        Match all {pairsRequired} pairs to dismiss
      </Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {progress.matched}/{pairsRequired} pairs
        </Text>
        <Text style={styles.progressLabel}>{progress.flips} flips</Text>
      </View>

      <MemoryMatchGrid
        pairsRequired={pairsRequired}
        onProgress={setProgress}
        onComplete={handleComplete}
      />

      {Platform.OS === 'ios' && (
        <Text style={styles.iosNotice}>{getIOSVolumeFallbackMessage()}</Text>
      )}

      <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze}>
        <Text style={styles.snoozeText}>
          {snoozeFeedback ? 'Snoozed for 5 min...' : 'Snooze (+4 pairs next time)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  time: { fontSize: 56, fontWeight: '300', color: '#fff', letterSpacing: -2 },
  label: { fontSize: 14, color: '#888', marginTop: 4 },
  ringPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(231,76,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
  },
  ringDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c' },
  ringText: { fontSize: 12, color: '#e74c3c' },
  instructions: { textAlign: 'center', fontSize: 14, color: '#aaa', marginBottom: 16 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: { fontSize: 12, color: '#666' },
  iosNotice: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  snoozeBtn: {
    marginTop: 'auto',
    marginBottom: 30,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    backgroundColor: '#151520',
  },
  snoozeText: { color: '#888', fontSize: 13 },
});
