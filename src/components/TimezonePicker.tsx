import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TZ_OPTIONS, BROWSER_TZ, tzAbbr } from "../lib/timezones";
import { useUIStore } from "../store/uiSlice";
import Icon from "./Icon";
import "../styles/timezonepicker.css";

const inList = TZ_OPTIONS.some((o) => o.tz === BROWSER_TZ);
const TZ_LIST = inList ? TZ_OPTIONS : [{ tz: BROWSER_TZ, label: "Local" }, ...TZ_OPTIONS];

// ── Option row ────────────────────────────────────────────────────────────────

function TZOption({ tz, label, active, onSelect }: {
  tz: string;
  label: string;
  active: boolean;
  onSelect: (tz: string) => void;
}): React.ReactElement {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      ref={ref}
      onClick={() => onSelect(tz)}
      className={`tzp-option flex items-center w-full text-left${active ? " tzp-option--active" : ""}`}
    >
      <span className="tzp-option-label flex-1 truncate">{label}</span>
      <span className="tzp-option-abbr shrink-0">{tzAbbr(tz)}</span>
      <span className={`tzp-option-check shrink-0${active ? "" : " invisible"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    </button>
  );
}

// ── Shared list ───────────────────────────────────────────────────────────────

function TZList({ timezone, onSelect }: {
  timezone: string;
  onSelect: (tz: string) => void;
}): React.ReactElement {
  return (
    <div className="tzp-list overflow-y-auto">
      {TZ_LIST.map((opt) => (
        <TZOption
          key={opt.tz}
          tz={opt.tz}
          label={opt.label}
          active={opt.tz === timezone}
          onSelect={onSelect}
        />
      ))}
      <div className="tzp-list-pad" />
    </div>
  );
}

// ── Anchor rect (computed when picker opens) ──────────────────────────────────

interface AnchorPos { top: number; left: number; }

function computeDropdownPos(el: HTMLElement): AnchorPos {
  const rect = el.getBoundingClientRect();
  const dropH = Math.min(480, window.innerHeight - 48);
  // Try to align top with button; push up if it would overflow bottom
  const top = Math.min(rect.top, window.innerHeight - dropH - 12);
  return { top: Math.max(12, top), left: rect.right + 8 };
}

// ── Picker ────────────────────────────────────────────────────────────────────

interface TZPickerProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function TZPicker({ open, onClose, anchorRef }: TZPickerProps): React.ReactElement {
  const { timezone, setTimezone } = useUIStore();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const [pos, setPos] = useState<AnchorPos | null>(null);

  useEffect(() => {
    if (open && isDesktop && anchorRef?.current) {
      setPos(computeDropdownPos(anchorRef.current));
    }
  }, [open, isDesktop, anchorRef]);

  const handleSelect = (tz: string) => {
    setTimezone(tz);
    onClose();
  };

  const content = isDesktop ? (
    // ── Desktop dropdown ──────────────────────────────────────────────────────
    <AnimatePresence>
      {open && pos && (
        <>
          <div className="tzp-dd-backdrop fixed inset-0" onClick={onClose} />
          <motion.div
            className="tzp-dropdown fixed flex flex-col"
            style={{ top: pos.top, left: pos.left }}
            initial={{ opacity: 0, x: -6, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.32, 0, 0.67, 0] }}
          >
            <div className="tzp-dd-hd flex items-center justify-between shrink-0">
              <span className="tzp-hd-title">Timezone</span>
              <button onClick={onClose} className="tzp-close flex items-center justify-center" aria-label="Close">
                <Icon name="x" size={14} />
              </button>
            </div>
            <TZList timezone={timezone} onSelect={handleSelect} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  ) : (
    // ── Mobile bottom sheet ───────────────────────────────────────────────────
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="tzp-backdrop fixed inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="tzp-sheet fixed bottom-0 left-0 right-0 flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <span className="tzp-handle" />
            </div>
            <div className="tzp-hd flex items-center justify-between shrink-0">
              <span className="tzp-hd-title">Timezone</span>
              <button onClick={onClose} className="tzp-close flex items-center justify-center" aria-label="Close">
                <Icon name="x" size={15} />
              </button>
            </div>
            <TZList timezone={timezone} onSelect={handleSelect} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
