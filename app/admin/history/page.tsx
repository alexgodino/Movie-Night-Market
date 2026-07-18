import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ClearArchiveHistoryForm } from "@/components/clear-archive-history-form";
import { DeleteArchivedNightForm } from "@/components/delete-archived-night-form";
import { clearArchivedNightHistoryAction, deleteArchivedNightAction } from "@/lib/actions";
import { getHistoryNights, getResultsForNight, getSeenBeforeStats } from "@/lib/queries";

type Props = {
  searchParams: Promise<{
    cleared?: string;
    deleted?: string;
  }>;
};

export default async function AdminHistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  await requireAdmin();
  const nights = await getHistoryNights();
  const archivedNights = nights.filter((night) => night.status === "ARCHIVED");

  return (
    <main className="app-shell space-y-5 pb-10">
      <Link href="/admin" className="text-sm font-semibold text-[var(--ink-2)]">
        Back to dashboard
      </Link>
      <section className="glass-panel rounded-[2rem] p-5">
        <h1 className="headline text-4xl">Movie night history</h1>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Review past lineups, winners, and family feedback.
        </p>
      </section>
      {params.cleared ? (
        <section className="section-card rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-[var(--market-up)]">
          Archived history cleared.
        </section>
      ) : null}
      {params.deleted ? (
        <section className="section-card rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-[var(--market-up)]">
          Archived movie night deleted.
        </section>
      ) : null}
      <section className="section-card space-y-3 rounded-[2rem] p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Reset
          </p>
          <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">Clear archived history</h2>
          <p className="mt-2 text-base leading-7 text-[var(--ink-2)]">
            Remove past movie nights so the app stops showing previous winner context.
          </p>
        </div>
        <ClearArchiveHistoryForm
          action={clearArchivedNightHistoryAction}
          disabled={archivedNights.length === 0}
        />
        {archivedNights.length === 0 ? (
          <p className="text-sm font-semibold text-[var(--ink-2)]">
            No archived history is stored right now.
          </p>
        ) : (
          <p className="text-sm font-semibold text-[var(--ink-2)]">
            This will remove {archivedNights.length} archived night
            {archivedNights.length === 1 ? "" : "s"}.
          </p>
        )}
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
            const seenBeforeStats = getSeenBeforeStats(night);
            const hasSeenBeforeData = Object.values(seenBeforeStats).some((stat) => stat.total > 0);

            return (
              <section key={night.id} className="section-card rounded-[2rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  {night.status.replaceAll("_", " ").toLowerCase()}
                </p>
                <h2 className="headline mt-2 text-3xl">{night.title}</h2>
                {night.notes ? (
                  <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[var(--ink-2)]">
                    {night.notes}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-1 gap-3 text-center text-sm sm:grid-cols-3">
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

                {night.status === "ARCHIVED" ? (
                  <div className="mt-4">
                    <DeleteArchivedNightForm
                      action={deleteArchivedNightAction}
                      nightId={night.id}
                      nightTitle={night.title}
                    />
                  </div>
                ) : null}
              </section>
            );
          }),
        )}
      </div>
    </main>
  );
}
