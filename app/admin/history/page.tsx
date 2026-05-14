import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getHistoryNights, getResultsForNight, getSeenBeforeStats } from "@/lib/queries";

export default async function AdminHistoryPage() {
  await requireAdmin();
  const nights = await getHistoryNights();

  return (
    <main className="app-shell space-y-5 pb-10">
      <Link href="/admin" className="text-sm font-semibold text-[var(--ink-2)]">
        ← Back to dashboard
      </Link>
      <section className="glass-panel rounded-[2rem] p-5">
        <h1 className="headline text-4xl">Movie night history</h1>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Review past lineups, winners, and family feedback.
        </p>
      </section>
      <div className="space-y-4">
        {await Promise.all(
          nights.map(async (night) => {
            const results = await getResultsForNight(night);
            const winner = night.winnerMovie?.title ?? results[0]?.title ?? "Not revealed";
            const runnerUp =
              night.runnerUpMovie?.title ??
              results.find((result) => result.movieId !== night.winnerMovieId)?.title ??
              "n/a";
            const averagePostWatch =
              night.postWatchRatings.length > 0
                ? (
                    night.postWatchRatings.reduce((sum, entry) => sum + entry.ratingValue, 0) /
                    night.postWatchRatings.length
                  ).toFixed(1)
                : "n/a";

            const seenBeforeStats = getSeenBeforeStats(night);
            const hasSeenBeforeData = Object.values(seenBeforeStats).some((stat) => stat.total > 0);

            return (
              <section key={night.id} className="section-card rounded-[2rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  {night.status.replaceAll("_", " ").toLowerCase()}
                </p>
                <h2 className="headline mt-2 text-3xl">{night.title}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-bold text-[var(--ink-1)]">{night.preWatchVotes.length}</div>
                    <div className="text-[var(--ink-2)]">ballots</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-bold text-[var(--ink-1)]">{winner}</div>
                    <div className="text-[var(--ink-2)]">winner</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-bold text-[var(--ink-1)]">{runnerUp}</div>
                    <div className="text-[var(--ink-2)]">runner-up</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-bold text-[var(--ink-1)]">{averagePostWatch}</div>
                    <div className="text-[var(--ink-2)]">avg rating</div>
                  </div>
                </div>

                {hasSeenBeforeData && (
                  <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                      Seen this before
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      {night.options.map((option) => {
                        const stat = seenBeforeStats[option.id];
                        if (!stat || stat.total === 0) return null;
                        const percentage = ((stat.seenBefore / stat.total) * 100).toFixed(0);
                        return (
                          <div key={option.id} className="flex items-center justify-between text-[var(--ink-2)]">
                            <span>{stat.title}</span>
                            <span className="font-semibold text-[var(--ink-1)]">
                              {stat.seenBefore}/{stat.total} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          }),
        )}
      </div>
    </main>
  );
}
