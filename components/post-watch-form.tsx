"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { MoviePoster } from "@/components/movie-poster";
import type { FormState } from "@/lib/actions";
import { submitPostWatchRatingAction } from "@/lib/actions";

type Props = {
  nightId: string;
  movieTitle: string;
  posterUrl?: string | null;
};

const starSteps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const initialState: FormState = {};

export function PostWatchForm({ nightId, movieTitle, posterUrl }: Props) {
  const [state, action, pending] = useActionState(submitPostWatchRatingAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="nightId" value={nightId} />

      <section className="glass-panel rounded-[1.5rem] p-5 text-center">
        <div className="mx-auto w-40 max-w-[62vw]">
          <MoviePoster title={movieTitle} posterUrl={posterUrl} className="w-full" bare />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          Post-watch rating
        </p>
        <h1 className="headline mt-2 text-4xl leading-tight text-[var(--ink-1)]">{movieTitle}</h1>
      </section>

      <section className="section-card rounded-[1.5rem] p-5">
        <fieldset className="m-0 border-0 p-0">
          <legend className="block text-base font-bold text-[var(--ink-1)]">Your rating</legend>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {starSteps.map((value) => (
              <label key={value} className="post-rating-choice">
                <input
                  type="radio"
                  name="ratingValue"
                  value={value}
                  required
                  defaultChecked={value === 4}
                  className="post-rating-input"
                  aria-label={`${value.toFixed(1)} stars`}
                />
                <span className="post-rating-face">
                  <Star className="size-5 shrink-0" />
                  <span>{value.toFixed(1)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.error ? (
          <p className="mt-4 rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="tap-button mt-5 inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
        >
          {pending ? "Saving..." : "Submit rating"}
        </button>
      </section>
    </form>
  );
}
