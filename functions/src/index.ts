import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import type { LiveSnapshot } from "./liveProvider";
import { getLive } from "./liveProvider";

// ─── Secrets (set via Firebase Secret Manager) ───────────────────────────────
// firebase functions:secrets:set APIFOOTBALL_KEY
// firebase functions:secrets:set HIGHLIGHTLY_KEY
// firebase functions:secrets:set FOOTBALLDATA_KEY
const APIFOOTBALL_KEY = defineSecret("APIFOOTBALL_KEY");
const HIGHLIGHTLY_KEY = defineSecret("HIGHLIGHTLY_KEY");
const FOOTBALLDATA_KEY = defineSecret("FOOTBALLDATA_KEY");

// ─── Admin init ──────────────────────────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── Fixtures index (bundled at deploy time) ──────────────────────────────────
// We import the same fixtures.json used by the app so the function can
// determine whether any match is currently "live by fixture time" without
// a Firestore read — keeps cold-start cheap.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixtures = require("../../src/data/fixtures.json") as Array<{
  id: number;
  kickoffUTC: string;
  status: string;
}>;

// A match is "live by fixture time" if now is within the window
// [kickoffUTC, kickoffUTC + 115 minutes].
const LIVE_WINDOW_MS = 115 * 60 * 1000;

function anyMatchLiveByTime(now: number): boolean {
  return fixtures.some((f) => {
    const kick = new Date(f.kickoffUTC).getTime();
    return now >= kick && now <= kick + LIVE_WINDOW_MS;
  });
}

// Returns the minutes elapsed since the nearest live match kicked off.
// Used to determine if we're in a "hot window" (last 15min of a half).
function liveMatchMinutes(now: number): number[] {
  return fixtures
    .filter((f) => {
      const kick = new Date(f.kickoffUTC).getTime();
      return now >= kick && now <= kick + LIVE_WINDOW_MS;
    })
    .map((f) => Math.floor((now - new Date(f.kickoffUTC).getTime()) / 60000));
}

// A minute value is in the "hot window" if it's in the last 15min of a half:
// First half: minute 30–45 (elapsed 30–45), Second half: minute 75–90 (elapsed 75–90).
function isHotWindow(elapsedMinutes: number[]): boolean {
  return elapsedMinutes.some(
    (m) => (m >= 30 && m <= 47) || (m >= 75 && m <= 92)
  );
}

// ─── Diff + write ─────────────────────────────────────────────────────────────

async function diffAndWrite(snapshots: LiveSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return;

  const batch = db.batch();
  let writes = 0;

  await Promise.all(
    snapshots.map(async (snap) => {
      const ref = db.collection("live").doc(String(snap.id));
      const existing = await ref.get();
      const prev = existing.data() as Partial<LiveSnapshot> | undefined;

      const statusChanged = prev?.status !== snap.status;
      const minuteChanged = prev?.minute !== snap.minute;
      const scoreChanged =
        prev?.score?.home !== snap.score.home ||
        prev?.score?.away !== snap.score.away;

      if (statusChanged || minuteChanged || scoreChanged) {
        batch.set(
          ref,
          {
            id: snap.id,
            status: snap.status,
            minute: snap.minute,
            score: snap.score,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        writes++;
      }
    })
  );

  if (writes > 0) {
    await batch.commit();
    console.log(`[pollLiveScores] Wrote ${writes} updated doc(s).`);
  } else {
    console.log("[pollLiveScores] No changes detected.");
  }
}

// Remove stale docs for matches that finished >2 hours ago.
async function cleanupStale(now: number): Promise<void> {
  const staleThreshold = now - 2 * 60 * 60 * 1000;
  const staleIds = fixtures
    .filter((f) => {
      const kick = new Date(f.kickoffUTC).getTime();
      // Match finished: kickoff + 115min < staleThreshold
      return kick + LIVE_WINDOW_MS < staleThreshold;
    })
    .map((f) => String(f.id));

  if (staleIds.length === 0) return;

  const batch = db.batch();
  let deletions = 0;
  await Promise.all(
    staleIds.map(async (id) => {
      const ref = db.collection("live").doc(id);
      const doc = await ref.get();
      if (doc.exists) {
        const data = doc.data() as { status?: string };
        if (data?.status === "FT" || data?.status === "CANC") {
          batch.delete(ref);
          deletions++;
        }
      }
    })
  );
  if (deletions > 0) await batch.commit();
}

// ─── Adaptive-interval helper ─────────────────────────────────────────────────
// The scheduler fires every 90s. When in a hot window, we fire a second
// fetch 45s after the first (within the same function invocation).
// Cloud Functions v2 default timeout is 60s — we use a 44s wait to stay safe.
// For a tighter hot-window, set the scheduler to 45s and disable this logic.

async function fetchAndWrite(keys: {
  apiFootball: string;
  highlightly: string;
  footballData: string;
}): Promise<void> {
  const snapshots = await getLive(keys);
  await diffAndWrite(snapshots);
}

// ─── Exported Cloud Function ──────────────────────────────────────────────────

export const pollLiveScores = onSchedule(
  {
    schedule: "every 90 seconds",
    timeZone: "Asia/Kolkata",
    secrets: [APIFOOTBALL_KEY, HIGHLIGHTLY_KEY, FOOTBALLDATA_KEY],
    // Increase timeout to accommodate the adaptive double-fetch (45s wait).
    timeoutSeconds: 180,
    memory: "256MiB",
  },
  async () => {
    const now = Date.now();

    // Guard: skip entirely if no match is live by fixture time.
    if (!anyMatchLiveByTime(now)) {
      console.log("[pollLiveScores] No live matches by fixture time — skipping.");
      await cleanupStale(now);
      return;
    }

    const keys = {
      apiFootball: APIFOOTBALL_KEY.value(),
      highlightly: HIGHLIGHTLY_KEY.value(),
      footballData: FOOTBALLDATA_KEY.value(),
    };

    // First fetch
    await fetchAndWrite(keys);

    // Adaptive hot-window: if any live match is in last 15min of a half,
    // wait 45s and do a second fetch within this invocation.
    const elapsedMinutes = liveMatchMinutes(now);
    if (isHotWindow(elapsedMinutes)) {
      console.log(
        "[pollLiveScores] Hot window detected (min:",
        elapsedMinutes.join(", "),
        ") — fetching again in 45s."
      );
      await new Promise<void>((resolve) => setTimeout(resolve, 45_000));
      await fetchAndWrite(keys);
    }

    await cleanupStale(now);
  }
);
