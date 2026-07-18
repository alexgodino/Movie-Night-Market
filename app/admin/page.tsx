import Link from "next/link";
import { BarChart3, LogOut, Plus, Star } from "lucide-react";
import {
  archiveNightAction,
  logoutAdminAction,
  overrideWinnerAction,
  revealWinnerAction,
} from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getActiveNight, getResultsForNight } from "@/lib/queries";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const activeNight = await getActiveNight();
  const results = activeNight ? await getResultsForNight(activeNight) : [];

  return (
    <main className="app-shell space-y-5 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Admin dashboard
            </p>
            <h1 className="headline mt-2 text-4xl text-[var(--ink-1)]">Movie Night Market</h1>
          </div>
          <form action={logoutAdminAction}>
            <button className="tap-button inline-flex items-center gap-2 border border-[var(--line)] bg-white px-4 text-[var(--ink-1)]">
              <LogOut className="size-4" />
              Exit
            </button>
          </form>
        </div>

        {/* Primary action — always visible at top */}
        <Link
          href="/admin/create"
          className="tap-button mt-5 inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
        >
          <Plus className="size-5" />
          Create Movie Night
        </Link>

        {/* Secondary nav */}
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link
            href="/admin/history"
            className="tap-button inline-flex items-center justify-center gap-2 border border-[var(--line)] bg-white text-sm text-[var(--ink-1)]"
          >
            <BarChart3 className="size-4" />
            History
          </Link>
        </div>
      </section>

      {/* ── Active night controls ──────────────────────────────────────────── */}
      {activeNight ? (
        <>
          <section className="section-card rounded-[2rem] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Active night
            </p>
            <h2 className="headline mt-2 text-3xl text-[var(--ink-1)]">{activeNight.title}</h2>
            <p className="mt-2 text-base text-[var(--ink-2)]">
              Status:{" "}
              <strong className="text-[var(--ink-1)]">
                {activeNight.status.replaceAll("_", " ").toLowerCase()}
              </strong>
            </p>
            {activeNight.notes ? (
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[var(--ink-2)]">
                {activeNight.notes}
              </p>
            ) : null}
            <div className="mt-5 grid gap-3">
              <form action={revealWinnerAction}>
                <button className="tap-button w-full border border-[var(--line)] bg-white text-[var(--ink-1)]">
                  Reveal winner
                </button>
              </form>
              <form action={archiveNightAction}>
                <button className="tap-button w-full border border-[var(--line)] bg-white text-[var(--ink-1)]">
                  Archive night
                </button>
              </form>
            </div>
          </section>

          {activeNight.winnerMovieId ? (
            <section className="section-card rounded-[2rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Winner override
              </p>
              <h2 className="headline mt-2 text-2xl text-[var(--ink-1)]">Group chose something else?</h2>
              <p className="mt-2 text-base leading-7 text-[var(--ink-2)]">
                Use this only when the vote winner was revealed, but the room decides to watch a
                different movie.
              </p>
              <form action={overrideWinnerAction} className="mt-4 space-y-3">
                <label htmlFor="optionId" className="text-sm font-semibold text-[var(--ink-1)]">
                  Actual movie watched
                </label>
                <select
                  id="optionId"
                  name="optionId"
                  defaultValue={
                    activeNight.options.find((option) => option.movieId === activeNight.winnerMovieId)?.id
                  }
                  className="min-h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-base font-semibold text-[var(--ink-1)]"
                >
                  {activeNight.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.movie.title}
                    </option>
                  ))}
                </select>
                <button className="tap-button w-full border border-[var(--line)] bg-white text-[var(--ink-1)]">
                  Save winner override
                </button>
              </form>
            </section>
          ) : null}

          {/* Debug scoring */}
          {results.length > 0 && (
            <section className="section-card rounded-[2rem] p-5">
              <div className="flex items-center gap-2 text-[var(--accent-strong)]">
                <Star className="size-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                  Debug scoring view
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {results.map((result, index) => (
                  <div key={result.optionId} className="rounded-[1.4rem] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--ink-1)]">
                          #{index + 1} {result.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--ink-2)]">{result.profileLabel}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-[var(--ink-1)]">
                          {result.score.toFixed(2)}
                        </div>
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--ink-2)]">
                          score
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-2)]">
                      Balanced avg {result.robustAverage.toFixed(2)} · High{" "}
                      {(result.approvalShare * 100).toFixed(0)}% · Low{" "}
                      {(result.dislikeShare * 100).toFixed(0)}% · Vol{" "}
                      {result.volatility.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="glass-panel rounded-[2rem] p-6 text-center">
          <h2 className="headline text-3xl text-[var(--ink-1)]">No active movie night</h2>
          <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
            Use the button above to create tonight&apos;s lineup.
          </p>
        </section>
      )}
    </main>
  );
}
