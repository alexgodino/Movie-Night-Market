import Link from "next/link";
import { Vote } from "lucide-react";
import { PreviousNightSection } from "@/components/previous-night-section";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getLastArchivedNightSummary, getViewerState } from "@/lib/queries";

export default async function HomePage() {
  const deviceId = await getDeviceIdFromCookie();
  await touchDeviceIdentity(deviceId);
  const [{ activeNight, hasVoted }, lastNight] = await Promise.all([
    getViewerState(deviceId),
    getLastArchivedNightSummary(),
  ]);

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
            <div className="mt-6">
              <PreviousNightSection
                nightId={lastNight.nightId}
                winnerTitle={lastNight.winnerTitle}
                posterUrl={lastNight.winnerPosterUrl}
              />
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

  const canStartVoting = activeNight.status === "VOTING_OPEN" && !hasVoted;

  return (
    <main className="app-shell space-y-5 pb-10">
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
          <PreviousNightSection
            nightId={lastNight.nightId}
            winnerTitle={lastNight.winnerTitle}
            posterUrl={lastNight.winnerPosterUrl}
          />
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
