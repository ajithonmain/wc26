import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// App Check: blocks bot/scraper access to Firestore and FCM.
// Requires VITE_FIREBASE_APP_CHECK_KEY (reCAPTCHA v3 site key) in production.
// Omitting the key skips App Check — Firestore rules still protect the DB.
const appCheckKey = import.meta.env.VITE_FIREBASE_APP_CHECK_KEY as string | undefined;
if (appCheckKey && typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app);
export const functions = getFunctions(app);

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const m = getMessagingInstance();
    if (!m) return null;
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
    // Wait for the SW to become active before requesting push subscription
    if (!reg.active) {
      await new Promise<void>((resolve) => {
        const worker = reg.installing ?? reg.waiting;
        if (!worker) { resolve(); return; }
        const onStateChange = () => {
          if (reg.active) { worker.removeEventListener("statechange", onStateChange); resolve(); }
        };
        worker.addEventListener("statechange", onStateChange);
      });
    }
    const token = await getToken(m, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    return token ?? null;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

export function initForegroundMessaging(): void {
  const m = getMessagingInstance();
  if (!m) return;
  onMessage(m, async (payload) => {
    if (Notification.permission !== "granted") return;
    const { title = "WorldCup26", body = "" } = payload.notification ?? {};
    const tag = payload.data?.["tag"] ?? "wc26";
    const options: NotificationOptions = { body, icon: "/icon-192.png", badge: "/icon-192.png", tag };
    // Use SW showNotification for reliable Android display; fall back to Notification API
    const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
    if (reg) {
      reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  });
}
