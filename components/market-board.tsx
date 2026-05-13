"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, HelpCircle, Trophy } from "lucide-react";
import { RESULT_POLL_INTERVAL_MS } from "@/lib/constants";
import { MoviePoster } from "@/components/movie-poster";
import { formatMovieMeta } from "@/lib/format";

type ResultEntry = {
  optionId: string;
  title: string;
  movieId: string;
  slug: string;
  year: number;
  runtimeMinutes: number;
  genres: string[];
  synopsis: string;
  posterUrl?: string | null;
  position: number;
  debugSummary?: string | null;
  score: number;
  robustAverage: number;
  approvalShare: number;
  dislikeShare: number;
  volatility: number;
  voteCount: number;
  ratingCounts: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  profileLabel: string;
};

type Payload = {
  nightId: string;
  status: string;
  title: string;
  winnerMovieId: string | null;
  results: ResultEntry[];
};

type Props = {
  initialData: Payload;
};

type MovementLabel = "Underdog Run" | "Front Runner" | "Slipping" | "Quiet Climber" | "Volatile";

const scoreLayoutTransition = { type: "spring", stiffness: 220, damping: 28, mass: 0.8 };

function getMovementTone(label: MovementLabel) {
  switch (label) {
    case "Front Runner":
      return "border-emerald-200 bg-emerald-50 text-[var(--market-up)]";
    case "Underdog Run":
    case "Quiet Climber":
      return "border-sky-200 bg-sky-50 text-[#2a6b88]";
    case "Slipping":
      return "border-rose-200 bg-rose-50 text-[var(--market-down)]";
    case "Volatile":
      return "border-amber-200 bg-amber-50 text-[#8b5a1f]";
  }
}

function getProfileTone(label: string) {
  switch (label) {
    case "Broad Support":
      return "border-emerald-200 bg-emerald-50 text-[var(--market-up)]";
    case "Heavy Buzz":
      return "border-fuchsia-200 bg-fuchsia-50 text-[#9a3f86]";
    case "Divisive":
      return "border-amber-200 bg-amber-50 text-[#8b5a1f]";
    case "Cold Reception":
      return "border-rose-200 bg-rose-50 text-[var(--market-down)]";
    case "Casual Interest":
    default:
      return "border-[var(--line)] bg-white text-[var(--ink-2)]";
  }
}

function getMovementLabel(entry: ResultEntry, currentRank: number, history: number[]) {
  const openingRank = history[0] ?? entry.position;
  const previousRank = history[history.length - 1];
  const recentRanks = [...history.slice(-3), currentRank];
  const rankSpread = Math.max(...recentRanks) - Math.min(...recentRanks);
  const directionChanges = recentRanks.reduce((count, rank, index, all) => {
    if (index < 2) {
      return count;
    }

    const prevChange = all[index - 1] - all[index - 2];
    const nextChange = all[index] - all[index - 1];
    if (prevChange === 0 || nextChange === 0) {
      return count;
    }

    return Math.sign(prevChange) !== Math.sign(nextChange) ? count + 1 : count;
  }, 0);

  const movedUpThisRefresh =
    previousRank !== undefined ? previousRank > currentRank : openingRank > currentRank;
  const movedDownThisRefresh =
    previousRank !== undefined ? previousRank < currentRank : openingRank < currentRank;
  const netClimb = openingRank - currentRank;
  const stableTop =
    currentRank === 1 && (history.includes(1) || entry.position === 1 || history.length === 0);

  if (stableTop) {
    return "Front Runner";
  }

  if (netClimb >= 2 && currentRank <= 3 && entry.position >= 4) {
    return "Underdog Run";
  }

  if (directionChanges >= 2 || rankSpread >= 3) {
    return "Volatile";
  }

  if (movedUpThisRefresh || netClimb > 0) {
    return "Quiet Climber";
  }

  if (movedDownThisRefresh || netClimb < 0) {
    return "Slipping";
  }

  return currentRank === 1 ? "Front Runner" : "Quiet Climber";
}

