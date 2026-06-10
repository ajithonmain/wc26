import { useState } from "react";
import { requestPermission, syncFavoritesToFirestore, checkOnOpenAlerts } from "../lib/notify";
import { useAlertsStore } from "../store/alertsSlice";
import { useFavoritesStore } from "../store/favoritesSlice";
import Icon from "./Icon";
import "../styles/notifyprompt.css";

const SESSION_KEY = "wc26:notify-prompt";

export default function NotifyPrompt({ storageShown }: { storageShown: boolean }): React.ReactElement | null {
  const [closed, setClosed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [busy, setBusy] = useState(false);

  if (!storageShown || closed) return null;
  // Re-ask each session only while permission is undecided — denied can't be re-prompted
  if (!("Notification" in window) || Notification.permission !== "default") return null;

  const close = (): void => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setClosed(true);
  };

  const enable = async (): Promise<void> => {
    setBusy(true);
    const perm = await requestPermission();
    if (perm === "granted") {
      const alerts = useAlertsStore.getState().alerts;
      checkOnOpenAlerts(alerts);
      void syncFavoritesToFirestore(useFavoritesStore.getState().favorites);
    }
    close();
  };

  return (
    <div className="np-overlay" onClick={close}>
      <div className="np-card" onClick={(e) => e.stopPropagation()}>
        <span className="np-bell flex items-center justify-center rounded-full">
          <Icon name="bell" size={22} />
        </span>
        <p className="np-title">Never miss a goal</p>
        <p className="np-text">
          Get a kickoff alert for every match, plus goals and full-time for your favorite teams.
        </p>
        <button onClick={enable} disabled={busy} className="np-btn">
          Enable Alerts
        </button>
        <button onClick={close} className="np-later">
          Not now
        </button>
      </div>
    </div>
  );
}
