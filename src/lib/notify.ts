export interface AlertEntry {
  matchId: number;
  kickoffUTC: string;
  homeTeam: string;
  awayTeam: string;
  reminderMins: number;
}

let cachedToken: string | null = null;
let tokenRegistered = false;

// iOS Safari outside an installed PWA has no Notification global
export function notificationsGranted(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

export function getCachedToken(): string | null { return cachedToken; }

export async function fetchToken(): Promise<string | null> {
  try {
    const { getFCMToken } = await import("./firebase");
    const t = await getFCMToken();
    if (t) cachedToken = t;
    return t;
  } catch (e) {
    console.error("[FCM] fetchToken failed:", e);
    return null;
  }
}

export function teamSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") {
    await registerFCMToken();
    return "granted";
  }
  if (Notification.permission !== "default") return Notification.permission;
  const perm = await Notification.requestPermission();
  if (perm === "granted") await registerFCMToken();
  return perm;
}

export async function registerAndSyncAlerts(alerts: AlertEntry[]): Promise<void> {
  await registerFCMToken();
  if (alerts.length > 0) await syncAlertsToFirestore(alerts);
}

async function registerFCMToken(): Promise<void> {
  if (tokenRegistered) return;
  tokenRegistered = true;
  try {
    if (!("serviceWorker" in navigator)) return;
    const { getFCMToken, db } = await import("./firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const token = await getFCMToken();
    if (!token) return;
    cachedToken = token;
    await setDoc(doc(db, "subs", token), { token, ts: Date.now() }, { merge: true });
  } catch (e) {
    console.error("[FCM] registerFCMToken failed:", e);
    tokenRegistered = false;
  }
}

// Match topic subscribe/unsubscribe are no-ops — the VPS poller handles
// FCM topic subscriptions by reading subs/{token} every 60s.
export async function subscribeToMatchTopic(_matchId: number): Promise<void> { /* handled by VPS */ }
export async function unsubscribeFromMatchTopic(_matchId: number): Promise<void> { /* handled by VPS */ }

export async function syncAlertsToFirestore(alerts: AlertEntry[]): Promise<void> {
  try {
    if (!cachedToken) return;
    const { db } = await import("./firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const payload = alerts.map((a) => ({
      matchId: a.matchId,
      kickoffUTC: a.kickoffUTC,
      homeTeam: a.homeTeam,
      awayTeam: a.awayTeam,
      reminderMins: a.reminderMins,
    }));
    await setDoc(doc(db, "subs", cachedToken), { alerts: payload }, { merge: true });
  } catch {
    // Sync failed — local alerts still work
  }
}

export async function syncFavoritesToFirestore(favorites: string[]): Promise<void> {
  if (!cachedToken) await registerFCMToken();
  if (!cachedToken) return;
  try {
    const { db } = await import("./firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "subs", cachedToken), { favorites }, { merge: true });
  } catch {
    // Non-critical — VPS will pick up on next checkReminders cycle
  }
}

function reminderLabel(mins: number): string {
  if (mins < 60) return `${mins} minutes`;
  return "1 hour";
}

export function scheduleKickoffAlert(entry: AlertEntry): void {
  const mins = entry.reminderMins ?? 60;
  const alertMs = new Date(entry.kickoffUTC).getTime() - mins * 60 * 1000;
  const delay = alertMs - Date.now();
  if (delay <= 0 || delay > 14 * 24 * 60 * 60 * 1000) return;
  setTimeout(() => {
    if (notificationsGranted()) {
      new Notification(`${entry.homeTeam} vs ${entry.awayTeam}`, {
        body: `Kicks off in ${reminderLabel(mins)}!`,
        tag: `wc26-remind-${entry.matchId}`,
        icon: "/icon-192.png",
      });
    }
  }, delay);
}

export function checkOnOpenAlerts(alerts: AlertEntry[]): void {
  if (!notificationsGranted()) return;
  const now = Date.now();
  for (const a of alerts) {
    const kickoffMs = new Date(a.kickoffUTC).getTime();
    const alertMs = kickoffMs - a.reminderMins * 60 * 1000;
    const sinceAlert = now - alertMs;
    if (sinceAlert >= 0 && sinceAlert < 20 * 60 * 1000) {
      const minsLeft = Math.max(0, Math.round((kickoffMs - now) / 60000));
      new Notification(`${a.homeTeam} vs ${a.awayTeam}`, {
        body: minsLeft > 0 ? `Kicks off in ${minsLeft} min!` : "Match has kicked off!",
        tag: `wc26-${a.matchId}`,
        icon: "/icon-192.png",
      });
    } else if (alertMs > now) {
      scheduleKickoffAlert(a);
    }
  }
}
