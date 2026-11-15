// The iOS app (Capacitor) runs the same React app from bundled files. This module holds the few
// places where the app behaves differently from the website. Plugins load only inside the app.
import {Capacitor} from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
/** Custom URL scheme the Google sign-in returns to (also registered in Info.plist). */
export const AUTH_CALLBACK = 'com.keyvanmahmoudi.nederlands://auth';

type Feedback = 'success' | 'error' | 'tap';
/** A short vibration for right and wrong answers. Does nothing on the website. */
export function haptic(kind: Feedback) {
  if (!isNative) return;
  void import('@capacitor/haptics').then(({Haptics, ImpactStyle, NotificationType}) => {
    if (kind === 'tap') return Haptics.impact({style: ImpactStyle.Light});
    return Haptics.notification({type: kind === 'success' ? NotificationType.Success : NotificationType.Error});
  }).catch(() => {});
}

/** Status bar colours follow the light or dark theme. */
export function syncStatusBar(dark: boolean) {
  if (!isNative) return;
  void import('@capacitor/status-bar').then(({StatusBar, Style}) => StatusBar.setStyle({style: dark ? Style.Dark : Style.Light})).catch(() => {});
}

export async function hideSplash() {
  if (!isNative) return;
  try {
    const {SplashScreen} = await import('@capacitor/splash-screen');
    await SplashScreen.hide({fadeOutDuration: 200});
  } catch { /* The splash screen also hides on its own. */ }
}

/* Daily reminder: one local notification a day at the chosen hour. */
const REMINDER_ID = 1;
const reminders = [
  'Tijd voor een klein rondje Nederlands!',
  'Je streak wacht op je. Vijf kaartjes?',
  'Even oefenen? Het duurt maar een paar minuten.',
  'Doe je mee? Er staan kaartjes voor je klaar.',
];

export async function reminderHour(): Promise<number | null> {
  if (!isNative) return null;
  const {LocalNotifications} = await import('@capacitor/local-notifications');
  const {notifications} = await LocalNotifications.getPending();
  const pending = notifications.find((item) => item.id === REMINDER_ID);
  const hour = pending?.schedule?.on?.hour;
  return typeof hour === 'number' ? hour : null;
}

/** Schedules (or with null, cancels) the daily reminder. Returns false when notifications are not allowed. */
export async function setReminder(hour: number | null) {
  if (!isNative) return false;
  const {LocalNotifications} = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({notifications: [{id: REMINDER_ID}]});
  if (hour === null) return true;
  let permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') return false;
  await LocalNotifications.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'Nedfa',
      body: reminders[new Date().getDate() % reminders.length],
      schedule: {on: {hour, minute: 0}, allowWhileIdle: true},
      extra: {route: 'oefenen'},
    }],
  });
  return true;
}

/** App start: hide the splash once the page is drawn, and open practice from a reminder. */
export async function startNative() {
  if (!isNative) return;
  document.documentElement.classList.add('native');
  // The splash stays until the first screen is drawn (App calls hideSplash); this is only a safety net.
  setTimeout(() => void hideSplash(), 8000);
  try {
    const {LocalNotifications} = await import('@capacitor/local-notifications');
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const route = event.notification.extra?.route;
      if (typeof route === 'string' && /^[a-z]+$/.test(route)) location.hash = route;
    });
  } catch { /* Reminders are optional. */ }
}
