import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import MatchCenter from "./views/MatchCenter";
import MyTeams from "./views/MyTeams";
import Alerts from "./views/Alerts";
import Groups from "./views/Groups";
import Knockout from "./views/Knockout";
import TeamDetail from "./views/TeamDetail";
import Sidebar from "./components/Sidebar";
import RightRail from "./components/RightRail";
import ThemeToggle from "./components/ThemeToggle";
import TabBar from "./components/TabBar";
import AlertsDrawer from "./components/AlertsDrawer";
import Icon from "./components/Icon";
import { useAlertsStore } from "./store/alertsSlice";
import { useLiveStore } from "./store/liveSlice";
import { checkOnOpenAlerts, registerAndSyncAlerts } from "./lib/notify";
import { initForegroundMessaging } from "./lib/firebase";
import { useFavoriteTopicSync } from "./hooks/useFavoriteTopicSync";
import { useUIStore } from "./store/uiSlice";
import { tzAbbr } from "./lib/timezones";
import TZPicker from "./components/TimezonePicker";
import AboutDrawer from "./components/AboutDrawer";
import SearchOverlay from "./components/SearchOverlay";
import InstallBanner from "./components/InstallBanner";
import StorageBanner, { useStorageNoticeShown } from "./components/StorageBanner";
import "./styles/app.css";

function MobileHeader({ onBellClick, onInstallClick, showInstall }: {
  onBellClick: () => void;
  onInstallClick: () => void;
  showInstall: boolean;
}): React.ReactElement {
  const openSearch = useUIStore((s) => s.openSearch);
  const upcomingCount = useAlertsStore((s) =>
    s.alerts.filter((a) => new Date(a.kickoffUTC).getTime() - a.reminderMins * 60_000 > Date.now()).length
  );
  const { timezone } = useUIStore();
  const [tzOpen, setTzOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="app-mobile-header flex items-center justify-between px-4 shrink-0">
      {/* Left: logo + about — identity zone */}
      <div className="flex items-center gap-2">
        <img
          src="/logo.svg"
          alt="World Cup 26"
          className="app-mobile-brand-icon shrink-0 rounded-[6px]"
        />
        <button
          onClick={() => setAboutOpen(true)}
          className="app-mobile-bell glass flex items-center justify-center rounded-full"
          aria-label="About"
        >
          <Icon name="info" size={18} />
        </button>
        <AboutDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </div>

      {/* Right: install · theme · tz · search · bell */}
      <div className="flex items-center gap-2">
        {/* Install — conditional, rare */}
        {showInstall && (
          <button
            onClick={onInstallClick}
            className="app-mobile-bell glass flex items-center justify-center rounded-full"
            aria-label="Install app"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        )}

        {/* Theme */}
        <ThemeToggle />

        {/* Timezone */}
        <button
          onClick={() => setTzOpen(true)}
          className="app-tz-btn glass flex items-center justify-center rounded-full"
          aria-label="Change timezone"
        >
          <span className="app-tz-abbr font-bold">{tzAbbr(timezone)}</span>
        </button>
        <TZPicker open={tzOpen} onClose={() => setTzOpen(false)} />

        {/* Search */}
        <button
          onClick={openSearch}
          className="app-mobile-bell glass flex items-center justify-center rounded-full"
          aria-label="Search"
        >
          <Icon name="search" size={18} />
        </button>

        {/* Bell — most used, rightmost */}
        <button
          onClick={onBellClick}
          className="app-mobile-bell glass flex items-center justify-center rounded-full relative"
          aria-label="Alerts"
        >
          <Icon name="bell" size={18} />
          {upcomingCount > 0 && (
            <span className="app-bell-badge absolute -top-1 -right-1 flex items-center justify-center text-[9px] font-bold rounded-full">
              {upcomingCount > 9 ? "9+" : upcomingCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function ComingSoon({ label }: { label: string }): React.ReactElement {
  return (
    <div className="app-coming-soon flex flex-col items-center justify-center gap-3 h-full">
      <span className="app-coming-soon-label text-2xl font-bold">
        {label}
      </span>
      <span className="text-sm">Coming in a later phase</span>
    </div>
  );
}

function AlertsBootstrap(): React.ReactElement | null {
  const alerts = useAlertsStore((s) => s.alerts);
  const initLive = useLiveStore((s) => s.init);
  useFavoriteTopicSync();
  useEffect(() => {
    checkOnOpenAlerts(alerts);
    initForegroundMessaging();
    if (Notification.permission === "granted") void registerAndSyncAlerts(alerts);
    const unsub = initLive();
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for SW updates when user returns to the app
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const check = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.update();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}

export default function App(): React.ReactElement {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { searchOpen, closeSearch } = useUIStore();
  const [installPrompt, setInstallPrompt] = useState<Window["__pwaPrompt"]>(() => window.__pwaPrompt ?? null);
  const [installDismissed, setInstallDismissed] = useState(() => !!localStorage.getItem("wc26:install-dismissed"));
  const [storageShown, setStorageShown] = useState(useStorageNoticeShown);

  useEffect(() => {
    const handler = () => setInstallPrompt(window.__pwaPrompt);
    window.addEventListener("pwa-prompt-ready", handler);
    return () => window.removeEventListener("pwa-prompt-ready", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallDismissed(true);
      localStorage.setItem("wc26:install-dismissed", "1");
    }
    window.__pwaPrompt = null;
    setInstallPrompt(null);
  };

  const showInstallIcon = !!installPrompt && installDismissed && storageShown;

  return (
    <BrowserRouter>
      <AlertsBootstrap />
      <div className="app-root flex flex-col lg:flex-row h-[100dvh] overflow-hidden">

        {/* Desktop sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Center column */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Mobile header */}
          <div className="lg:hidden">
            <MobileHeader
              onBellClick={() => setAlertsOpen(true)}
              onInstallClick={handleInstall}
              showInstall={showInstallIcon}
            />
          </div>

          {/* Page content — extra bottom padding on mobile for fixed TabBar */}
          <main className="flex-1 overflow-hidden min-h-0 lg:pb-0 pb-[calc(60px+env(safe-area-inset-bottom))]">
            <Routes>
              <Route path="/"         element={<MatchCenter />} />
              <Route path="/teams"    element={<MyTeams />} />
              <Route path="/teams/:name" element={<TeamDetail />} />
              <Route path="/groups"   element={<Groups />} />
              <Route path="/knockout" element={<Knockout />} />
              <Route path="/alerts"    element={<Alerts />} />
              <Route path="/match/:id" element={<ComingSoon label="Match Detail" />} />
            </Routes>
          </main>

          {/* Mobile bottom tab bar */}
          <div className="lg:hidden">
            <TabBar />
          </div>
        </div>

        {/* Desktop right rail */}
        <div className="hidden lg:block shrink-0">
          <RightRail />
        </div>

      </div>
      <InstallBanner
        storageShown={storageShown}
        onDismiss={() => setInstallDismissed(true)}
      />
      <StorageBanner onDismiss={() => setStorageShown(true)} />
      {/* Alerts drawer — mobile only */}
      <div className="lg:hidden">
        <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      </div>
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </BrowserRouter>
  );
}
