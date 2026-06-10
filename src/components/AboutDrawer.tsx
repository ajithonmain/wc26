import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import "../styles/about.css";

interface AboutDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface FeatureRowProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureRow({ icon, title, desc }: FeatureRowProps): React.ReactElement {
  return (
    <div className="ab-feature-row flex items-start gap-3">
      <span className="ab-feature-icon shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="ab-feature-title block text-sm font-semibold">{title}</span>
        <span className="ab-feature-desc block text-xs mt-0.5">{desc}</span>
      </span>
    </div>
  );
}

export default function AboutDrawer({ open, onClose }: AboutDrawerProps): React.ReactElement {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    import("../lib/notify").then(({ getCachedToken, fetchToken, notificationsGranted }) => {
      // Never fetch without granted permission — getToken would trigger the permission prompt
      if (!notificationsGranted()) { setFcmToken("notifications not enabled"); return; }
      const cached = getCachedToken();
      if (cached) { setFcmToken(cached); return; }
      fetchToken().then((t) => setFcmToken(t ?? "unavailable"));
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{
              maxHeight: "88dvh",
              background: "var(--modal-bg)",
              borderRadius: "20px 20px 0 0",
              borderTop: "1px solid var(--card-bd)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--card-bd)" }} />
            </div>

            {/* Header */}
            <div className="ab-header flex items-center justify-between shrink-0 px-5 pb-3 pt-1">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="WC26" className="ab-logo rounded-[8px]" />
                <div>
                  <p className="ab-app-name font-bold">World Cup 26</p>
                  <p className="ab-app-sub text-xs">FIFA World Cup 2026 Tracker</p>
                </div>
              </div>
              <button onClick={onClose} className="ab-close flex items-center justify-center rounded-full" aria-label="Close">
                <Icon name="x" size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="ab-body flex-1 overflow-y-auto px-5 pb-8">

              {/* Features */}
              <p className="ab-section-label">Features</p>
              <div className="ab-features flex flex-col gap-3">
                <FeatureRow
                  icon={<Icon name="calendar" size={16} />}
                  title="Full Schedule"
                  desc="All 104 matches — group stage through the Final, with live scores and results."
                />
                <FeatureRow
                  icon={<Icon name="search" size={16} />}
                  title="Global Search"
                  desc="Search all 48 teams and 1,248 players instantly — no network call. Tap a player result to open their profile and stats directly."
                />
                <FeatureRow
                  icon={<Icon name="clock" size={16} />}
                  title="Timezone Switcher"
                  desc="Switch to any timezone and every kickoff time, date rail and header update instantly."
                />
                <FeatureRow
                  icon={<Icon name="shirt" size={16} />}
                  title="My Teams"
                  desc="Star your favourite nations to filter matches and get focused alerts."
                />
                <FeatureRow
                  icon={<Icon name="users" size={16} />}
                  title="Team Profiles"
                  desc="Tap any team for their full squad of 26 players — position, age, jersey and photo. Tap any player to see their international caps, goals, height and weight."
                />
                <FeatureRow
                  icon={<Icon name="group" size={16} />}
                  title="Group Standings"
                  desc="Live group tables for all 12 groups, updating as results come in."
                />
                <FeatureRow
                  icon={<Icon name="trophy" size={16} />}
                  title="Knockout Bracket"
                  desc="Full R32 → Final bracket. Navigate rounds via the tab pills."
                />
                <FeatureRow
                  icon={<Icon name="calendar" size={16} />}
                  title="Google Calendar"
                  desc="Add any match to Google Calendar in one tap — includes venue and kickoff time."
                />
              </div>

              {/* Browser Reminder */}
              <p className="ab-section-label">Match Alerts</p>
              <div className="ab-reminder-box">
                <div className="flex items-start gap-3">
                  <span className="ab-reminder-icon flex items-center justify-center shrink-0">
                    <Icon name="bell" size={16} />
                  </span>
                  <div>
                    <p className="ab-reminder-title text-sm font-semibold">How it works</p>
                    <p className="ab-reminder-desc text-xs mt-1">
                      Tap the bell icon on any upcoming match card to set a reminder 1 hour before kickoff. View and manage all your alerts in the Alerts tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* Install */}
              <p className="ab-section-label">Install as App</p>
              <p className="ab-body-text text-xs">
                Tap the Install button in the topbar (Android / Chrome) or use Share → Add to Home Screen (iOS) to install World Cup 26 as a standalone app. Updates automatically in the background.
              </p>

              {/* FCM token — for testing only */}
              <p className="ab-section-label">FCM Token</p>
              <p className="ab-body-text text-xs break-all select-all" style={{ fontFamily: "monospace", opacity: 0.6 }}>
                {fcmToken ?? "loading..."}
              </p>

              {/* Tech */}
              <p className="ab-section-label">Built With</p>
              <p className="ab-body-text text-xs">
                React 18 · TypeScript · Vite · Firebase · Workbox PWA
              </p>

              {/* Attribution + copyright */}
              <p className="ab-section-label">Data & Credits</p>
              <p className="ab-body-text text-xs">
                Fixtures and squad data from the official FIFA World Cup 2026™. Player caps and goals via Wikipedia. Flag images via flagcdn.com.
              </p>
              <p className="ab-copyright text-xs mt-4">
                © 2026 ajithmjose. All rights reserved.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
