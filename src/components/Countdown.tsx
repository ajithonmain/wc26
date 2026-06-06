import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { countdownTo } from "../lib/time";
import type { Countdown as CountdownType } from "../lib/time";
import "../styles/countdown.css";

function Unit({ value, label }: { value: number; label: string }): React.ReactElement {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="cd-unit-box relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: "-110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "110%", opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
            className="cd-digit absolute inset-0 flex items-center justify-center font-tabular font-bold"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="cd-label text-[9px] uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  );
}

function Sep(): React.ReactElement {
  return (
    <span className="cd-sep font-bold shrink-0">
      :
    </span>
  );
}

interface CountdownProps {
  kickoffUTC: string;
  className?: string;
}

export default function Countdown({
  kickoffUTC,
  className = "",
}: CountdownProps): React.ReactElement {
  const [cd, setCd] = useState<CountdownType>(() => countdownTo(kickoffUTC));

  useEffect(() => {
    if (cd.done) return;
    const id = setInterval(() => setCd(countdownTo(kickoffUTC)), 1000);
    return () => clearInterval(id);
  }, [kickoffUTC, cd.done]);

  if (cd.done) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="cd-kicked-off text-sm font-semibold">
          Kicked off
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {cd.d > 0 && (
        <>
          <Unit value={cd.d} label="d" />
          <Sep />
        </>
      )}
      <Unit value={cd.h} label="h" />
      <Sep />
      <Unit value={cd.m} label="m" />
      <Sep />
      <Unit value={cd.s} label="s" />
    </div>
  );
}
