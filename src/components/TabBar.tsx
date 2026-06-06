import { Link, useMatch } from "react-router-dom";
import Icon from "./Icon";
import type { IconName } from "./Icon";
import "../styles/tabbar.css";

interface TabDef {
  label: string;
  path: string;
  icon: IconName;
}

const TABS: TabDef[] = [
  { label: "Matches",  path: "/",         icon: "calendar" },
  { label: "Teams",    path: "/teams",    icon: "shirt"    },
  { label: "Groups",   path: "/groups",   icon: "group"    },
  { label: "Knockout", path: "/knockout", icon: "trophy"   },
];

function TabItem({ label, path, icon }: TabDef): React.ReactElement {
  const match = useMatch(path === "/" ? { path: "/", end: true } : path);
  const isActive = !!match;
  return (
    <Link
      to={path}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 ${isActive ? "tab-item--active" : "tab-item"}`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon name={icon} size={22} />
      <span className={`text-[10px] leading-none ${isActive ? "tab-label--active" : "tab-label"}`}>
        {label}
      </span>
    </Link>
  );
}

export default function TabBar(): React.ReactElement {
  return (
    <nav
      className="tb-nav flex items-stretch shrink-0"
      aria-label="Main navigation"
    >
      {TABS.map((tab) => (
        <TabItem key={tab.path} {...tab} />
      ))}
    </nav>
  );
}
