import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALARMS_KEY = '@mission_alarm/alarms';
const STATS_KEY = '@mission_alarm/stats';

export const CHALLENGE_TYPES = {
  MEMORY_MATCH: 'memory_match',
  MATH: 'math',
};

const defaultStats = {
  currentStreak: 0,
  longestStreak: 0,
  lastDismissDate: null, // 'YYYY-MM-DD'
  history: [], // { date, flips, timeSeconds, rating }
};

export const useAlarmStore = create((set, get) => ({
  alarms: [],
  stats: defaultStats,
  ringingAlarm: null, // currently ringing alarm object, or null
  hydrated: false,

  // ---- Persistence ----
  hydrate: async () => {
    try {
      const [alarmsRaw, statsRaw] = await Promise.all([
        AsyncStorage.getItem(ALARMS_KEY),
        AsyncStorage.getItem(STATS_KEY),
      ]);
      set({
        alarms: alarmsRaw ? JSON.parse(alarmsRaw) : [],
        stats: statsRaw ? JSON.parse(statsRaw) : defaultStats,
        hydrated: true,
      });
    } catch (e) {
      console.warn('Failed to hydrate alarm store', e);
      set({ hydrated: true });
    }
  },

  persistAlarms: async (alarms) => {
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  },

  persistStats: async (stats) => {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  },

  // ---- Alarm CRUD ----
  addAlarm: (alarm) => {
    const alarms = [...get().alarms, alarm];
    set({ alarms });
    get().persistAlarms(alarms);
  },

  updateAlarm: (id, updates) => {
    const alarms = get().alarms.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ alarms });
    get().persistAlarms(alarms);
  },

  deleteAlarm: (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    set({ alarms });
    get().persistAlarms(alarms);
  },

  toggleAlarm: (id) => {
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    set({ alarms });
    get().persistAlarms(alarms);
  },

  // ---- Ringing lifecycle ----
  setRingingAlarm: (alarm) => set({ ringingAlarm: alarm }),
  clearRingingAlarm: () => set({ ringingAlarm: null }),

  // ---- Stats / streak ----
  recordSuccessfulDismiss: ({ flips, timeSeconds, rating, pairsRequired }) => {
    const today = new Date().toISOString().slice(0, 10);
    const stats = get().stats;

    let newStreak = stats.currentStreak;
    if (stats.lastDismissDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      newStreak = stats.lastDismissDate === yesterday ? stats.currentStreak + 1 : 1;
    }

    const newStats = {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stats.longestStreak),
      lastDismissDate: today,
      history: [
        { date: today, flips, timeSeconds, rating, pairsRequired },
        ...stats.history,
      ].slice(0, 60),
    };

    set({ stats: newStats });
    get().persistStats(newStats);
    return newStats;
  },

  recordSnooze: (alarmId) => {
    // Track snooze count on the alarm itself, used to scale next challenge difficulty
    const alarms = get().alarms.map((a) =>
      a.id === alarmId ? { ...a, snoozeCount: (a.snoozeCount || 0) + 1 } : a
    );
    set({ alarms });
    get().persistAlarms(alarms);
  },

  resetSnoozeCount: (alarmId) => {
    const alarms = get().alarms.map((a) =>
      a.id === alarmId ? { ...a, snoozeCount: 0 } : a
    );
    set({ alarms });
    get().persistAlarms(alarms);
  },
}));
