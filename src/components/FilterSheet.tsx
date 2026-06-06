import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import "../styles/filtersheet.css";

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

export interface FilterState {
  status: "all" | "live" | "upcoming" | "ft";
  teams: "all" | "favourites";
  groups: string[];
}

export const DEFAULT_FILTER: FilterState = { status: "all", teams: "all", groups: [] };

export function isFiltered(f: FilterState): boolean {
  return f.status !== "all" || f.teams !== "all" || f.groups.length > 0;
}

const STATUS_LABELS: Record<FilterState["status"], string> = {
  all: "All",
  live: "Live now",
  upcoming: "Upcoming",
  ft: "Full Time",
};

interface FilterSheetProps {
  applied: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
  hasFavourites: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function FilterSheet({
  applied,
  onApply,
  onClose,
  hasFavourites,
  anchorRef,
}: FilterSheetProps): React.ReactElement {
  const [working, setWorking] = useState<FilterState>({ ...applied });
  const isDesktop = window.innerWidth >= 1024;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDesktop || !anchorRef?.current || !dropdownRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    dropdownRef.current.style.top = `${rect.bottom + 6}px`;
    dropdownRef.current.style.right = `${window.innerWidth - rect.right}px`;
    dropdownRef.current.style.left = "auto";
  });

  const toggleGroup = (g: string): void => {
    setWorking((prev) => ({
      ...prev,
      groups: prev.groups.includes(g)
        ? prev.groups.filter((x) => x !== g)
        : [...prev.groups, g],
    }));
  };

  const clear = (): void => {
    onApply({ ...DEFAULT_FILTER });
    onClose();
  };

  const apply = (): void => {
    onApply(working);
    onClose();
  };

  const workingFiltered = isFiltered(working);

  const content = (
    <div className="fs-content">
      <div className="fs-header">
        <span className="fs-title">Filter Matches</span>
        <div className="flex items-center gap-2">
          {workingFiltered && (
            <button type="button" className="fs-clear-btn" onClick={clear}>
              Reset
            </button>
          )}
          <button type="button" className="fs-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>

      <div className="fs-section">
        <p className="fs-section-label">Status</p>
        <div className="fs-chip-row">
          {(["all", "live", "upcoming", "ft"] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setWorking((p) => ({ ...p, status: s }))}
              className={`fs-chip${working.status === s ? " fs-chip--active" : ""}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="fs-section">
        <p className="fs-section-label">Teams</p>
        <Link to="/teams" className="fs-teams-link" onClick={onClose}>
          <Icon name="shirt" size={12} />
          {hasFavourites ? "Manage favourite teams" : "Add favourite teams"}
        </Link>
        <div className="fs-chip-row">
          <button
            type="button"
            onClick={() =>
              setWorking((p) => ({
                ...p,
                teams: p.teams === "favourites" ? "all" : "favourites",
              }))
            }
            className={`fs-chip${working.teams === "favourites" ? " fs-chip--active" : ""}${
              !hasFavourites ? " fs-chip--disabled" : ""
            }`}
            disabled={!hasFavourites}
          >
            My Favourites
          </button>
        </div>
      </div>

      <div className="fs-section">
        <p className="fs-section-label">
          Group
          {working.groups.length > 0 && (
            <span className="fs-group-count"> · {working.groups.length} selected</span>
          )}
        </p>
        <div className="fs-group-grid">
          {GROUPS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => toggleGroup(g)}
              className={`fs-chip fs-chip--group${working.groups.includes(g) ? " fs-chip--active" : ""}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`fs-apply-btn${workingFiltered ? " fs-apply-btn--ready" : ""}`}
        onClick={apply}
      >
        {workingFiltered ? "Apply Filter" : "Show All Matches"}
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <div className="fs-backdrop fs-backdrop--desktop" onClick={onClose} />
        <div ref={dropdownRef} className="fs-dropdown">
          {content}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fs-backdrop" onClick={onClose} />
      <div className="fs-sheet">
        <div className="fs-handle-wrap">
          <span className="fs-handle" />
        </div>
        {content}
      </div>
    </>
  );
}
