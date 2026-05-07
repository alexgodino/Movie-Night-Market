import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Star, Vote } from "lucide-react";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getLastArchivedNightSummary, getViewerState } from "@/lib/queries";

type Props = {
  searchParams: Promise<{
    prevRated?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const deviceId = await getDeviceIdFromCookie();
  await touchDeviceIdentity(deviceId);
  const { activeNight, hasVoted, hasRatedWinner } = await getViewerState(deviceId);
  const lastNight = await getLastArchivedNightSummary();

  if (!activeNight) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Movie Night Market
          </p>
          <h1 className="headline mt-3 text-5xl">No active movie night yet</h1>
          <p className="mt-4 text-lg leading-8 text-[var(--ink-2)]">
            The lineup hasn&apos;t been posted. Once an admin creates tonight&apos;s five choices,
            this screen turns into the family voting board.
          </p>
          {lastNight ? (
            <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Last time
              </p>
              <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">
                {lastNight.winnerTitle}
              </h2>
              {lastNight.avgRating !== null ? (
                <p className="mt-1 flex items-center gap-1.5 text-base text-[var(--ink-2)]">
                  <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
                  Average rating:{" "}
                  <strong className="text-[var(--ink-1)]">{lastNight.avgRating.toFixed(1)}</strong>
                </p>
              ) : (
                <p className="mt-1 text-base text-[var(--ink-2)]">No post-watch ratings yet.</p>
              )}
            </div>
          ) : null}
          <Link
            href="/admin/login"
            className="tap-button mt-6 inline-flex items-center justify-center bg-[var(--surface-4)] px-6 text-white"
          >
            Open admin tools
          </Link>
        </section>
      </main>
    );
  }

  if (activeNight.status === "POST_WATCH_OPEN") {
    if (!hasRatedWinner) {
      redirect("/rate");
    }

    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto size-12 text-[var(--market-up)]" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              All done
            </p>
            <h1 className="headline mt-2 text-4xl text-[var(--ink-1)]">
              You&apos;re all set for tonight.
            </h1>
          </div>
          <p className="text-lg leading-8 text-[var(--ink-2)]">
            Thanks for rating{" "}
            <strong className="text-[var(--ink-1)]">
              {activeNight.winnerMovie?.title ?? "tonight's pick"}
            </strong>
            . See you at the next movie night.
          </p>
        </section>
      </main>
    );
  }

  const canStartVoting = activeNight.status === "VOTING_OPEN" && !hasVoted;

  return (
    <main className="app-shell space-y-5 pb-10">
      {params.prevRated ? (
        <section className="section-card rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-[var(--market-up)]" />
            <p className="text-sm font-semibold text-[var(--ink-1)]">
              Last night&apos;s rating saved. Thanks!
            </p>
          </div>
        </section>
      ) : null}

      <section className="glass-panel rounded-[2rem] p-8 text-center space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Movie Night Market
          </p>
          <h1 className="headline mt-3 text-5xl leading-none text-[var(--ink-1)]">
            Ready to vote?
          </h1>
        </div>

        <p className="text-lg leading-8 text-[var(--ink-2)]">
          {canStartVoting
            ? "Tonight's five picks are ready. Rate them all from 1 to 5 and the live leaderboard unlocks once your ballot is in."
            : hasVoted
              ? "Your ballot is in. Follow the live leaderboard to see how the group rankings move."
              : "Voting is not open right now. Check back once the admin opens tonight's ballot."}
        </p>

        {lastNight ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Last time
            </p>
            <h2 className="headline mt-1 text-2xl text-[var(--ink-1)]">
              {lastNight.winnerTitle}
            </h2>
            {lastNight.avgRating !== null ? (
              <p className="mt-1 flex items-center gap-1.5 text-base text-[var(--ink-2)]">
                <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
                Average rating:{" "}
                <strong className="text-[var(--ink-1)]">{lastNight.avgRating.toFixed(1)}</strong>
              </p>
            ) : (
              <p className="mt-1 text-base text-[var(--ink-2)]">No post-watch ratings yet.</p>
            )}
          </div>
        ) : null}

        {canStartVoting ? (
          <Link
            href="/vote"
            className="tap-button inline-flex w-full items-center justify-center gap-2 bg-[var(--accent)] text-lg text-white"
          >
            <Vote className="size-5" />
            Start voting
          </Link>
        ) : hasVoted ? (
          <Link
            href="/results"
            className="tap-button inline-flex w-full items-center justify-center gap-2 bg-[var(--surface-4)] text-lg text-white"
          >
            View live results
          </Link>
        ) : null}
      </section>
    </main>
  );
}
