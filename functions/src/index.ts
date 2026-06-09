import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import type { LiveSnapshot } from "./liveProvider";
import { getLive } from "./liveProvider";

const APIFOOTBALL_KEY  = defineSecret("APIFOOTBALL_KEY");
const HIGHLIGHTLY_KEY  = defineSecret("HIGHLIGHTLY_KEY");
const FOOTBALLDATA_KEY = defineSecret("FOOTBALLDATA_KEY");

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

// ─── Fixtures index ───────────────────────────────────────────────────────────
interface FixtureEntry {
  id: number;
  kickoffUTC: string;
  home: { name: string };
  away: { name: string };
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixtures = require("../../src/data/fixtures.json") as FixtureEntry[];
const fixtureMap = new Map<number, FixtureEntry>(fixtures.map((f) => [f.id, f]));

const LIVE_WINDOW_MS    = 115 * 60 * 1000;
const REMINDER_MINS     = 60;
const REMINDER_WINDOW_S = 5 * 60;

function anyMatchLiveByTime(now: number): boolean {
  return fixtures.some((f) => {
    const kick = new Date(f.kickoffUTC).getTime();
    return now >= kick && now <= kick + LIVE_WINDOW_MS;
  });
}

function liveMatchMinutes(now: number): number[] {
  return fixtures
    .filter((f) => {
      const kick = new Date(f.kickoffUTC).getTime();
      return now >= kick && now <= kick + LIVE_WINDOW_MS;
    })
    .map((f) => Math.floor((now - new Date(f.kickoffUTC).getTime()) / 60000));
}

function isHotWindow(elapsedMinutes: number[]): boolean {
  return elapsedMinutes.some(
    (m) => (m >= 30 && m <= 47) || (m >= 75 && m <= 92)
  );
}

// ─── Score record — must match RawScore in liveSlice ─────────────────────────
interface ScoreRecord {
  home: string;
  away: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
}
type ScoresMap = Record<string, ScoreRecord>;

function buildRecord(snap: LiveSnapshot): ScoreRecord | null {
  const f = fixtureMap.get(snap.id);
  if (!f) return null;
  return {
    home:      f.home.name,
    away:      f.away.name,
    status:    snap.status,
    homeScore: snap.score.home ?? 0,
    awayScore: snap.score.away ?? 0,
    minute:    snap.minute,
  };
}

// ─── Event detection ──────────────────────────────────────────────────────────
type EventType = "KICKOFF" | "GOAL" | "FULLTIME";

interface PushEvent {
  matchId: number;
  type: EventType;
  title: string;
  body: string;
}

function detectEvents(prev: ScoresMap, next: ScoresMap): PushEvent[] {
  const events: PushEvent[] = [];
  for (const [key, cur] of Object.entries(next)) {
    const old = prev[key];
    const id  = Number(key);

    if (!old) {
      if (cur.status === "LIVE") {
        events.push({ matchId: id, type: "KICKOFF",
          title: `${cur.home} vs ${cur.away}`,
          body:  "Kickoff! The match has started." });
      }
      continue;
    }

    if (old.status !== "LIVE" && cur.status === "LIVE") {
      events.push({ matchId: id, type: "KICKOFF",
        title: `${cur.home} vs ${cur.away}`,
        body:  "Kickoff! The match has started." });
    }

    if (cur.status === "LIVE" &&
        (cur.homeScore > old.homeScore || cur.awayScore > old.awayScore)) {
      const scorer = cur.homeScore > old.homeScore ? cur.home : cur.away;
      events.push({ matchId: id, type: "GOAL",
        title: `GOAL! ${cur.home} ${cur.homeScore}–${cur.awayScore} ${cur.away}`,
        body:  `${scorer} score!` });
    }

    if ((old.status === "LIVE" || old.status === "HT") && cur.status === "FT") {
      events.push({ matchId: id, type: "FULLTIME",
        title: `FT: ${cur.home} ${cur.homeScore}–${cur.awayScore} ${cur.away}`,
        body:  "Full time." });
    }
  }
  return events;
}

// ─── FCM helpers — topic-based, zero /subs reads per event ───────────────────

async function sendEventPushes(events: PushEvent[]): Promise<void> {
  for (const ev of events) {
    const topic = `wc26-match-${ev.matchId}`;
    try {
      await admin.messaging().send({
        topic,
        notification: { title: ev.title, body: ev.body },
        data: { matchId: String(ev.matchId), type: ev.type },
        webpush: {
          notification: {
            icon: "/icon-192.png",
            tag: `wc26-${ev.type.toLowerCase()}-${ev.matchId}`,
          },
        },
      });
      console.log(`[FCM-TOPIC] ${topic} — ${ev.type}`);
    } catch (e) {
      console.error("[FCM-TOPIC ERROR]", (e as Error).message);
    }
  }
}

async function sendReminderPushes(now: number): Promise<void> {
  const upcoming = fixtures.filter((f) => {
    const kick         = new Date(f.kickoffUTC).getTime();
    const reminderTime = kick - REMINDER_MINS * 60 * 1000;
    const diff         = reminderTime - now;
    return diff >= 0 && diff <= REMINDER_WINDOW_S * 1000;
  });
  if (upcoming.length === 0) return;

  const metaRef  = db.doc("live/meta");
  const metaSnap = await metaRef.get();
  const sent: number[] = (metaSnap.data()?.remindersSent as number[]) ?? [];
  const sentSet  = new Set(sent);

  const toSend = upcoming.filter((f) => !sentSet.has(f.id));
  if (toSend.length === 0) return;

  for (const f of toSend) {
    const topic = `wc26-match-${f.id}`;
    try {
      await admin.messaging().send({
        topic,
        notification: {
          title: `${f.home.name} vs ${f.away.name}`,
          body: "Kicks off in 1 hour!",
        },
        data: { matchId: String(f.id), type: "REMINDER" },
        webpush: { notification: { icon: "/icon-192.png", tag: `wc26-reminder-${f.id}` } },
      });
    } catch (e) {
      console.error("[REMINDER-TOPIC ERROR]", (e as Error).message);
    }
    sentSet.add(f.id);
  }

  await metaRef.set({ remindersSent: Array.from(sentSet) }, { merge: true });
}

// ─── Core poll + write ────────────────────────────────────────────────────────

async function pollAndWrite(keys: { apiFootball: string; highlightly: string; footballData: string }): Promise<void> {
  const snapshots = await getLive(keys);
  if (snapshots.length === 0) {
    console.log("[pollLiveScores] No live matches from providers.");
    return;
  }

  const prevDoc    = await db.doc("live/scores").get();
  const prevScores = (prevDoc.data() ?? {}) as ScoresMap;

  const newScores: ScoresMap = {};
  for (const snap of snapshots) {
    const record = buildRecord(snap);
    if (record) newScores[String(snap.id)] = record;
  }

  const events = detectEvents(prevScores, newScores);

  await db.doc("live/scores").set(newScores);
  console.log(`[pollLiveScores] Wrote ${Object.keys(newScores).length} live match(es). Events: ${events.length}`);

  if (events.length > 0) await sendEventPushes(events);
}

// ─── Scheduled function ───────────────────────────────────────────────────────

export const pollLiveScores = onSchedule(
  {
    schedule:       "every 1 minutes",
    timeZone:       "Asia/Kolkata",
    secrets:        [APIFOOTBALL_KEY, HIGHLIGHTLY_KEY, FOOTBALLDATA_KEY],
    timeoutSeconds: 180,
    memory:         "256MiB",
  },
  async () => {
    const now = Date.now();

    await sendReminderPushes(now);

    if (!anyMatchLiveByTime(now)) {
      console.log("[pollLiveScores] No live matches by fixture time — skipping.");
      return;
    }

    const keys = {
      apiFootball:  APIFOOTBALL_KEY.value(),
      highlightly:  HIGHLIGHTLY_KEY.value(),
      footballData: FOOTBALLDATA_KEY.value(),
    };

    await pollAndWrite(keys);

    const elapsed = liveMatchMinutes(now);
    if (isHotWindow(elapsed)) {
      console.log("[pollLiveScores] Hot window — second fetch in 45s.");
      await new Promise<void>((r) => setTimeout(r, 45_000));
      await pollAndWrite(keys);
    }
  }
);

// ─── Topic subscription callables — invoked from browser on alert add/remove ─

export const subscribeToMatchTopic = onCall(async (request) => {
  const { token, matchId } = request.data as { token: string; matchId: number };
  if (!token || !matchId) throw new Error("token and matchId required");
  await admin.messaging().subscribeToTopic([token], `wc26-match-${matchId}`);
  return { ok: true };
});

export const unsubscribeFromMatchTopic = onCall(async (request) => {
  const { token, matchId } = request.data as { token: string; matchId: number };
  if (!token || !matchId) throw new Error("token and matchId required");
  await admin.messaging().unsubscribeFromTopic([token], `wc26-match-${matchId}`);
  return { ok: true };
});
