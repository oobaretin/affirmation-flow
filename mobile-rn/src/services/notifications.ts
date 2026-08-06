import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Affirmation } from '../data/affirmations';
import { getDailyAffirmation } from '../data/affirmations';
import type { UserSettings } from '../types/settings';

const DAILY_NOTIFICATION_ID = 'daily-affirmation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function scheduleDailyNotification(
  settings: Pick<
    UserSettings,
    'name' | 'notificationsEnabled' | 'notificationHour' | 'notificationMinute' | 'focusCategories'
  >,
  custom: Affirmation[] = [],
): Promise<void> {
  if (!settings.notificationsEnabled) {
    await cancelDailyNotification();
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const affirmation = getDailyAffirmation(custom, settings.focusCategories);
  const greeting = settings.name ? `Good morning, ${settings.name}` : 'Good morning';

  await cancelDailyNotification();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIFICATION_ID,
    content: {
      title: `${greeting} ✨`,
      body: affirmation.text,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.notificationHour,
      minute: settings.notificationMinute,
    },
  });
}

export async function cancelDailyNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
}
