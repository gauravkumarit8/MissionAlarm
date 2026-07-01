import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAlarmStore } from '../store/useAlarmStore';
import { computeNextTrigger, scheduleAlarm, cancelAlarm } from '../utils/alarmScheduler';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function EditAlarmScreen({ route, navigation }) {
  const alarmId = route.params?.alarmId;
  const alarms = useAlarmStore((s) => s.alarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  const existing = useMemo(() => alarms.find((a) => a.id === alarmId), [alarms, alarmId]);

  const [hour, setHour] = useState(existing?.hour ?? 6);
  const [minute, setMinute] = useState(existing?.minute ?? 30);
  const [label, setLabel] = useState(existing?.label ?? '');
  const [repeatDays, setRepeatDays] = useState(existing?.repeatDays ?? []);

  const toggleDay = (day) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    const nextTriggerAt = computeNextTrigger({ hour, minute, repeatDays });
    const alarm = {
      id: existing?.id || `alarm_${Date.now()}`,
      hour,
      minute,
      label,
      repeatDays,
      enabled: true,
      snoozeCount: existing?.snoozeCount || 0,
      nextTriggerAt,
      challengeType: 'memory_match',
    };

    if (existing) {
      updateAlarm(alarm.id, alarm);
      await cancelAlarm(alarm.id);
    } else {
      addAlarm(alarm);
    }

    try {
      await scheduleAlarm(alarm);
    } catch (e) {
      console.warn('Could not schedule native alarm (expected in dev/sandbox):', e.message);
    }

    navigation.goBack();
  };

  const handleDelete = async () => {
    if (existing) {
      await cancelAlarm(existing.id);
      deleteAlarm(existing.id);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.timeRow}>
        <NumberStepper value={hour} setValue={setHour} max={23} pad />
        <Text style={styles.colon}>:</Text>
        <NumberStepper value={minute} setValue={setMinute} max={59} pad />
      </View>

      <Text style={styles.sectionLabel}>Label</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Morning workout"
        placeholderTextColor="#555"
      />

      <Text style={styles.sectionLabel}>Repeat</Text>
      <View style={styles.dayRow}>
        {DAY_LABELS.map((d, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.dayChip, repeatDays.includes(idx) && styles.dayChipActive]}
            onPress={() => toggleDay(idx)}
          >
            <Text style={[styles.dayChipText, repeatDays.includes(idx) && styles.dayChipTextActive]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Wake challenge</Text>
      <View style={styles.challengeBox}>
        <Text style={styles.challengeName}>🧩 Memory Match</Text>
        <Text style={styles.challengeDesc}>
          Match pairs to dismiss. Snoozing adds more pairs next time.
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{existing ? 'Save changes' : 'Create alarm'}</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete alarm</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function NumberStepper({ value, setValue, max, pad }) {
  const display = pad ? String(value).padStart(2, '0') : String(value);
  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={() => setValue((value + 1) % (max + 1))}>
        <Text style={styles.stepperArrow}>▲</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{display}</Text>
      <TouchableOpacity onPress={() => setValue((value - 1 + (max + 1)) % (max + 1))}>
        <Text style={styles.stepperArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  stepper: { alignItems: 'center', width: 70 },
  stepperArrow: { fontSize: 14, color: '#555', paddingVertical: 6 },
  stepperValue: { fontSize: 48, fontWeight: '300', color: '#fff' },
  colon: { fontSize: 48, fontWeight: '300', color: '#fff', marginHorizontal: 4 },
  sectionLabel: { fontSize: 12, color: '#666', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#151520',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151520',
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  dayChipActive: { backgroundColor: '#378ADD', borderColor: '#378ADD' },
  dayChipText: { color: '#666', fontSize: 13 },
  dayChipTextActive: { color: '#fff', fontWeight: '600' },
  challengeBox: {
    backgroundColor: '#151520',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  challengeName: { fontSize: 15, color: '#fff', marginBottom: 4 },
  challengeDesc: { fontSize: 12, color: '#888', lineHeight: 18 },
  saveBtn: {
    marginTop: 30,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { marginTop: 12, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: '#e74c3c', fontSize: 13 },
});
