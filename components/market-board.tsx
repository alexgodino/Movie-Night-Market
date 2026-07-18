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

const scoreLayoutTransition = {
  type: "spring",
  stiffness: 130,
  damping: 24,
  mass: 1.05,
} as const;

export function MarketBoard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [scorePulseByOption, setScorePulseByOption] = useState<Record<string, "up" | "down">>({});
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
        const nextPulse: Record<string, "up" | "down"> = {};
        const nextHistory: Record<string, number[]> = { ...rankHistoryRef.current };

        nextData.results.forEach((entry, index) => {
          const currentRank = index + 1;
          const history = nextHistory[entry.optionId] ?? [];
          const previousRank = history[history.length - 1];

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
        setScorePulseByOption(nextPulse);

        if (scorePulseTimeoutRef.current !== null) {
          window.clearTimeout(scorePulseTimeoutRef.current);
          scorePulseTimeoutRef.current = null;
        }

        if (Object.keys(nextPulse).length > 0) {
          scorePulseTimeoutRef.current = window.setTimeout(() => {
            setScorePulseByOption({});
            scorePulseTimeoutRef.current = null;
          }, 1200);
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
  const standingsEntries = isRevealed && winnerEntry
    ? data.results.filter((result) => result.movieId !== data.winnerMovieId)
    : data.results;

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

      {winnerEntry ? (
        <section className="section-card overflow-hidden rounded-[2rem] bg-emerald-50/70 p-5 shadow-[0_12px_40px_rgba(45,125,95,0.16)] ring-2 ring-[var(--market-up)] ring-offset-2">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-bold text-[var(--market-up)]">
              <Trophy className="size-4" />
              Tonight&apos;s pick
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)] md:items-center">
            <div className="mx-auto w-full max-w-[20rem]">
              <MoviePoster
                title={winnerEntry.title}
                posterUrl={winnerEntry.posterUrl}
                className="min-h-0 w-full rounded-[1.8rem]"
                bare
              />
            </div>

            <div className="min-w-0 text-center md:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Winner
              </p>
              <h2 className="headline mt-2 text-5xl leading-none text-[var(--ink-1)]">
                {winnerEntry.title}
              </h2>
              {formatMovieMeta(winnerEntry.year, winnerEntry.runtimeMinutes) ? (
                <p className="mt-3 text-base font-semibold text-[var(--ink-2)]">
                  {formatMovieMeta(winnerEntry.year, winnerEntry.runtimeMinutes)}
                </p>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-2xl font-bold text-[var(--ink-1)]">
                    {winnerEntry.score.toFixed(2)}
                  </div>
                  <div className="text-sm text-[var(--ink-2)]">score</div>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-2xl font-bold text-[var(--ink-1)]">
                    {winnerEntry.robustAverage.toFixed(2)}
                  </div>
                  <div className="text-sm text-[var(--ink-2)]">avg</div>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-2xl font-bold text-[var(--ink-1)]">
                    {winnerEntry.voteCount}
                  </div>
                  <div className="text-sm text-[var(--ink-2)]">ballots</div>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <div className="text-2xl font-bold text-[var(--ink-1)]">
                    {winnerEntry.ratingCounts.five}
                  </div>
                  <div className="text-sm text-[var(--ink-2)]">5 star</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <LayoutGroup id="standings">
        <div className="space-y-4">
          {standingsEntries.map((entry, index) => {
            const currentRank = winnerEntry ? index + 2 : index + 1;
            const pulse = scorePulseByOption[entry.optionId];
            const movieMeta = formatMovieMeta(entry.year, entry.runtimeMinutes);

            return (
              <motion.section
                key={entry.optionId}
                layout
                transition={scoreLayoutTransition}
                className={clsx(
                  "section-card rounded-[2rem] p-5 transition-[box-shadow,background-color] duration-500",
                )}
              >
                <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] md:flex md:items-start md:gap-5">
                  <div className="shrink-0 md:w-40">
                    <MoviePoster
                      title={entry.title}
                      posterUrl={entry.posterUrl}
                      className="w-full"
                      bare
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                          Rank #{currentRank}
                        </p>
                        {entry.debugSummary === "Last night's runner-up" ? (
                          <p className="mt-1 text-xs font-semibold text-[var(--ink-2)]">
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
                          "shrink-0 rounded-[1.15rem] border px-2.5 py-2 text-right sm:rounded-[1.4rem]",
                          pulse === "up"
                            ? "border-emerald-200 bg-emerald-50 text-[var(--market-up)]"
                            : pulse === "down"
                              ? "border-rose-200 bg-rose-50 text-[var(--market-down)]"
                              : "border-transparent bg-[var(--surface-4)] text-white",
                        )}
                      >
                        <div
                          className={clsx(
                            "text-[0.65rem] uppercase tracking-[0.14em]",
                            pulse ? "opacity-70" : "text-white/70",
                          )}
                        >
                          #{currentRank} Score
                        </div>
                        <div className="mt-0.5 flex items-center justify-end gap-1 text-xl font-bold leading-none">
                          <span>{entry.score.toFixed(2)}</span>
                          {pulse === "up" ? (
                            <ArrowUpRight className="size-3 shrink-0 -translate-y-0.5" />
                          ) : pulse === "down" ? (
                            <ArrowDownRight className="size-3 shrink-0 -translate-y-0.5" />
                          ) : null}
                        </div>
                      </motion.div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-xl bg-white px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-3">
                        <div className="font-semibold text-[var(--ink-1)]">
                          {entry.robustAverage.toFixed(2)}
                        </div>
                        <div className="text-[var(--ink-2)]">Avg</div>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-3">
                        <div className="font-semibold text-[var(--ink-1)]">
                          {entry.ratingCounts.five}
                        </div>
                        <div className="text-[var(--ink-2)]">5★</div>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-3">
                        <div className="font-semibold text-[var(--ink-1)]">{entry.ratingCounts.one}</div>
                        <div className="text-[var(--ink-2)]">1★</div>
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
