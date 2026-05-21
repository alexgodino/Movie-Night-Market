"use client";

import { useEffect, useState } from "react";
import { RESULT_POLL_INTERVAL_MS } from "@/lib/constants";

type Props = {
  nightId: string;
  initialCount: number;
};

type ResultsPayload = {
  nightId: string;
  results: Array<{ voteCount?: number | null }>;
};

export function LiveVoteCount({ nightId, initialCount }: Props) {
  const [voteCount, setVoteCount] = useState(initialCount);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const response = await fetch("/api/results/current", { cache: "no-store" });
      if (!response.ok || !active) {
        return;
      }

      const payload = (await response.json()) as ResultsPayload;
      if (payload.nightId !== nightId) {
        return;
      }

      setVoteCount(payload.results[0]?.voteCount ?? 0);
    }

    const interval = window.setInterval(refresh, RESULT_POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [nightId]);

  if (voteCount <= 0) {
    return null;
  }

  return (
    <span className="text-sm font-semibold text-[var(--ink-2)]">
      • {voteCount} {voteCount === 1 ? "Vote" : "Votes"}
    </span>
  );
}
