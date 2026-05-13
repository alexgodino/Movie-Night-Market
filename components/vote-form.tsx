"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/actions";
import { submitPreWatchVoteAction } from "@/lib/actions";
import { MoviePoster } from "@/components/movie-poster";
import { formatMovieMeta } from "@/lib/format";

type VoteOption = {
  id: string;
  position: number;
  debugSummary?: string | null;
  movie: {
    title: string;
    year: number;
    runtimeMinutes: number;
    synopsis: string;
    posterUrl?: string | null;
  };
};

type Props = {
  nightId: string;
  title: string;
  options: VoteOption[];
};

const initialState: FormState = {};

export function VoteForm({ nightId, title, options }: Props) {
  const [state, action, pending] = useActionState(submitPreWatchVoteAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="nightId" value={nightId} />

      <section className="glass-panel rounded-[1.5rem] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Anonymous ballot
        </p>
        <h1 className="headline mt-2 text-4xl leading-tight text-[var(--ink-1)]">{title}</h1>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Rate every movie from 1 to 5, then lock in your ballot.
        </p>
      </section>

      {options.map((option) => (
        <section key={option.id} className="section-card overflow-hidden rounded-[1.5rem]">
          <div className="p-4 pb-0">
            <MoviePoster title={option.movie.title} posterUrl={option.movie.posterUrl} />
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  Option {option.position}
                </p>
                {option.debugSummary === "Last night's runner-up" ? (
                  <p className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--ink-2)]">
                    Last night&apos;s runner-up
                  </p>
                ) : null}
                <h2 className="headline mt-1 text-3xl leading-tight text-[var(--ink-1)]">
                  {option.movie.title}
                </h2>
                {formatMovieMeta(option.movie.year, option.movie.runtimeMinutes) ? (
                  <p className="mt-1 text-sm font-semibold text-[var(--ink-2)]">
                    {formatMovieMeta(option.movie.year, option.movie.runtimeMinutes)}
                  </p>
                ) : null}
              </div>

              <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink-2)] shadow-sm">
                <input
                  type="checkbox"
                  name={`seen-${option.id}`}
                  className="size-4 rounded border-[var(--line)] accent-[var(--surface-4)]"
                />
                <span>Seen this before</span>
              </label>
            </div>
            <p className="text-base leading-7 text-[var(--ink-2)]">{option.movie.synopsis}</p>

            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 text-base font-bold text-[var(--ink-1)]">
                Pick a rating
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="rating-choice">
                    <input
                      type="radio"
                      name={`option-${option.id}`}
                      value={value}
                      required
                      className="rating-input"
                    />
                    <span className="rating-face">{value}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-2)]">
                <span>Skip</span>
                <span>Must Watch</span>
              </div>
            </fieldset>
          </div>
        </section>
      ))}

      <section className="glass-panel rounded-[1.5rem] p-5">
        {state.error ? (
          <p className="mb-3 rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="tap-button flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
        >
          <CheckCircle2 className="size-5" />
          {pending ? "Submitting your ballot..." : "Lock in my ratings"}
        </button>
      </section>
    </form>
  );
}
