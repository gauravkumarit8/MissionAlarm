import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, BackHandler, Vibration, NativeModules } from 'react-native';
import MemoryMatchGrid from '../components/MemoryMatchGrid';
import { getPairsRequired, getRating } from '../utils/difficulty';
import { useAlarmStore } from '../store/useAlarmStore';
import Sound from 'react-native-sound';

Sound.setCategory('Alarm', true);

const { WakeLockModule } = NativeModules;
const VIBRATION_PATTERN = [0, 800, 400];

export default function AlarmRingingScreen({ route, navigation }) {
  const alarm = route.params?.alarm;
  const recordSuccessfulDismiss = useAlarmStore((s) => s.recordSuccessfulDismiss);
  const recordSnooze = useAlarmStore((s) => s.recordSnooze);
  const resetSnoozeCount = useAlarmStore((s) => s.resetSnoozeCount);
  const clearRingingAlarm = useAlarmStore((s) => s.clearRingingAlarm);

  const [progress, setProgress] = useState({ matched: 0, total: 0, flips: 0 });
  const [snoozed, setSnoozed] = useState(false);
  const soundRef = useRef(null);

  const pairsRequired = getPairsRequired({ snoozeCount: alarm?.snoozeCount || 0 });

  const stopEverything = useCallback(() => {
    Vibration.cancel();
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }
    try { WakeLockModule?.release(); } catch (e) {}
  }, []);

  useEffect(() => {
    try { WakeLockModule?.acquire(); } catch (e) {}
    Vibration.vibrate(VIBRATION_PATTERN, true);

    const basePath = Platform.OS === 'android' ? null : Sound.MAIN_BUNDLE;
    const sound = new Sound('alarm_default.mp3', basePath, (err) => {
      if (!err) {
        sound.setNumberOfLoops(-1);
        sound.setVolume(1.0);
        sound.play();
        soundRef.current = sound;
      } else {
        console.warn('[Sound] Load error:', err);
      }
    });

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      backSub.remove();
      stopEverything();
    };
  }, [stopEverything]);

  const handleComplete = useCallback(({ flips, timeSeconds }) => {
    stopEverything();
    const rating = getRating(flips, pairsRequired);
    recordSuccessfulDismiss({ flips, timeSeconds, rating, pairsRequired });
    resetSnoozeCount(alarm?.id);
    clearRingingAlarm();
    navigation.replace('DismissSuccess', { flips, timeSeconds, rating });
  }, [pairsRequired, alarm, navigation, stopEverything, recordSuccessfulDismiss, resetSnoozeCount, clearRingingAlarm]);

  const handleSnooze = useCallback(() => {
    if (snoozed) return;
    setSnoozed(true);
    stopEverything();
    recordSnooze(alarm?.id);
    setTimeout(() => {
      clearRingingAlarm();
      navigation.goBack();
    }, 800);
  }, [snoozed, alarm, stopEverything, recordSnooze, clearRingingAlarm, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.time}>
          {String(new Date().getHours()).padStart(2, '0')}:
          {String(new Date().getMinutes()).padStart(2, '0')}
        </Text>
        <Text style={styles.label}>{alarm?.label || 'Alarm'}</Text>
        <View style={styles.ringPill}>
          <View style={styles.ringDot} />
          <Text style={styles.ringText}>{snoozed ? 'Snoozed 5 min' : 'Alarm ringing'}</Text>
        </View>
      </View>

      <Text style={styles.instructions}>Match all {pairsRequired} pairs to dismiss</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{progress.matched}/{pairsRequired} pairs</Text>
        <Text style={styles.progressLabel}>{progress.flips} flips</Text>
      </View>
      <View style={styles.progTrack}>
        <View style={[styles.progFill, { width: pairsRequired > 0 ? ((progress.matched / pairsRequired) * 100) + '%' : '0%' }]} />
      </View>

      <View style={styles.gameContainer}>
        <MemoryMatchGrid pairsRequired={pairsRequired} onProgress={setProgress} onComplete={handleComplete} />
      </View>

      <TouchableOpacity
        style={[styles.snoozeBtn, snoozed && styles.snoozeBtnDisabled]}
        onPress={handleSnooze}
        disabled={snoozed}
      >
        <Text style={styles.snoozeTitle}>{snoozed ? 'Snoozed — alarm in 5 min' : 'Snooze +5 min'}</Text>
        {!snoozed && <Text style={styles.snoozeSub}>Adds {Math.min(4, 12 - pairsRequired)} more pairs next time</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24 },
  header: { alignItems: 'center', marginBottom: 20 },
  time: { fontSize: 52, fontWeight: '300', color: '#fff', letterSpacing: -2 },
  label: { fontSize: 14, color: '#888', marginTop: 4 },
  ringPill: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(231,76,60,0.12)', borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)' },
  ringDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e74c3c', marginRight: 6 },
  ringText: { fontSize: 12, color: '#e74c3c' },
  instructions: { textAlign: 'center', fontSize: 14, color: '#aaa', marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#666' },
  progTrack: { height: 4, backgroundColor: '#1e1e2e', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progFill: { height: '100%', backgroundColor: '#378ADD', borderRadius: 2 },
  gameContainer: { flex: 1 },
  snoozeBtn: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: '#2a2a3a', backgroundColor: '#151520', alignItems: 'center' },
  snoozeBtnDisabled: { opacity: 0.4 },
  snoozeTitle: { color: '#aaa', fontSize: 14, fontWeight: '500' },
  snoozeSub: { color: '#555', fontSize: 11, marginTop: 3 },
});
