"use strict";
// WC26 Push Notification Test Script
// Copy to /opt/wc26-poller/ on the VPS alongside serviceAccount.json
// Usage:
//   node test-push.cjs token <FCM_TOKEN>        — direct push to a device
//   node test-push.cjs reminder <FCM_TOKEN>     — reminder push (direct to token)
//   node test-push.cjs kickoff <FCM_TOKEN>      — kickoff push + writes live/scores
//   node test-push.cjs goal <FCM_TOKEN>         — goal push + updates live/scores
//   node test-push.cjs team <FCM_TOKEN> <team>  — subscribe token to team topic + send GOAL
//   node test-push.cjs cleanup                  — remove test doc from live/scores

const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("./serviceAccount.json")) });
const db        = admin.firestore();
const messaging = admin.messaging();

const TEST_MATCH_ID = 9999;
const TEST_HOME     = "Brazil";
const TEST_AWAY     = "Argentina";
const TEST_DOC_KEY  = "brazil|argentina";

function teamSlug(name) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function sendDirect(token, title, body, tag) {
  const res = await messaging.send({
    token,
    notification: { title, body },
    data: { tag },
    webpush: {
      headers: { Urgency: "high" },
      notification: { icon: "/icon-192.png", tag, requireInteraction: false },
    },
  });
  console.log(`[OK] Sent to token. Message ID: ${res}`);
}

async function sendTopic(topic, title, body, tag) {
  const res = await messaging.send({
    topic,
    notification: { title, body },
    data: { tag },
    webpush: {
      headers: { Urgency: "high" },
      notification: { icon: "/icon-192.png", tag, requireInteraction: false },
    },
  });
  console.log(`[OK] Sent to topic ${topic}. Message ID: ${res}`);
}

const [,, cmd, token, extra] = process.argv;

async function main() {
  switch (cmd) {

    case "token": {
      // Basic sanity check — sends directly to the device token
      if (!token) { console.error("Usage: node test-push.cjs token <FCM_TOKEN>"); process.exit(1); }
      console.log("Sending direct test push...");
      await sendDirect(token, "WC26 Test", "Push notifications are working!", "wc26-test");
      break;
    }

    case "reminder": {
      // Simulates the 1-hour-before reminder
      if (!token) { console.error("Usage: node test-push.cjs reminder <FCM_TOKEN>"); process.exit(1); }
      console.log("Sending reminder push...");
      await sendDirect(token, `${TEST_HOME} vs ${TEST_AWAY}`, "Kicks off in 1 hour!", `wc26-remind-${TEST_MATCH_ID}`);
      break;
    }

    case "kickoff": {
      // Writes a fake LIVE match to Firestore, then sends KICKOFF push to match topic
      if (!token) { console.error("Usage: node test-push.cjs kickoff <FCM_TOKEN>"); process.exit(1); }

      console.log(`Subscribing token to wc26-match-${TEST_MATCH_ID}...`);
      await messaging.subscribeToTopic([token], `wc26-match-${TEST_MATCH_ID}`);

      console.log("Writing fake LIVE match to live/scores...");
      await db.doc("live/scores").set({
        [TEST_DOC_KEY]: { home: TEST_HOME, away: TEST_AWAY, status: "LIVE", homeScore: 0, awayScore: 0, minute: 1, fixtureId: TEST_MATCH_ID },
      }, { merge: true });

      console.log("Sending KICKOFF push to match topic...");
      await sendTopic(`wc26-match-${TEST_MATCH_ID}`, `${TEST_HOME} vs ${TEST_AWAY}`, "Kickoff! The match has started.", `wc26-${TEST_MATCH_ID}-kickoff`);
      console.log("Check your device — you should see the KICKOFF notification.");
      console.log("Also check the app — live score card should appear.");
      break;
    }

    case "goal": {
      // Updates fake match score and sends GOAL push to match topic
      if (!token) { console.error("Usage: node test-push.cjs goal <FCM_TOKEN>"); process.exit(1); }

      console.log("Updating live/scores with a goal...");
      await db.doc("live/scores").set({
        [TEST_DOC_KEY]: { home: TEST_HOME, away: TEST_AWAY, status: "LIVE", homeScore: 1, awayScore: 0, minute: 23, fixtureId: TEST_MATCH_ID },
      }, { merge: true });

      console.log("Sending GOAL push to match topic...");
      await sendTopic(`wc26-match-${TEST_MATCH_ID}`, `GOAL! ${TEST_HOME} 1-0 ${TEST_AWAY}`, `${TEST_HOME} score!`, `wc26-${TEST_MATCH_ID}-goal`);
      console.log("Check your device — you should see the GOAL notification.");
      console.log("Also check the app — live score should show 1-0.");
      break;
    }

    case "team": {
      // Subscribe token to a team topic and send a GOAL push via that topic
      // Usage: node test-push.cjs team <TOKEN> "Brazil"
      if (!token || !extra) { console.error('Usage: node test-push.cjs team <FCM_TOKEN> "Team Name"'); process.exit(1); }
      const slug  = teamSlug(extra);
      const topic = `wc26-team-${slug}`;
      console.log(`Subscribing token to ${topic}...`);
      await messaging.subscribeToTopic([token], topic);
      console.log(`Sending GOAL push to ${topic}...`);
      await sendTopic(topic, `GOAL! ${extra} 1-0 Opponent`, `${extra} score!`, `wc26-team-goal-test`);
      console.log("Check your device — you should see the team GOAL notification.");
      break;
    }

    case "cleanup": {
      console.log("Removing test match from live/scores...");
      const doc   = await db.doc("live/scores").get();
      const data  = doc.data() ?? {};
      delete data[TEST_DOC_KEY];
      await db.doc("live/scores").set(data);
      console.log("[OK] Test match removed.");
      break;
    }

    default:
      console.log(`
Commands:
  node test-push.cjs token <TOKEN>            Basic push delivery test
  node test-push.cjs reminder <TOKEN>         1-hour reminder push
  node test-push.cjs kickoff <TOKEN>          KICKOFF push + live score appears in app
  node test-push.cjs goal <TOKEN>             GOAL push + score updates in app
  node test-push.cjs team <TOKEN> "Brazil"    Favorite team GOAL push
  node test-push.cjs cleanup                  Remove test data from Firestore

Get your FCM token: open the app → tap the logo → About drawer → FCM Token field.
      `);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error("[ERROR]", e.message); process.exit(1); });
