import Link from "next/link";
import { NightBuilder } from "@/components/night-builder";
import { requireAdmin } from "@/lib/auth";
import { getLastRunnerUpMovie } from "@/lib/queries";

export default async function AdminCreatePage() {
  await requireAdmin();
  const previousRunnerUp = await getLastRunnerUpMovie();

  return (
    <main className="app-shell space-y-5 pb-10">
      <Link href="/admin" className="text-sm font-semibold text-[var(--ink-2)]">
        Back to dashboard
      </Link>
      <NightBuilder
        previousRunnerUp={
          previousRunnerUp
            ? {
                title: previousRunnerUp.title,
                year: previousRunnerUp.year,
              }
            : null
        }
      />
    </main>
  );
}
