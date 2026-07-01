import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useAlarmStore } from '../store/useAlarmStore';

export default function HomeScreen({ navigation }) {
  const alarms = useAlarmStore((s) => s.alarms);
  const stats = useAlarmStore((s) => s.stats);
  const hydrate = useAlarmStore((s) => s.hydrate);
  const hydrated = useAlarmStore((s) => s.hydrated);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.alarmRow}>
        <TouchableOpacity
          style={styles.alarmInfo}
          onPress={() => navigation.navigate('EditAlarm', { alarmId: item.id })}
        >
          <Text style={styles.alarmTime}>
            {String(item.hour).padStart(2, '0')}:{String(item.minute).padStart(2, '0')}
          </Text>
          <Text style={styles.alarmLabel}>{item.label || 'Alarm'}</Text>
          <Text style={styles.alarmDays}>{formatRepeatDays(item.repeatDays)}</Text>
        </TouchableOpacity>
        <Switch value={item.enabled} onValueChange={() => toggleAlarm(item.id)} />
      </View>
    ),
    [navigation, toggleAlarm]
  );

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <Text style={styles.streakNum}>{stats.currentStreak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
        <Text style={styles.streakSub}>longest: {stats.longestStreak} days</Text>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No alarms yet. Tap + to add your first one.</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EditAlarm', { alarmId: null })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Dev-only: simulate an alarm firing right now, for testing the ringing screen */}
      <TouchableOpacity
        style={styles.testBtn}
        onPress={() =>
          navigation.navigate('AlarmRinging', {
            alarm: { id: 'test', label: 'Test Alarm', snoozeCount: 0 },
          })
        }
      >
        <Text style={styles.testBtnText}>Trigger test alarm</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatRepeatDays(days) {
  if (!days || days.length === 0) return 'Once';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((d) => names[d]).join(', ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14', paddingTop: 16, paddingHorizontal: 16 },
  streakCard: {
    backgroundColor: '#151520',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  streakNum: { fontSize: 36, fontWeight: '600', color: '#5DCAA5' },
  streakLabel: { fontSize: 13, color: '#888' },
  streakSub: { fontSize: 11, color: '#555', marginTop: 4 },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151520',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alarmInfo: { flex: 1 },
  alarmTime: { fontSize: 28, fontWeight: '300', color: '#fff' },
  alarmLabel: { fontSize: 13, color: '#999', marginTop: 2 },
  alarmDays: { fontSize: 11, color: '#555', marginTop: 2 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
  testBtn: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#3a3a58',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  testBtnText: { color: '#7F77DD', fontSize: 12 },
});
