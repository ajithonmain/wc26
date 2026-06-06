export interface AlertEntry {
  matchId: number;
  kickoffUTC: string;
  homeTeam: string;
  awayTeam: string;
  reminderMins: number; // 30 | 60 | 120
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function scheduleKickoffAlert(entry: AlertEntry): void {
  const mins = entry.reminderMins ?? 60;
  const alertMs = new Date(entry.kickoffUTC).getTime() - mins * 60 * 1000;
  const delay = alertMs - Date.now();
  if (delay <= 0 || delay > 14 * 24 * 60 * 60 * 1000) return;
  const label = mins === 30 ? "30 minutes" : mins === 120 ? "2 hours" : "1 hour";
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`${entry.homeTeam} vs ${entry.awayTeam}`, {
        body: `Kicks off in ${label}!`,
        tag: `wc26-remind-${entry.matchId}`,
        icon: "/soccer.png",
      });
    }
  }, delay);
}

// Alarm exactly at kickoff
export function scheduleKickoffAlarm(entry: AlertEntry): void {
  const delay = new Date(entry.kickoffUTC).getTime() - Date.now();
  if (delay <= 0 || delay > 14 * 24 * 60 * 60 * 1000) return;
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`${entry.homeTeam} vs ${entry.awayTeam} — Kickoff!`, {
        body: "The match is starting now!",
        tag: `wc26-alarm-${entry.matchId}`,
        icon: "/soccer.png",
      });
    }
  }, delay);
}

// Run once on app open: fire missed alerts within a 20-min grace window,
// re-schedule still-future ones.
export function checkOnOpenAlerts(alerts: AlertEntry[]): void {
  if (Notification.permission !== "granted") return;
  const now = Date.now();
  for (const a of alerts) {
    const kickoffMs = new Date(a.kickoffUTC).getTime();
    const alertMs = kickoffMs - 10 * 60 * 1000;
    const sinceAlert = now - alertMs;
    if (sinceAlert >= 0 && sinceAlert < 20 * 60 * 1000) {
      // Missed the 10-min window — fire immediately with remaining time
      const minsLeft = Math.max(0, Math.round((kickoffMs - now) / 60000));
      new Notification(`${a.homeTeam} vs ${a.awayTeam}`, {
        body:
          minsLeft > 0
            ? `Kicks off in ${minsLeft} min!`
            : "Match has kicked off!",
        tag: `wc26-${a.matchId}`,
        icon: "/soccer.png",
      });
    } else if (alertMs > now) {
      scheduleKickoffAlert(a);
    }
  }
}
