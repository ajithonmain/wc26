import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

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
  onMessage(m, (payload) => {
    const { title = "WorldCup26", body = "" } = payload.notification ?? {};
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon-192.png",
        tag: payload.data?.["tag"] ?? "wc26",
      });
    }
  });
}
