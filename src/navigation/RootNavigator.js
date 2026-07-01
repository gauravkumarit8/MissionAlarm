import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';
import DismissSuccessScreen from '../screens/DismissSuccessScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0a0a14' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mission Alarm' }} />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen} options={{ title: 'Alarm' }} />
        <Stack.Screen
          name="AlarmRinging"
          component={AlarmRingingScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="DismissSuccess"
          component={DismissSuccessScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
