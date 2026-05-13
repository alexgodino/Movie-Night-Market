import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { MarketBoard } from "@/components/market-board";
import { TieBreakForm } from "@/components/tie-break-form";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getResultsForNight, getTiedFirstPlaceResults, getViewerState } from "@/lib/queries";

type Props = {
  searchParams: Promise<{
    submitted?: string;
    tiebreak?: string;
  }>;
};

export default async function ResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  const deviceId = await getDeviceIdFromCookie();
  await touchDeviceIdentity(deviceId);
  const { activeNight, hasVoted, hasRatedWinner, hasTieBreakVoted } =
    await getViewerState(deviceId);

  if (!activeNight) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">No live market yet</h1>
          <Link href="/" className="tap-button mt-5 inline-flex bg-[var(--surface-4)] px-6 text-white">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  if (!hasVoted) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">Vote first to unlock results</h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-2)]">
            The live board stays hidden until your anonymous ballot is submitted.
          </p>
          <Link href="/vote" className="tap-button mt-5 inline-flex bg-[var(--accent)] px-6 text-white">
            Go to voting
          </Link>
        </section>
      </main>
    );
  }

  // ── Post-watch phase: push the user to the rating flow / hard endpoint ──
  // Once the movie is watched, we stop showing the market board entirely.
  if (activeNight.status === "POST_WATCH_OPEN") {
    redirect(hasRatedWinner ? "/" : "/rate");
  }

  const results = await getResultsForNight(activeNight);
  const tiedFirst = getTiedFirstPlaceResults(results);
  const totalVotes = results.length > 0 ? (results[0].voteCount ?? 0) : 0;

  return (
    <main className="app-shell space-y-5 pb-10">

      {/* Post-vote confirmation banner */}
      {params.submitted ? (
        <section className="glass-panel rounded-[2rem] p-5 border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="size-8 text-[var(--market-up)] shrink-0 mt-0.5" />
            <div>
              <h2 className="headline text-2xl text-[var(--ink-1)]">You&apos;re all set for tonight.</h2>
              <p className="mt-1 text-base leading-7 text-[var(--ink-2)]">
                Come back after the movie to leave a final rating.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {activeNight.status === "TIE_BREAK_OPEN" && tiedFirst.length > 1 ? (
        <TieBreakForm
          nightId={activeNight.id}
          alreadySubmitted={hasTieBreakVoted || Boolean(params.tiebreak)}
          options={tiedFirst.map((result) => ({
            optionId: result.optionId,
            title: result.title,
            year: result.year,
            runtimeMinutes: result.runtimeMinutes,
            posterUrl: result.posterUrl,
          }))}
        />
      ) : null}

      {/* Standings header */}
      <section className="glass-panel rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          Live leaderboard
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="headline text-5xl">Tonight&apos;s Standings</h1>
          {totalVotes > 0 && (
            <span className="text-sm font-semibold text-[var(--ink-2)]">
              • {totalVotes} {totalVotes === 1 ? "Vote" : "Votes"}
            </span>
          )}
        </div>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Rankings update every few seconds. Scores favor movies the whole group can enjoy.
        </p>
      </section>

      <MarketBoard
        initialData={{
          nightId: activeNight.id,
          status: activeNight.status,
          title: activeNight.title,
          winnerMovieId: activeNight.winnerMovieId,
          results,
        }}
      />
    </main>
  );
}
