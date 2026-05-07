import { NextResponse } from "next/server";
import { getActiveNight, getResultsForNight } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const activeNight = await getActiveNight();

  if (!activeNight) {
    return NextResponse.json({
      nightId: "",
      status: "none",
      title: "",
      winnerMovieId: null,
      results: [],
    });
  }

  const results = await getResultsForNight(activeNight);

  return NextResponse.json({
    nightId: activeNight.id,
    status: activeNight.status,
    title: activeNight.title,
    winnerMovieId: activeNight.winnerMovieId,
    results,
  });
}
