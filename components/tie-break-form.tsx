"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { CheckCircle2, Trophy } from "lucide-react";
import type { FormState } from "@/lib/actions";
import { submitTieBreakVoteAction } from "@/lib/actions";
import { MoviePoster } from "@/components/movie-poster";

type TieBreakOption = {
  optionId: string;
  title: string;
  year: number;
  runtimeMinutes: number;
  posterUrl?: string | null;
};

type Props = {
  nightId: string;
  options: TieBreakOption[];
  alreadySubmitted?: boolean;
};

const initialState: FormState = {};

export function TieBreakForm({ nightId, options, alreadySubmitted }: Props) {
  const [state, action, pending] = useActionState(submitTieBreakVoteAction, initialState);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="nightId" value={nightId} />

      <section className="glass-panel rounded-[1.5rem] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Tie Breaker
        </p>
        <h2 className="headline mt-2 text-3xl leading-tight text-[var(--ink-1)]">
          Choose tonight&apos;s winner
        </h2>
        <p className="mt-2 text-base leading-7 text-[var(--ink-2)]">
          The finalists are locked. Pick the one you want on the couch.
        </p>
      </section>

      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Tie-break choice</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option) => {
            const selected = selectedOptionId === option.optionId;

            return (
              <motion.label
                key={option.optionId}
                layout
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className={clsx(
                  "group relative block cursor-pointer overflow-hidden rounded-[1.75rem] border bg-white p-3 text-left shadow-sm transition",
                  selected
                    ? "border-[var(--surface-4)] shadow-[0_12px_32px_rgba(38,73,71,0.16)]"
                    : "border-[var(--line)]",
                )}
              >
                <input
                  type="radio"
                  name="tieChoice"
                  value={option.optionId}
                  checked={selected}
                  onChange={() => setSelectedOptionId(option.optionId)}
                  required
                  className="sr-only"
                />

                <div className="relative overflow-hidden rounded-[1.4rem]">
                  <MoviePoster title={option.title} posterUrl={option.posterUrl} />
                  <div
                    className={clsx(
                      "pointer-events-none absolute inset-0 transition-opacity duration-200",
                      selected ? "bg-[rgba(23,33,31,0.04)]" : "bg-transparent",
                    )}
                  />
                  <div
                    className={clsx(
                      "absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border bg-white/90 shadow-sm transition",
                      selected
                        ? "border-[var(--market-up)] text-[var(--market-up)]"
                        : "border-[var(--line)] text-[var(--ink-2)] opacity-80",
                    )}
                    aria-hidden="true"
                  >
                    <CheckCircle2 className="size-4" />
                  </div>
                </div>

                <div className="px-1 pb-1 pt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                    <Trophy className="size-3.5" />
                    Finalist
                  </div>
                  <h3 className="headline mt-1 text-2xl leading-tight text-[var(--ink-1)]">
                    {option.title}
                  </h3>
                </div>
              </motion.label>
            );
          })}
        </div>
      </fieldset>

      {alreadySubmitted ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-[var(--market-up)]">
          Tie-break vote saved. You can change it while the tie stays open.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !selectedOptionId}
        className="tap-button inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
      >
        <CheckCircle2 className="size-5" />
        {pending ? "Saving..." : "Confirm selection"}
      </button>
    </form>
  );
}
