import { LocalNotifications } from '@capacitor/local-notifications';
import type { Affirmation } from '../data/affirmations';
import { getDailyAffirmation } from '../data/affirmations';
import type { UserSettings } from '../types/settings';

const DAILY_NOTIFICATION_ID = 1;

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
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

  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const affirmation = getDailyAffirmation(custom, settings.focusCategories);
    const greeting = settings.name ? `Good morning, ${settings.name}` : 'Good morning';

    await LocalNotifications.cancel({ notifications: [{ id: DAILY_NOTIFICATION_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_NOTIFICATION_ID,
          title: `${greeting} ✨`,
          body: affirmation.text,
          schedule: {
            on: {
              hour: settings.notificationHour,
              minute: settings.notificationMinute,
            },
            repeats: true,
          },
        },
      ],
    });
  } catch {
    // Notifications unavailable on web
  }
}

export async function cancelDailyNotification(): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_NOTIFICATION_ID }] });
  } catch {
    // Notifications unavailable
  }
}
