"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";

type Props = {
  nightId: string;
  winnerTitle: string;
  avgRating: number | null;
  hasRated: boolean;
};

export function PreviousNightSection({ nightId, winnerTitle, avgRating, hasRated }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // After dismissing the "rate now" prompt, or if already rated,
  // just show the summary card (can't dismiss that one)
  if (dismissed || hasRated) {
    return (
      <section className="section-card rounded-[2rem] p-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Last time
        </p>
        <h2 className="headline text-2xl text-[var(--ink-1)]">{winnerTitle}</h2>
        {avgRating !== null ? (
          <p className="text-base text-[var(--ink-2)] flex items-center gap-1.5">
            <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
            Average rating: <strong className="text-[var(--ink-1)]">{avgRating.toFixed(1)}</strong>
          </p>
        ) : (
          <p className="text-base text-[var(--ink-2)]">No post-watch ratings yet.</p>
        )}
      </section>
    );
  }

  // User participated but hasn't rated yet — show prompt
  return (
    <section className="glass-panel rounded-[2rem] p-5 border border-amber-200 bg-amber-50/40 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Unfinished business
          </p>
          <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">
            You never rated last night&apos;s movie.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full bg-white border border-[var(--line)] p-1.5 text-[var(--ink-2)] hover:text-[var(--ink-1)] transition-colors shrink-0 mt-0.5"
          aria-label="Skip"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-base text-[var(--ink-2)]">
        <strong className="text-[var(--ink-1)]">{winnerTitle}</strong>
        {avgRating !== null ? (
          <>
            {" "}— group average so far:{" "}
            <span className="font-semibold text-[var(--ink-1)]">{avgRating.toFixed(1)} ★</span>
          </>
        ) : null}
      </p>
      <div className="flex gap-3">
        <Link
          href={`/rate?nightId=${nightId}`}
          className="tap-button flex-1 inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white text-base"
        >
          <Star className="size-4" />
          Rate now
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="tap-button flex-1 border border-[var(--line)] bg-white text-[var(--ink-1)] text-base"
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}
