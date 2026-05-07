import Link from "next/link";
import { NightBuilder } from "@/components/night-builder";
import { requireAdmin } from "@/lib/auth";

export default async function AdminCreatePage() {
  await requireAdmin();

  return (
    <main className="app-shell space-y-5 pb-10">
      <Link href="/admin" className="text-sm font-semibold text-[var(--ink-2)]">
        Back to dashboard
      </Link>
      <NightBuilder />
    </main>
  );
}
