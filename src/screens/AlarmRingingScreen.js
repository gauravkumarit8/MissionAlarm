import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, BackHandler, Vibration,
} from 'react-native';
import MemoryMatchGrid from '../components/MemoryMatchGrid';
import { getPairsRequired, getRating } from '../utils/difficulty';
import { useAlarmStore } from '../store/useAlarmStore';
import Sound from 'react-native-sound';

Sound.setCategory('Alarm');

// Vibration pattern: vibrate 500ms, pause 500ms, repeat
const VIBRATION_PATTERN = [500, 500];

export default function AlarmRingingScreen({ route, navigation }) {
  const alarm = route.params?.alarm;
  const recordSuccessfulDismiss = useAlarmStore((s) => s.recordSuccessfulDismiss);
  const recordSnooze = useAlarmStore((s) => s.recordSnooze);
  const resetSnoozeCount = useAlarmStore((s) => s.resetSnoozeCount);
  const clearRingingAlarm = useAlarmStore((s) => s.clearRingingAlarm);

  const [progress, setProgress] = useState({ matched: 0, total: 0, flips: 0 });
  const [snoozed, setSnoozed] = useState(false);
  const [ringText, setRingText] = useState('Alarm ringing');
  const soundRef = useRef(null);

  const pairsRequired = getPairsRequired({ snoozeCount: alarm?.snoozeCount || 0 });

  // Start sound + vibration
  useEffect(() => {
    // Start vibration loop
    Vibration.vibrate(VIBRATION_PATTERN, true);

    // Load and play alarm sound
    const sound = new Sound('alarm_default.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Sound load error:', error);
        return;
      }
      sound.setNumberOfLoops(-1); // loop forever
      sound.play((success) => {
        if (!success) console.warn('Sound playback failed');
      });
      soundRef.current = sound;
    });

    // Block hardware back button
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      backSub.remove();
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stop(() => soundRef.current.release());
        soundRef.current = null;
      }
    };
  }, []);

  const stopAlarm = useCallback(() => {
    Vibration.cancel();
    if (soundRef.current) {
      soundRef.current.stop(() => soundRef.current?.release());
      soundRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(
    ({ flips, timeSeconds }) => {
      stopAlarm();
      const rating = getRating(flips, pairsRequired);
      recordSuccessfulDismiss({ flips, timeSeconds, rating, pairsRequired });
      resetSnoozeCount(alarm?.id);
      clearRingingAlarm();
      navigation.replace('DismissSuccess', { flips, timeSeconds, rating });
    },
    [pairsRequired, alarm, navigation, stopAlarm,
     recordSuccessfulDismiss, resetSnoozeCount, clearRingingAlarm]
  );

  const handleSnooze = useCallback(() => {
    stopAlarm();
    setSnoozed(true);
    recordSnooze(alarm?.id);
    setTimeout(() => {
      clearRingingAlarm();
      navigation.goBack();
    }, 1500);
  }, [alarm, stopAlarm, recordSnooze, clearRingingAlarm, navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.time}>
          {String(new Date().getHours()).padStart(2, '0')}:
          {String(new Date().getMinutes()).padStart(2, '0')}
        </Text>
        <Text style={styles.label}>{alarm?.label || 'Alarm'}</Text>
        <View style={styles.ringPill}>
          <View style={styles.ringDot} />
          <Text style={styles.ringText}>{ringText}</Text>
        </View>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Match all {pairsRequired} pairs to dismiss
      </Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {progress.matched}/{pairsRequired} pairs matched
        </Text>
        <Text style={styles.progressLabel}>{progress.flips} flips</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progTrack}>
        <View
          style={[
            styles.progFill,
            { width: `${pairsRequired > 0 ? (progress.matched / pairsRequired) * 100 : 0}%` },
          ]}
        />
      </View>

      {/* Memory match game */}
      <View style={styles.gameContainer}>
        <MemoryMatchGrid
          pairsRequired={pairsRequired}
          onProgress={setProgress}
          onComplete={handleComplete}
        />
      </View>

      {/* iOS volume notice */}
      {Platform.OS === 'ios' && (
        <Text style={styles.iosNotice}>
          Lowering volume won't stop this alarm — finish the challenge to dismiss.
        </Text>
      )}

      {/* Snooze button */}
      <TouchableOpacity
        style={[styles.snoozeBtn, snoozed && styles.snoozeBtnDisabled]}
        onPress={handleSnooze}
        disabled={snoozed}
      >
        <Text style={styles.snoozeText}>
          {snoozed
            ? 'Snoozed — alarm in 5 min...'
            : `Snooze +5 min  (adds ${Math.min(4, 12 - pairsRequired)} pairs next time)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  time: { fontSize: 52, fontWeight: '300', color: '#fff', letterSpacing: -2 },
  label: { fontSize: 14, color: '#888', marginTop: 4 },
  ringPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, backgroundColor: 'rgba(231,76,60,0.12)',
    borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)',
  },
  ringDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c' },
  ringText: { fontSize: 12, color: '#e74c3c' },
  instructions: { textAlign: 'center', fontSize: 14, color: '#aaa', marginBottom: 10 },
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: '#666' },
  progTrack: {
    height: 4, backgroundColor: '#1e1e2e', borderRadius: 2,
    overflow: 'hidden', marginBottom: 14,
  },
  progFill: { height: '100%', backgroundColor: '#378ADD', borderRadius: 2 },
  gameContainer: { flex: 1 },
  iosNotice: {
    fontSize: 11, color: '#555', textAlign: 'center',
    marginVertical: 8, paddingHorizontal: 10,
  },
  snoozeBtn: {
    marginTop: 12, alignSelf: 'stretch',
    paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a3a', backgroundColor: '#151520',
    alignItems: 'center',
  },
  snoozeBtnDisabled: { opacity: 0.5 },
  snoozeText: { color: '#888', fontSize: 13 },
});
