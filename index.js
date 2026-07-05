import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Background event handler must be registered before AppRegistry
try {
  const notifee = require('@notifee/react-native').default;
  const { EventType } = require('@notifee/react-native');
  const { useAlarmStore } = require('./src/store/useAlarmStore');

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      const alarmId = detail.notification?.data?.alarmId;
      if (alarmId) {
        useAlarmStore.getState().setRingingAlarm({ id: alarmId });
      }
    }
  });
} catch (e) {
  console.warn('Notifee background handler failed:', e.message);
}

AppRegistry.registerComponent(appName, () => App);
