import { MoviePoster } from "@/components/movie-poster";

type Props = {
  nightId: string;
  winnerTitle: string;
  posterUrl?: string | null;
};

export function PreviousNightSection({
  winnerTitle,
  posterUrl,
}: Props) {
  return (
    <section className="section-card rounded-[2rem] p-5">
      <div className="mx-auto w-full max-w-[18rem]">
        <MoviePoster
          title={winnerTitle}
          posterUrl={posterUrl}
          className="min-h-0 w-full rounded-[1.5rem]"
          bare
        />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Last time
      </p>
      <h2 className="headline mt-1 text-3xl leading-tight text-[var(--ink-1)]">{winnerTitle}</h2>
    </section>
  );
}
