import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './platform';

let channelsInitialized = false;

export async function initNotificationChannels(): Promise<void> {
  if (!isNative() || channelsInitialized) return;

  try {
    // 1. High priority channel for peer SOS beacons
    await LocalNotifications.createChannel({
      id: 'sos_channel',
      name: 'SOS Emergency Alerts',
      description: 'Urgent beacons when a circle peer is in acute crisis',
      importance: 5,
      visibility: 1, // Public on lockscreen for emergencies
      vibration: true,
      lights: true,
      lightColor: '#f43f5e',
    });

    // 2. Default channel for new peer messages and circle matching
    await LocalNotifications.createChannel({
      id: 'circle_channel',
      name: 'Peer Sanctuary Messages',
      description: 'Updates from your recovery support circle',
      importance: 3,
      visibility: 0, // Private on lockscreen to preserve anonymity
      vibration: true,
    });

    // 3. Low-stress reminder channel for daily sobriety check-ins
    await LocalNotifications.createChannel({
      id: 'reminder_channel',
      name: 'Daily Recovery Reminders',
      description: 'Gentle check-in and habit reminders',
      importance: 3,
      visibility: 0,
      vibration: false,
    });

    channelsInitialized = true;
  } catch (e) {
    console.debug('Failed to configure Android notification channels:', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      await initNotificationChannels();
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    if (req.display === 'granted') {
      await initNotificationChannels();
      return true;
    }
  } catch (e) {
    console.debug('Notification permission request error:', e);
  }
  return false;
}

export const notifications = {
  /**
   * Fires a high-priority local notification when an SOS distress alert is received
   * from another peer in the same support circle.
   */
  async showSosAlert(peerAlias: string, level: string): Promise<void> {
    if (!isNative()) return;
    try {
      await initNotificationChannels();
      const id = Math.floor(Math.random() * 1000000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: `🚨 SOS Beacon: ${level.toUpperCase()}`,
            body: `Peer ${peerAlias} is experiencing an acute urge and requested support.`,
            channelId: 'sos_channel',
            schedule: { at: new Date(Date.now() + 100) },
            extra: { type: 'sos', level },
          },
        ],
      });
    } catch (e) {
      console.debug('Failed to trigger SOS notification:', e);
    }
  },

  /**
   * Schedules a recurring daily check-in reminder at a specified hour (e.g. 20:00 = 8 PM).
   */
  async scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
    if (!isNative()) return;
    try {
      await initNotificationChannels();
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) return;

      // Cancel existing reminder with fixed ID 1001
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });

      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: 'RebootMind Daily Check-In',
            body: 'Take 60 seconds to honor your sobriety streak and complete your daily focus.',
            channelId: 'reminder_channel',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            extra: { route: '/sobriety' },
          },
        ],
      });
    } catch (e) {
      console.debug('Failed to schedule daily reminder:', e);
    }
  },
};
