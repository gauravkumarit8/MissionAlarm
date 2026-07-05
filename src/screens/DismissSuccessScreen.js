import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAlarmStore } from '../store/useAlarmStore';

export default function DismissSuccessScreen({ route, navigation }) {
  const { flips, timeSeconds, rating } = route.params || {};
  const stats = useAlarmStore((s) => s.stats);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>☀️</Text>
      <Text style={styles.title}>Good morning!</Text>
      <Text style={styles.sub}>Brain fully activated. Alarm dismissed.</Text>

      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>🔥 {stats.currentStreak}-day streak</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="flips" value={flips ?? '—'} />
        <Stat label="time" value={timeSeconds != null ? `${timeSeconds}s` : '—'} />
        <Stat label="rating" value={rating ?? '—'} />
      </View>

      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 6 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20, textAlign: 'center' },
  streakBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0d2318',
    borderWidth: 1,
    borderColor: '#1D9E75',
    marginBottom: 22,
  },
  streakText: { color: '#5DCAA5', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: "row", marginBottom: 30, justifyContent: "center" },
  statBox: { marginHorizontal: 5,
    backgroundColor: '#151520',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '600', color: '#fff' },
  statLabel: { fontSize: 11, color: '#555', marginTop: 2 },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    backgroundColor: '#151520',
  },
  doneBtnText: { color: '#aaa', fontSize: 14 },
});
