import Link from "next/link";
import { redirect } from "next/navigation";
import { VoteForm } from "@/components/vote-form";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getViewerState } from "@/lib/queries";

export default async function VotePage() {
  const deviceId = await getDeviceIdFromCookie();
  await touchDeviceIdentity(deviceId);
  const { activeNight, hasVoted } = await getViewerState(deviceId);

  if (!activeNight) {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">No active movie night</h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-2)]">
            The admin has not posted tonight&apos;s lineup yet.
          </p>
          <Link href="/" className="tap-button mt-5 inline-flex bg-[var(--surface-4)] px-6 text-white">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  if (hasVoted) {
    redirect("/results");
  }

  if (activeNight.status !== "VOTING_OPEN") {
    return (
      <main className="app-shell flex items-center">
        <section className="glass-panel w-full rounded-[2rem] p-6 text-center">
          <h1 className="headline text-4xl">Voting is closed</h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-2)]">
            This ballot is not accepting ratings right now.
          </p>
          <Link href="/" className="tap-button mt-5 inline-flex bg-[var(--surface-4)] px-6 text-white">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell pb-10">
      <VoteForm
        nightId={activeNight.id}
        title={activeNight.title}
        options={activeNight.options.map((option) => ({
          id: option.id,
          position: option.position,
          debugSummary: option.debugSummary,
          movie: {
            title: option.movie.title,
            year: option.movie.year,
            runtimeMinutes: option.movie.runtimeMinutes,
            synopsis: option.movie.synopsis,
            posterUrl: option.movie.posterUrl,
          },
        }))}
      />
    </main>
  );
}
