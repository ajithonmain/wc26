import { useRef, useState, useCallback, useEffect } from "react";
import type { Match } from "../types";
import MatchCard, { HeroCardWithCountdown } from "./MatchCard";
import "../styles/livecarousel.css";

interface LiveCarouselProps {
  liveMatches: Match[];
  nextMatch: Match | null;
}

export default function LiveCarousel({
  liveMatches,
  nextMatch,
}: LiveCarouselProps): React.ReactElement | null {
  const isLive = liveMatches.length > 0;
  const cards: Match[] = isLive ? liveMatches : nextMatch ? [nextMatch] : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [isLive]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || cards.length <= 1) return;
    const cardWidth = el.scrollWidth / cards.length;
    setActiveIndex(
      Math.min(Math.round(el.scrollLeft / cardWidth), cards.length - 1)
    );
  }, [cards.length]);

  const showDots = isLive && cards.length > 1;
  const isSingle = cards.length === 1;

  if (cards.length === 0) return null;

  return (
    <div className="pt-4 pb-1">
      {/* Section header */}
      <div className="px-4 mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive && (
            <span
              className="lc-live-dot w-2 h-2 rounded-full animate-pulse shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="lc-header-title text-base font-bold">
            {isLive ? "Live Now" : "Next Up"}
          </span>
        </div>
        {isLive && cards.length > 1 && (
          <span className="lc-view-all text-[11px] font-semibold">
            VIEW ALL
          </span>
        )}
      </div>

      {/* Scroll track */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={`lc-track flex gap-3 overflow-x-auto hide-scrollbar${isSingle ? " px-4" : " px-4"}`}
      >
        {cards.map((m) => (
          <div
            key={m.id}
            className="lc-slide shrink-0"
            style={{
              width: isSingle ? "100%" : "min(calc(100vw - 44px), 520px)",
            }}
          >
            {isLive ? (
              <MatchCard match={m} variant="hero" />
            ) : (
              <HeroCardWithCountdown match={m} />
            )}
          </div>
        ))}
        {/* Only need peek spacer for multi-card carousel */}
        {!isSingle && <div className="shrink-0 w-2" aria-hidden="true" />}
      </div>

      {showDots && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`lc-dot${i === activeIndex ? " lc-dot--active" : " lc-dot--inactive"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  );
}
