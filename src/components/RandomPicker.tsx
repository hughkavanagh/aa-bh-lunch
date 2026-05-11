"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PlaceWithStats } from "@/types";

interface RandomPickerProps {
  places: PlaceWithStats[];
  onSelect: (placeId: string) => void;
}

type PickerState = "idle" | "spinning" | "result";

export default function RandomPicker({ places, onSelect }: RandomPickerProps) {
  const [state, setState] = useState<PickerState>("idle");
  const [maxWalk, setMaxWalk] = useState(10);
  const [filterByWalk, setFilterByWalk] = useState(true);
  const [pickedPlace, setPickedPlace] = useState<PlaceWithStats | null>(null);

  const [spinNames, setSpinNames] = useState<string[]>([]);
  const [spinOffset, setSpinOffset] = useState(0);
  const [spinBlur, setSpinBlur] = useState(0);
  const spinRef = useRef<number>(0);
  const spinStartRef = useRef<number>(0);

  const eligible = filterByWalk
    ? places.filter((p) => p.walk_minutes <= maxWalk)
    : places;

  const buildSpinList = useCallback(() => {
    if (eligible.length === 0) return [];
    const names: string[] = [];
    for (let round = 0; round < 8; round++) {
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      names.push(...shuffled.map((p) => p.name));
    }
    return names;
  }, [eligible]);

  const handleSpin = useCallback(() => {
    if (eligible.length === 0) return;
    const names = buildSpinList();
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    const winIdx = names.length - 5;
    names[winIdx] = winner.name;

    setSpinNames(names);
    setPickedPlace(winner);
    setState("spinning");
    setSpinOffset(0);
    setSpinBlur(8);

    const itemHeight = 32;
    const totalDistance = winIdx * itemHeight;
    const duration = 2200;
    spinStartRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - spinStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const offset = eased * totalDistance;
      const speed = progress < 0.3 ? 1 : 1 - (progress - 0.3) / 0.7;
      setSpinBlur(speed * 8);
      setSpinOffset(offset);
      if (progress < 1) {
        spinRef.current = requestAnimationFrame(animate);
      } else {
        setSpinBlur(0);
        setState("result");
      }
    };
    spinRef.current = requestAnimationFrame(animate);
  }, [eligible, buildSpinList]);

  const handleBack = () => {
    if (spinRef.current) cancelAnimationFrame(spinRef.current);
    setState("idle");
    setPickedPlace(null);
    setSpinNames([]);
    setSpinOffset(0);
    setSpinBlur(0);
  };

  useEffect(() => {
    return () => {
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };
  }, []);

  const handleResultClick = () => {
    if (pickedPlace) onSelect(pickedPlace.id);
  };

  if (places.length === 0) return null;

  const spinReel = (
    <div
      className="h-8 overflow-hidden relative w-full"
      style={{ perspective: "300px" }}
    >
      <div
        className="absolute left-0 right-0"
        style={{
          transform: `translateY(${-spinOffset + 12}px)`,
          filter: spinBlur > 0.5 ? `blur(${spinBlur}px)` : "none",
        }}
      >
        {spinNames.map((name, i) => (
          <div
            key={i}
            className="h-8 flex items-center justify-center text-sm font-medium text-fg"
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );

  const backButton = (
    <button
      onClick={handleBack}
      className="w-6 h-6 flex items-center justify-center rounded-full bg-border/30 text-muted hover:text-fg transition-colors shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );

  const walkToggle = (
    <button
      onClick={() => setFilterByWalk((v) => !v)}
      className="w-10 h-6 rounded-full bg-fg/80 flex items-center px-1 transition-all shrink-0"
    >
      <div
        className={`w-4 h-4 rounded-full bg-bg flex items-center justify-center transition-transform duration-200 ${
          filterByWalk ? "" : "translate-x-4"
        }`}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {filterByWalk ? <path d="M19 12H5" /> : <path d="M5 12h14" />}
        </svg>
      </div>
    </button>
  );

  const walkLabel = (active: boolean) => (
    <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
      active ? "text-fg" : "text-muted/40"
    }`} />
  );
  void walkLabel;

  return (
    <>
      {/* ===== DESKTOP ===== */}
      <div className="hidden sm:block bg-border/20 border border-border/40 rounded-lg px-3 py-1 overflow-hidden flex-1">
        <div className="flex items-center gap-3 h-full">
          {(state === "result" || state === "spinning") && backButton}

          {state === "idle" && (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                  filterByWalk ? "text-fg" : "text-muted/40"
                }`}>Under</span>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setMaxWalk((v) => Math.min(v + 1, 60))}
                    className={`text-[10px] leading-none transition-colors ${
                      filterByWalk ? "text-fg/70 hover:text-fg" : "text-muted/30"
                    }`}
                    disabled={!filterByWalk}
                  >▲</button>
                  <span className={`text-sm font-semibold font-mono tabular-nums transition-colors ${
                    filterByWalk ? "text-fg" : "text-muted/40"
                  }`}>{maxWalk}</span>
                  <button
                    onClick={() => setMaxWalk((v) => Math.max(v - 1, 1))}
                    className={`text-[10px] leading-none transition-colors ${
                      filterByWalk ? "text-fg/70 hover:text-fg" : "text-muted/30"
                    }`}
                    disabled={!filterByWalk}
                  >▼</button>
                </div>
                <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                  filterByWalk ? "text-fg" : "text-muted/40"
                }`}>min walk</span>
              </div>
              {walkToggle}
              <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                filterByWalk ? "text-muted/40" : "text-fg"
              }`}>Doesn&apos;t Matter</span>
            </>
          )}

          {(state === "spinning" || state === "result") && (
            <div className="flex-1 flex items-center justify-center min-w-0">
              {state === "spinning" ? spinReel : (
                <button onClick={handleResultClick} className="text-sm font-medium text-fg hover:underline cursor-pointer">
                  {pickedPlace?.name}
                </button>
              )}
            </div>
          )}

          {state === "idle" && <div className="flex-1" />}

          <button
            onClick={state === "idle" || state === "result" ? handleSpin : undefined}
            disabled={eligible.length === 0 || state === "spinning"}
            className="px-4 py-1.5 text-xs font-medium uppercase tracking-widest bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            {state === "idle" ? "Choose for me" : "Spin again"}
          </button>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="sm:hidden bg-border/20 border border-border/40 rounded-xl p-3 overflow-hidden">
        {state === "idle" && (
          <div className="flex flex-col gap-3">
            {/* Filter row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                  filterByWalk ? "text-fg" : "text-muted/40"
                }`}>Under</span>
                <button
                  onClick={() => setMaxWalk((v) => Math.max(v - 1, 1))}
                  disabled={!filterByWalk}
                  className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${
                    filterByWalk
                      ? "border-border/60 text-fg hover:bg-border/30"
                      : "border-border/20 text-muted/30"
                  }`}
                >−</button>
                <span className={`text-base font-semibold font-mono tabular-nums w-6 text-center transition-colors ${
                  filterByWalk ? "text-fg" : "text-muted/40"
                }`}>{maxWalk}</span>
                <button
                  onClick={() => setMaxWalk((v) => Math.min(v + 1, 60))}
                  disabled={!filterByWalk}
                  className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${
                    filterByWalk
                      ? "border-border/60 text-fg hover:bg-border/30"
                      : "border-border/20 text-muted/30"
                  }`}
                >+</button>
                <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                  filterByWalk ? "text-fg" : "text-muted/40"
                }`}>min</span>
              </div>

              <div className="flex items-center gap-2">
                {walkToggle}
                <span className={`text-xs uppercase tracking-widest font-medium transition-colors ${
                  filterByWalk ? "text-muted/40" : "text-fg"
                }`}>Any</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleSpin}
              disabled={eligible.length === 0}
              className="w-full py-2.5 text-xs font-medium uppercase tracking-widest bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Choose for me
            </button>
          </div>
        )}

        {(state === "spinning" || state === "result") && (
          <div className="flex flex-col gap-3">
            {/* Reel / Result */}
            <div className="flex items-center gap-3">
              {backButton}
              <div className="flex-1 flex items-center justify-center min-w-0">
                {state === "spinning" ? spinReel : (
                  <button onClick={handleResultClick} className="text-sm font-medium text-fg hover:underline cursor-pointer">
                    {pickedPlace?.name}
                  </button>
                )}
              </div>
            </div>

            {/* Spin again */}
            <button
              onClick={state === "result" ? handleSpin : undefined}
              disabled={eligible.length === 0 || state === "spinning"}
              className="w-full py-2.5 text-xs font-medium uppercase tracking-widest bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Spin again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
