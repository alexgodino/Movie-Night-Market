"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/actions";
import { submitTieBreakVoteAction } from "@/lib/actions";
import { MoviePoster } from "@/components/movie-poster";
import { formatMovieMeta } from "@/lib/format";

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

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="nightId" value={nightId} />

      <section className="glass-panel rounded-[1.5rem] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Tie-break
        </p>
        <h2 className="headline mt-2 text-3xl leading-tight text-[var(--ink-1)]">
          One quick pick
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          The top spot is tied. Pick one movie, or choose fine with either.
        </p>
      </section>

      <section className="section-card rounded-[1.5rem] p-4">
        <fieldset className="m-0 border-0 p-0">
          <legend className="sr-only">Tie-break choice</legend>
          <div className="grid gap-3">
            {options.map((option) => (
              <label key={option.optionId} className="tie-choice">
                <input
                  type="radio"
                  name="tieChoice"
                  value={option.optionId}
                  required
                  className="tie-choice-input"
                />
                <span className="tie-choice-face">
                  <span className="w-16 shrink-0">
                    <MoviePoster title={option.title} posterUrl={option.posterUrl} compact />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-bold text-[var(--ink-1)]">
                      {option.title}
                    </span>
                    {formatMovieMeta(option.year, option.runtimeMinutes) ? (
                      <span className="mt-1 block text-sm font-semibold text-[var(--ink-2)]">
                        {formatMovieMeta(option.year, option.runtimeMinutes)}
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            ))}

            <label className="tie-choice">
              <input
                type="radio"
                name="tieChoice"
                value="fine-with-either"
                required
                className="tie-choice-input"
              />
              <span className="tie-choice-face tie-choice-face-secondary">
                Fine with either
              </span>
            </label>
          </div>
        </fieldset>

        {alreadySubmitted ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-[var(--market-up)]">
            Tie-break vote saved. Waiting for the final pick.
          </p>
        ) : null}

        {state.error ? (
          <p className="mt-4 rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="tap-button mt-4 inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
        >
          <CheckCircle2 className="size-5" />
          {pending ? "Saving..." : alreadySubmitted ? "Update tie-break pick" : "Submit tie-break pick"}
        </button>
      </section>
    </form>
  );
}
