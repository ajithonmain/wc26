import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import MatchCenter from "./views/MatchCenter";
import MyTeams from "./views/MyTeams";
import Alerts from "./views/Alerts";
import Groups from "./views/Groups";
import Knockout from "./views/Knockout";
import Sidebar from "./components/Sidebar";
import RightRail from "./components/RightRail";
import ThemeToggle from "./components/ThemeToggle";
import TabBar from "./components/TabBar";
import Icon from "./components/Icon";
import { useAlertsStore } from "./store/alertsSlice";
import { checkOnOpenAlerts } from "./lib/notify";
import { getGreetingIST } from "./lib/matchUtils";
import InstallBanner from "./components/InstallBanner";
import "./styles/app.css";

function MobileHeader(): React.ReactElement {
  const greeting = getGreetingIST();
  return (
    <header className="app-mobile-header flex items-center justify-between px-4 shrink-0">
      {/* Left: app icon + greeting + title */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="World Cup 26"
          className="app-mobile-brand-icon shrink-0 rounded-[6px]"
        />
      </div>

      {/* Right: theme toggle + bell */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          className="app-mobile-bell glass flex items-center justify-center rounded-full"
          aria-label="Notifications"
        >
          <Icon name="bell" size={18} />
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
  useEffect(() => {
    checkOnOpenAlerts(alerts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AlertsBootstrap />
      <div className="app-root flex flex-col lg:flex-row h-[100dvh] overflow-hidden">

        {/* Desktop sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Center column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Mobile header */}
          <div className="lg:hidden">
            <MobileHeader />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/"         element={<MatchCenter />} />
              <Route path="/teams"    element={<MyTeams />} />
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
      <InstallBanner />
    </BrowserRouter>
  );
}
