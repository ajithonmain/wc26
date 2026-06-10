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

// ─── Team slug — must match teamSlug() in notify.ts ──────────────────────────
function teamSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
type BracketData = Record<string, { home: string; away: string }>;

function buildRecord(snap: LiveSnapshot, bracket: BracketData): ScoreRecord | null {
  const f = fixtureMap.get(snap.id);
  if (!f) return null;
  const b = bracket[String(snap.id)];
  return {
    home:      b?.home ?? f.home.name,
    away:      b?.away ?? f.away.name,
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
  home: string;
  away: string;
}

function detectEvents(prev: ScoresMap, next: ScoresMap): PushEvent[] {
  const events: PushEvent[] = [];
  for (const [key, cur] of Object.entries(next)) {
    const old = prev[key];
    const id  = Number(key);

    if (!old) {
      if (cur.status === "LIVE") {
        events.push({ matchId: id, type: "KICKOFF",
          home: cur.home, away: cur.away,
          title: `${cur.home} vs ${cur.away}`,
          body:  "Kickoff! The match has started." });
      }
      continue;
    }

    if (old.status !== "LIVE" && cur.status === "LIVE") {
      events.push({ matchId: id, type: "KICKOFF",
        home: cur.home, away: cur.away,
        title: `${cur.home} vs ${cur.away}`,
        body:  "Kickoff! The match has started." });
    }

    if (cur.status === "LIVE" &&
        (cur.homeScore > old.homeScore || cur.awayScore > old.awayScore)) {
      const scorer = cur.homeScore > old.homeScore ? cur.home : cur.away;
      events.push({ matchId: id, type: "GOAL",
        home: cur.home, away: cur.away,
        title: `GOAL! ${cur.home} ${cur.homeScore}–${cur.awayScore} ${cur.away}`,
        body:  `${scorer} score!` });
    }

    if ((old.status === "LIVE" || old.status === "HT") && cur.status === "FT") {
      events.push({ matchId: id, type: "FULLTIME",
        home: cur.home, away: cur.away,
        title: `FT: ${cur.home} ${cur.homeScore}–${cur.awayScore} ${cur.away}`,
        body:  "Full time." });
    }
  }
  return events;
}

// ─── FCM helpers ──────────────────────────────────────────────────────────────

async function sendToTopic(topic: string, ev: PushEvent): Promise<void> {
  await admin.messaging().send({
    topic,
    notification: { title: ev.title, body: ev.body },
    data: { matchId: String(ev.matchId), type: ev.type },
    webpush: {
      headers: { Urgency: "high" },
      notification: {
        icon: "/icon-192.png",
        tag: `wc26-${ev.type.toLowerCase()}-${ev.matchId}`,
      },
    },
  });
}

async function sendEventPushes(events: PushEvent[]): Promise<void> {
  for (const ev of events) {
    // Match topic — users who set a reminder for this specific match
    try {
      await sendToTopic(`wc26-match-${ev.matchId}`, ev);
      console.log(`[FCM-MATCH] wc26-match-${ev.matchId} — ${ev.type}`);
    } catch (e) {
      console.error("[FCM-MATCH ERROR]", (e as Error).message);
    }

    // Team topics — users who favorited either team (GOAL and KICKOFF only)
    if (ev.type === "GOAL" || ev.type === "KICKOFF") {
      for (const teamName of [ev.home, ev.away]) {
        const teamTopic = `wc26-team-${teamSlug(teamName)}`;
        try {
          await sendToTopic(teamTopic, ev);
          console.log(`[FCM-TEAM] ${teamTopic} — ${ev.type}`);
        } catch (e) {
          // No subscribers on this topic is a normal 404 — not a real error
          const msg = (e as Error).message ?? "";
          if (!msg.includes("no tokens") && !msg.includes("SENDER_ID_MISMATCH")) {
            console.error(`[FCM-TEAM ERROR] ${teamTopic}`, msg);
          }
        }
      }
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
        webpush: {
          headers: { Urgency: "high" },
          notification: { icon: "/icon-192.png", tag: `wc26-reminder-${f.id}` },
        },
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

  const [prevDoc, bracketDoc] = await Promise.all([
    db.doc("live/scores").get(),
    db.doc("live/bracket").get(),
  ]);
  const prevScores = (prevDoc.data() ?? {}) as ScoresMap;
  const bracket    = (bracketDoc.data() ?? {}) as BracketData;

  const newScores: ScoresMap = {};
  for (const snap of snapshots) {
    const record = buildRecord(snap, bracket);
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

// ─── Topic subscription callables ────────────────────────────────────────────

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

export const subscribeToTeamTopic = onCall(async (request) => {
  const { token, teamName } = request.data as { token: string; teamName: string };
  if (!token || !teamName) throw new Error("token and teamName required");
  await admin.messaging().subscribeToTopic([token], `wc26-team-${teamSlug(teamName)}`);
  return { ok: true };
});

export const unsubscribeFromTeamTopic = onCall(async (request) => {
  const { token, teamName } = request.data as { token: string; teamName: string };
  if (!token || !teamName) throw new Error("token and teamName required");
  await admin.messaging().unsubscribeFromTopic([token], `wc26-team-${teamSlug(teamName)}`);
  return { ok: true };
});
