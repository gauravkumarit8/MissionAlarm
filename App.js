import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useAlarmStore } from './src/store/useAlarmStore';
import { setupAlarmChannel } from './src/utils/alarmScheduler';

// Handle notification tap when app is in background/killed
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const alarmId = detail.notification?.data?.alarmId;
    if (alarmId) {
      useAlarmStore.getState().setRingingAlarm({ id: alarmId });
    }
  }
});

function App() {
  const hydrate = useAlarmStore((s) => s.hydrate);
  const setRingingAlarm = useAlarmStore((s) => s.setRingingAlarm);
  const alarms = useAlarmStore((s) => s.alarms);

  useEffect(() => {
    hydrate();
    setupAlarmChannel().catch((e) =>
      console.warn('Alarm channel setup failed:', e.message)
    );

    // Handle notification tap when app is in foreground
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const alarmId = detail.notification?.data?.alarmId;
        if (alarmId) {
          const alarm = useAlarmStore.getState().alarms.find(a => a.id === alarmId)
            || { id: alarmId, label: 'Alarm', snoozeCount: 0 };
          setRingingAlarm(alarm);
        }
      }
    });

    return () => unsubscribe();
  }, [hydrate, setRingingAlarm]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a14" />
        <View style={styles.flex}>
          <RootNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
export default App;
