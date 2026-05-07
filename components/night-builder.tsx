"use client";

import { useActionState } from "react";
import { ImagePlus } from "lucide-react";
import type { FormState } from "@/lib/actions";
import { createMovieNightAction } from "@/lib/actions";

const initialState: FormState = {};
const optionNumbers = [1, 2, 3, 4, 5];

export function NightBuilder() {
  const [state, action, pending] = useActionState(createMovieNightAction, initialState);

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5 pb-32">
      <section className="glass-panel rounded-[2rem] p-5">
        <h1 className="headline text-4xl">Create movie night</h1>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Add five movies manually. These are the only options voters will see.
        </p>
        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-[var(--ink-1)]">
              Night title
            </label>
            <input
              id="title"
              name="title"
              defaultValue="Friday Movie Night"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
          <div>
            <label htmlFor="votingEndsAt" className="text-sm font-semibold text-[var(--ink-1)]">
              Optional voting close time
            </label>
            <input
              id="votingEndsAt"
              type="datetime-local"
              name="votingEndsAt"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-4">
        {optionNumbers.map((position) => (
          <section key={position} className="section-card rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Movie {position}
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <label
                  htmlFor={`movieTitle-${position}`}
                  className="text-sm font-semibold text-[var(--ink-1)]"
                >
                  Title
                </label>
                <input
                  id={`movieTitle-${position}`}
                  name={`movieTitle-${position}`}
                  required
                  className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label
                  htmlFor={`movieDescription-${position}`}
                  className="text-sm font-semibold text-[var(--ink-1)]"
                >
                  Description / blurb
                </label>
                <textarea
                  id={`movieDescription-${position}`}
                  name={`movieDescription-${position}`}
                  required
                  rows={4}
                  className="mt-2 w-full resize-y rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base leading-7 text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label
                  htmlFor={`moviePosterUrl-${position}`}
                  className="text-sm font-semibold text-[var(--ink-1)]"
                >
                  Poster image URL
                </label>
                <input
                  id={`moviePosterUrl-${position}`}
                  name={`moviePosterUrl-${position}`}
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label
                  htmlFor={`moviePosterFile-${position}`}
                  className="tap-button inline-flex w-full items-center justify-center gap-2 border border-[var(--line)] bg-white text-[var(--ink-1)]"
                >
                  <ImagePlus className="size-5" />
                  Upload poster instead
                </label>
                <input
                  id={`moviePosterFile-${position}`}
                  name={`moviePosterFile-${position}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="sticky-action-bar">
        <div className="mx-auto w-full max-w-3xl rounded-[1.6rem] border border-[var(--line)] bg-white/95 p-3 shadow-[0_16px_40px_rgba(23,33,31,0.14)]">
          <button
            type="submit"
            disabled={pending}
            className="tap-button w-full bg-[var(--accent)] text-lg text-white"
          >
            {pending ? "Creating night..." : "Create movie night"}
          </button>
        </div>
      </div>
    </form>
  );
}
