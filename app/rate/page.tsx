import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PostWatchForm } from "@/components/post-watch-form";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getViewerState, getNightById } from "@/lib/queries";

type Props = {
  searchParams: Promise<{
    submitted?: string;
    nightId?: string;
  }>;
};

/**
 * Renders the shared "all set" hard endpoint. Shown when a rating has just
 * been submitted AND when a user who already rated returns to /rate.
 */
function AllDoneScreen({ movieTitle }: { movieTitle?: string | null }) {
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
          {movieTitle ? (
            <>
              Thanks for rating{" "}
              <strong className="text-[var(--ink-1)]">{movieTitle}</strong>. See you at the next
              movie night.
            </>
          ) : (
            <>Thanks for rating. See you at the next movie night.</>
          )}
        </p>
      </section>
    </main>
  );
}

export default async function RatePage({ searchParams }: Props) {
  const params = await searchParams;
  const deviceId = await getDeviceIdFromCookie();
  await touchDeviceIdentity(deviceId);

  // ── Fresh submission: hard-endpoint completion screen ────────────────────
  if (params.submitted) {
    return <AllDoneScreen />;
  }

  // ── Determine which night to rate ────────────────────────────────────────
  // Support ?nightId= for rating a specific (e.g. archived) night
  let targetNight: Awaited<ReturnType<typeof getNightById>> | null = null;
  let hasVoted = false;
  let hasRated = false;

  if (params.nightId) {
    targetNight = await getNightById(params.nightId);
    if (targetNight) {
      const vote = targetNight.preWatchVotes.find(
        (v) => v.deviceIdentity.deviceKey === deviceId,
      );
      hasVoted = Boolean(vote);
      hasRated = Boolean(
        targetNight.postWatchRatings.find((r) => r.deviceIdentityId === vote?.deviceIdentityId),
      );
    }
  } else {
    const viewerState = await getViewerState(deviceId);
    targetNight = viewerState.activeNight;
    hasVoted = viewerState.hasVoted;
    hasRated = viewerState.hasRatedWinner;
  }

  // ── Guard: no night or no winner ─────────────────────────────────────────
  if (!targetNight || !targetNight.winnerMovie) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">No winner selected yet</h1>
          <Link href="/" className="tap-button mt-5 inline-flex bg-[var(--surface-4)] px-6 text-white">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  // ── Already rated: render the hard endpoint ──────────────────────────────
  if (hasRated) {
    return <AllDoneScreen movieTitle={targetNight.winnerMovie.title} />;
  }

  // ── Guard: must have voted ────────────────────────────────────────────────
  if (!hasVoted) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">Vote before rating</h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-2)]">
            Post-watch ratings are for devices that participated in the ballot.
          </p>
          <Link href="/" className="tap-button mt-5 inline-flex bg-[var(--surface-4)] px-6 text-white">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  // ── Guard: night must be rateable ────────────────────────────────────────
  const rateableStatuses = ["POST_WATCH_OPEN", "ARCHIVED"];
  if (!rateableStatuses.includes(targetNight.status)) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">Ratings are not open yet</h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-2)]">
            The admin will open post-watch ratings after the movie is done.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell space-y-5 pb-10">
      <PostWatchForm nightId={targetNight.id} movieTitle={targetNight.winnerMovie.title} />
    </main>
  );
}
