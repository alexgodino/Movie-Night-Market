import Link from "next/link";
import { Star } from "lucide-react";

type Props = {
  nightId: string;
  winnerTitle: string;
  avgRating: number | null;
  prompt?: boolean;
};

export function PreviousNightSection({ nightId, winnerTitle, avgRating, prompt = false }: Props) {
  if (!prompt) {
    return (
      <section className="section-card space-y-1 rounded-[2rem] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Last time
        </p>
        <h2 className="headline text-2xl text-[var(--ink-1)]">{winnerTitle}</h2>
        {avgRating !== null ? (
          <p className="flex items-center gap-1.5 text-base text-[var(--ink-2)]">
            <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
            Average rating: <strong className="text-[var(--ink-1)]">{avgRating.toFixed(1)}</strong>
          </p>
        ) : (
          <p className="text-base text-[var(--ink-2)]">No post-watch ratings yet.</p>
        )}
      </section>
    );
  }

  return (
    <section className="section-card space-y-3 rounded-[2rem] border border-amber-200 bg-amber-50/50 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Unfinished business
        </p>
        <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">
          Rate last night&apos;s winner first
        </h2>
      </div>
      <p className="text-base leading-7 text-[var(--ink-2)]">
        <strong className="text-[var(--ink-1)]">{winnerTitle}</strong>
        {avgRating !== null ? (
          <>
            {" "}
            - group average so far:{" "}
            <span className="font-semibold text-[var(--ink-1)]">{avgRating.toFixed(1)} stars</span>
          </>
        ) : (
          "."
        )}
      </p>
      <p className="text-sm leading-6 text-[var(--ink-2)]">
        This quick rating unlocks tonight&apos;s ballot.
      </p>
      <Link
        href={`/rate?nightId=${nightId}`}
        className="tap-button inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-base text-white"
      >
        <Star className="size-4" />
        Rate now
      </Link>
    </section>
  );
}
