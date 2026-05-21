import { Star } from "lucide-react";
import { MoviePoster } from "@/components/movie-poster";

type Props = {
  nightId: string;
  winnerTitle: string;
  posterUrl?: string | null;
  avgRating: number | null;
  prompt?: boolean;
};

export function PreviousNightSection({
  winnerTitle,
  posterUrl,
  avgRating,
  prompt = false,
}: Props) {
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
    <section className="section-card rounded-[2rem] border border-amber-200 bg-amber-50/45 p-4">
      <div className="grid grid-cols-[5.5rem_1fr] items-center gap-4">
        <MoviePoster
          title={winnerTitle}
          posterUrl={posterUrl}
          className="min-h-0 w-full rounded-[1rem]"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Rate before voting
          </p>
          <h2 className="headline mt-1 text-2xl leading-tight text-[var(--ink-1)]">
            {winnerTitle}
          </h2>
          {avgRating !== null ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-2)]">
              <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
              Group avg {avgRating.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
