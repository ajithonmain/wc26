import { useRef, useEffect, useState } from "react";
import type { DayGroup } from "../hooks/useMatchesByDay";
import Icon from "./Icon";
import "../styles/daterail.css";

interface DateRailProps {
  days: DayGroup[];
  activeDay: string;
  onSelect: (dayKey: string) => void;
}

function pillParts(dayKey: string): { month: string; weekday: string; day: string } {
  const d = new Date(`${dayKey}T06:30:00Z`);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts })
      .format(d)
      .toUpperCase()
      .replace(/\./g, "");
  return {
    month: fmt({ month: "short" }),
    weekday: fmt({ weekday: "short" }),
    day: fmt({ day: "numeric" }),
  };
}

export default function DateRail({
  days,
  activeDay,
  onSelect,
}: DateRailProps): React.ReactElement {
  const activePillRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update arrow visibility
  const syncArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    syncArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    return () => el.removeEventListener("scroll", syncArrows);
  }, [days]);

  // Mouse wheel → horizontal scroll on desktop
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 2, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Drag to scroll on desktop
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      moved = false;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const delta = e.pageX - startX;
      if (Math.abs(delta) > 4) moved = true;
      el.scrollLeft = startScroll - delta;
    };

    const onMouseUp = () => {
      dragging = false;
      el.style.cursor = "grab";
      el.style.userSelect = "";
    };

    // Cancel the click that fires after a drag (capture phase runs before button handler)
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("click", onClick, true);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("click", onClick, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    activePillRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeDay]);

  const scroll = (dir: "left" | "right") => {
    railRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="dr-wrap relative">
      {/* Left arrow — desktop only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="dr-arrow dr-arrow--left hidden lg:flex"
          aria-label="Scroll dates left"
        >
          <Icon name="chevron-left" size={14} />
        </button>
      )}

      <div
        ref={railRef}
        className="dr-rail flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 py-3 shrink-0"
      >
        {days.map(({ dayKey, label }) => {
          const isActive = dayKey === activeDay;
          const { month, weekday, day } = pillParts(dayKey);
          return (
            <button
              key={dayKey}
              ref={isActive ? activePillRef : null}
              onClick={() => onSelect(dayKey)}
              className={`dr-pill flex flex-col items-center shrink-0 transition-all duration-200${isActive ? " dr-pill--active" : ""}`}
              aria-pressed={isActive}
              aria-label={label}
            >
              <span className={isActive ? "dr-month dr-month--active" : "dr-month"}>
                {month}
              </span>
              <span className={isActive ? "dr-weekday dr-weekday--active" : "dr-weekday"}>
                {weekday}
              </span>
              <span className={isActive ? "dr-day dr-day--active" : "dr-day"}>
                {day}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow — desktop only */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="dr-arrow dr-arrow--right hidden lg:flex"
          aria-label="Scroll dates right"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
}
