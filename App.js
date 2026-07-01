import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { useAlarmStore } from './src/store/useAlarmStore';
import { setupAlarmChannel } from './src/utils/alarmScheduler';

function App() {
  const hydrate = useAlarmStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    setupAlarmChannel().catch((e) =>
      console.warn('Alarm channel setup failed:', e.message)
    );
  }, [hydrate]);

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
