"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, HelpCircle, Minus, Trophy } from "lucide-react";
import clsx from "clsx";
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
  score: number;
  robustAverage: number;
  approvalShare: number;
  dislikeShare: number;
  volatility: number;
  voteCount: number;
  trendLabel: string;
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

export function MarketBoard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const previousRanks = useRef<Record<string, number>>(
    Object.fromEntries(initialData.results.map((item, index) => [item.optionId, index])),
  );
  const [movementByOption, setMovementByOption] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    async function refresh() {
      const response = await fetch("/api/results/current", { cache: "no-store" });
      if (!response.ok || !active) {
        return;
      }

      const nextData = (await response.json()) as Payload;
      if (nextData.nightId === data.nightId) {
        setData(nextData);
      }
    }

    const interval = window.setInterval(refresh, RESULT_POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [data.nightId]);

  useEffect(() => {
    setMovementByOption(() => {
      const nextMovement: Record<string, number> = {};
      data.results.forEach((entry, index) => {
        const previousRank = previousRanks.current[entry.optionId];
        nextMovement[entry.optionId] =
          previousRank === undefined ? 0 : previousRank > index ? 1 : previousRank < index ? -1 : 0;
      });
      return nextMovement;
    });

    previousRanks.current = Object.fromEntries(
      data.results.map((entry, index) => [entry.optionId, index]),
    );
  }, [data.results]);

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
        <div className="space-y-3 border-t border-[var(--line)] px-4 pb-4 pt-3 text-base leading-7 text-[var(--ink-2)]">
          <p>Everyone rates all five movies from 1 to 5, no skipping.</p>
          <p>
            Extreme all-love/all-hate ballots are softened slightly so one passionate vote does
            not drown out the group.
          </p>
          <p>
            The <strong className="text-[var(--ink-1)]">market score</strong> rewards movies the
            whole group likes reasonably well and penalizes movies that split the room.
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

      {data.results.map((entry, index) => {
        const movement = movementByOption[entry.optionId] ?? 0;
        const isWinner = isRevealed && entry.movieId === data.winnerMovieId;
        const isDimmed = isRevealed && !isWinner;

        return (
          <motion.section
            key={entry.optionId}
            layout
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            className={clsx(
              "section-card rounded-[2rem] p-4 transition-all duration-500",
              isWinner && [
                "ring-2 ring-[var(--market-up)] ring-offset-2",
                "bg-emerald-50/60",
                "scale-[1.01]",
                "shadow-[0_0_0_4px_rgba(45,125,95,0.12),0_12px_40px_rgba(45,125,95,0.18)]",
              ],
              isDimmed && "opacity-60",
            )}
          >
            {isWinner && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-bold text-[var(--market-up)]">
                <Trophy className="size-4" />
                Tonight&apos;s pick
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-24 shrink-0">
                <MoviePoster title={entry.title} posterUrl={entry.posterUrl} compact />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                      Rank #{index + 1}
                    </p>
                    <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">{entry.title}</h2>
                    {formatMovieMeta(entry.year, entry.runtimeMinutes) ? (
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-2)]">
                        {formatMovieMeta(entry.year, entry.runtimeMinutes)}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={clsx(
                      "shrink-0 rounded-2xl px-3 py-2 text-right text-white",
                      isWinner ? "bg-[var(--market-up)]" : "bg-[var(--surface-4)]",
                    )}
                  >
                    <div className="text-xs uppercase tracking-[0.14em] text-white/70">Score</div>
                    <div className="text-2xl font-bold">{entry.score.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {movement > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[var(--market-up)]">
                      <ArrowUpRight className="size-4" />
                      Moving up
                    </span>
                  ) : movement < 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-[var(--market-down)]">
                      <ArrowDownRight className="size-4" />
                      Sliding down
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[var(--ink-2)]">
                      <Minus className="size-4" />
                      Holding steady
                    </span>
                  )}
                  <span className="text-[var(--ink-2)]">{entry.trendLabel}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-semibold text-[var(--ink-1)]">
                      {(entry.approvalShare * 100).toFixed(0)}%
                    </div>
                    <div className="text-[var(--ink-2)]">high ratings</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-semibold text-[var(--ink-1)]">
                      {entry.robustAverage.toFixed(2)}
                    </div>
                    <div className="text-[var(--ink-2)]">balanced avg</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-semibold text-[var(--ink-1)]">{entry.voteCount}</div>
                    <div className="text-[var(--ink-2)]">ballots</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