export function MarketBoard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [scorePulseByOption, setScorePulseByOption] = useState<Record<string, "up" | "down">>({});
  const [movementByOption, setMovementByOption] = useState<Record<string, MovementLabel>>(
    Object.fromEntries(
      initialData.results.map((entry, index) => [
        entry.optionId,
        getMovementLabel(entry, index + 1, []),
      ]),
    ) as Record<string, MovementLabel>,
  );
  const rankHistoryRef = useRef<Record<string, number[]>>(
    Object.fromEntries(initialData.results.map((item) => [item.optionId, [] as number[]])),
  );
  const scorePulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const response = await fetch("/api/results/current", { cache: "no-store" });
      if (!response.ok || !active) {
        return;
      }

      const nextData = (await response.json()) as Payload;
      if (nextData.nightId === data.nightId) {
        const nextMovement: Record<string, MovementLabel> = {};
        const nextPulse: Record<string, "up" | "down"> = {};
        const nextHistory: Record<string, number[]> = { ...rankHistoryRef.current };

        nextData.results.forEach((entry, index) => {
          const currentRank = index + 1;
          const history = nextHistory[entry.optionId] ?? [];
          const previousRank = history[history.length - 1];

          nextMovement[entry.optionId] = getMovementLabel(entry, currentRank, history);

          if (previousRank !== undefined) {
            if (previousRank > currentRank) {
              nextPulse[entry.optionId] = "up";
            } else if (previousRank < currentRank) {
              nextPulse[entry.optionId] = "down";
            }
          }

          nextHistory[entry.optionId] = [...history, currentRank].slice(-6);
        });

        rankHistoryRef.current = nextHistory;
        setMovementByOption(nextMovement);
        setScorePulseByOption(nextPulse);

        if (scorePulseTimeoutRef.current !== null) {
          window.clearTimeout(scorePulseTimeoutRef.current);
          scorePulseTimeoutRef.current = null;
        }

        if (Object.keys(nextPulse).length > 0) {
          scorePulseTimeoutRef.current = window.setTimeout(() => {
            setScorePulseByOption({});
            scorePulseTimeoutRef.current = null;
          }, 850);
        }

        setData(nextData);
      }
    }

    const interval = window.setInterval(refresh, RESULT_POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
      if (scorePulseTimeoutRef.current !== null) {
        window.clearTimeout(scorePulseTimeoutRef.current);
        scorePulseTimeoutRef.current = null;
      }
    };
  }, [data.nightId]);

  const isRevealed = Boolean(data.winnerMovieId);
  const winnerEntry = isRevealed
    ? data.results.find((result) => result.movieId === data.winnerMovieId)
    : null;

  const isTied =
    isRevealed &&
    winnerEntry &&
    data.results.some(
      (result) =>
        result.movieId !== data.winnerMovieId && Math.abs(result.score - winnerEntry.score) < 0.01,
    );

  const tiedMovies = isTied
    ? data.results.filter(
        (result) => winnerEntry && Math.abs(result.score - winnerEntry.score) < 0.01,
      )
    : [];

  return (
    <div className="space-y-4">
      <details className="how-it-works section-card rounded-[1.5rem] p-0">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[var(--ink-1)]">
          <span className="inline-flex items-center gap-2">
            <HelpCircle className="size-4" />
            How it works
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            Details
          </span>
        </summary>
        <div className="border-t border-[var(--line)] px-4 pb-4 pt-3 text-base leading-7 text-[var(--ink-2)]">
          <p>Everyone rates each movie from 1-5.</p>
          <p className="mt-2">Average is the raw audience rating.</p>
          <p className="mt-2">
            The final Score is designed to find the movie the group is most collectively excited
            to watch, not just the movie with the most extreme supporters.
          </p>
          <p className="mt-2">
            To do this, the app slightly softens overly extreme ballots toward each voter&apos;s
            average, trims one high and one low rating when enough votes exist, rewards movies with
            broad support across the group, and penalizes divisive movies with lots of low ratings
            or highly split reactions.
          </p>
          <p className="mt-2">
            This means a movie with five consistent 4s will usually beat a movie with a mix of 1s
            and 5s.
          </p>
          <p className="mt-2">
            The system also reduces the impact of sandbagging ballots, so one aggressive voter
            cannot dominate the standings.
          </p>
        </div>
      </details>

      {isTied && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Tie between{" "}
          {tiedMovies.map((movie, index) => (
            <span key={movie.optionId}>
              {index > 0 && index === tiedMovies.length - 1 ? " and " : index > 0 ? ", " : ""}
              <span className="font-bold">{movie.title}</span>
            </span>
          ))}
        </div>
      )}

      <LayoutGroup id="standings">
        <div className="space-y-4">
          {data.results.map((entry, index) => {
            const currentRank = index + 1;
            const movementLabel = movementByOption[entry.optionId] ?? "Quiet Climber";
            const movementTone = getMovementTone(movementLabel);
            const profileTone = getProfileTone(entry.profileLabel);
            const pulse = scorePulseByOption[entry.optionId];
            const isWinner = isRevealed && entry.movieId === data.winnerMovieId;
            const isDimmed = isRevealed && !isWinner;
            const movieMeta = formatMovieMeta(entry.year, entry.runtimeMinutes);

            return (
              <motion.section
                key={entry.optionId}
                layout
                transition={scoreLayoutTransition}
                className={clsx(
                  "section-card rounded-[2rem] p-4 transition-[opacity,box-shadow,background-color] duration-300",
                  isWinner && [
                    "ring-2 ring-[var(--market-up)] ring-offset-2",
                    "bg-emerald-50/60",
                    "shadow-[0_0_0_4px_rgba(45,125,95,0.12),0_12px_40px_rgba(45,125,95,0.18)]",
                  ],
                  isDimmed && "opacity-60",
                )}
              >
                {isWinner ? (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-bold text-[var(--market-up)]">
                    <Trophy className="size-4" />
                    Tonight&apos;s pick
                  </div>
                ) : null}

                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 sm:w-28">
                    <MoviePoster title={entry.title} posterUrl={entry.posterUrl} compact />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                          Rank #{currentRank}
                        </p>
                        {entry.debugSummary === "Last night's runner-up" ? (
                          <p className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--ink-2)]">
                            Last night&apos;s runner-up
                          </p>
                        ) : null}
                        <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">{entry.title}</h2>
                        {movieMeta ? (
                          <p className="mt-1 text-sm font-semibold text-[var(--ink-2)]">{movieMeta}</p>
                        ) : null}
                      </div>

                      <motion.div
                        layout
                        className={clsx(
                          "shrink-0 rounded-2xl border px-3 py-2 text-right",
                          pulse === "up"
                            ? "border-emerald-200 bg-emerald-50 text-[var(--market-up)]"
                            : pulse === "down"
                              ? "border-rose-200 bg-rose-50 text-[var(--market-down)]"
                              : isWinner
                                ? "border-transparent bg-[var(--market-up)] text-white"
                                : "border-transparent bg-[var(--surface-4)] text-white",
                        )}
                      >
                        <div
                          className={clsx(
                            "text-xs uppercase tracking-[0.14em]",
                            pulse ? "opacity-70" : "text-white/70",
                          )}
                        >
                          Score
                        </div>
                        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-2xl font-bold leading-none">
                          <span>{entry.score.toFixed(2)}</span>
                          {pulse === "up" ? (
                            <ArrowUpRight className="size-3.5 shrink-0 -translate-y-0.5" />
                          ) : pulse === "down" ? (
                            <ArrowDownRight className="size-3.5 shrink-0 -translate-y-0.5" />
                          ) : null}
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                      <span className={clsx("inline-flex items-center rounded-full border px-3 py-1", movementTone)}>
                        {movementLabel}
                      </span>
                      <span className={clsx("inline-flex items-center rounded-full border px-3 py-1", profileTone)}>
                        {entry.profileLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <div className="font-semibold text-[var(--ink-1)]">
                          {entry.robustAverage.toFixed(2)}
                        </div>
                        <div className="text-[var(--ink-2)]">Average</div>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <div className="font-semibold text-[var(--ink-1)]">
                          {entry.ratingCounts.five}
                        </div>
                        <div className="text-[var(--ink-2)]">5-star ratings</div>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <div className="font-semibold text-[var(--ink-1)]">{entry.voteCount}</div>
                        <div className="text-[var(--ink-2)]">Votes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
