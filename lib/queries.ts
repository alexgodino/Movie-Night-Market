import { Prisma, MovieNightStatus } from "@prisma/client";
import { formatDistanceToNowStrict } from "date-fns";
import { prisma } from "@/lib/prisma";
import { rankMovies } from "@/lib/scoring";

const activeStatuses: MovieNightStatus[] = [
  "DRAFT",
  "VOTING_OPEN",
  "VOTING_CLOSED",
  "TIE_BREAK_OPEN",
  "WINNER_REVEALED",
  "POST_WATCH_OPEN",
];

const postWatchRatingSelect = {
  id: true,
  movieNightId: true,
  deviceIdentityId: true,
  ratingValue: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostWatchRatingSelect;

const nightInclude = {
  options: {
    orderBy: { position: "asc" },
    include: { movie: true },
  },
  winnerMovie: true,
  runnerUpMovie: true,
  preWatchVotes: {
    include: {
      deviceIdentity: true,
      items: {
        include: {
          movieNightOption: true,
        },
      },
    },
  },
  tieBreakVotes: {
    include: {
      deviceIdentity: true,
      movieNightOption: {
        include: { movie: true },
      },
    },
  },
  postWatchRatings: {
    select: postWatchRatingSelect,
  },
} satisfies Prisma.MovieNightInclude;

export type NightWithDetails = Prisma.MovieNightGetPayload<{
  include: typeof nightInclude;
}>;

export async function getActiveNight() {
  return prisma.movieNight.findFirst({
    where: { status: { in: activeStatuses } },
    orderBy: { createdAt: "desc" },
    include: nightInclude,
  });
}

export async function getNightById(id: string) {
  return prisma.movieNight.findUnique({
    where: { id },
    include: nightInclude,
  });
}

export async function getHistoryNights() {
  return prisma.movieNight.findMany({
    orderBy: { createdAt: "desc" },
    include: nightInclude,
  });
}

export async function getResultsForNight(night: NightWithDetails) {
  const ballots = night.preWatchVotes.map((vote) => ({
    deviceKey: vote.deviceIdentity.deviceKey,
    ratings: vote.items.map((item) => ({
      optionId: item.movieNightOptionId,
      movieId: item.movieNightOption.movieId,
      rating: item.rating,
    })),
  }));

  const ranked = rankMovies(ballots);

  return night.options
    .map((option) => {
      const score = ranked.find((entry) => entry.optionId === option.id);

      return {
        optionId: option.id,
        title: option.movie.title,
        movieId: option.movie.id,
        slug: option.movie.slug,
        year: option.movie.year,
        runtimeMinutes: option.movie.runtimeMinutes,
        genres: option.movie.genres.split(", "),
        synopsis: option.movie.synopsis,
        posterUrl: option.movie.posterUrl,
        position: option.position,
        debugSummary: option.debugSummary,
        score: score?.score ?? 0,
        robustAverage: score?.robustAverage ?? 0,
        approvalShare: score?.approvalShare ?? 0,
        dislikeShare: score?.dislikeShare ?? 0,
        volatility: score?.volatility ?? 0,
        voteCount: score?.voteCount ?? 0,
        ratingCounts: score?.ratingCounts ?? {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
        },
        profileLabel: score?.profileLabel ?? "Waiting for votes",
      };
    })
    .sort((left, right) => right.score - left.score || left.position - right.position);
}

export function getTiedFirstPlaceResults(results: Awaited<ReturnType<typeof getResultsForNight>>) {
  const topScore = results[0]?.score;
  if (topScore === undefined) {
    return [];
  }

  const tied = results.filter((result) => Math.abs(result.score - topScore) < 0.01);
  return tied.length > 1 ? tied : [];
}

export async function getViewerState(deviceKey: string) {
  const activeNight = await getActiveNight();

  if (!activeNight) {
    return {
      activeNight: null,
      hasVoted: false,
      hasRatedWinner: false,
      hasTieBreakVoted: false,
      viewerVoteId: null as string | null,
    };
  }

  const vote = activeNight.preWatchVotes.find(
    (entry) => entry.deviceIdentity.deviceKey === deviceKey,
  );
  const rating = activeNight.postWatchRatings.find(
    (entry) => entry.deviceIdentityId === vote?.deviceIdentityId,
  );

  return {
    activeNight,
    hasVoted: Boolean(vote),
    hasRatedWinner: Boolean(rating),
    hasTieBreakVoted: activeNight.tieBreakVotes.some(
      (entry) => entry.deviceIdentity.deviceKey === deviceKey,
    ),
    viewerVoteId: vote?.id ?? null,
  };
}

export async function getLastRunnerUpMovie() {
  const lastNight = await prisma.movieNight.findFirst({
    where: {
      status: "ARCHIVED",
      runnerUpMovieId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      runnerUpMovie: true,
    },
  });

  return lastNight?.runnerUpMovie ?? null;
}

/**
 * Returns a summary of the most recently archived movie night — used on the
 * welcome screen to show "Last night: [Movie] — avg 3.8 ★" to everyone,
 * regardless of whether they participated.
 */
export async function getLastArchivedNightSummary() {
  const lastNight = await prisma.movieNight.findFirst({
    where: {
      status: "ARCHIVED",
      winnerMovieId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      winnerMovie: true,
      postWatchRatings: {
        select: postWatchRatingSelect,
      },
    },
  });

  if (!lastNight) return null;

  const avgRating =
    lastNight.postWatchRatings.length > 0
      ? lastNight.postWatchRatings.reduce((sum, r) => sum + r.ratingValue, 0) /
        lastNight.postWatchRatings.length
      : null;

  return {
    nightId: lastNight.id,
    winnerTitle: lastNight.winnerMovie?.title ?? "Last night's movie",
    avgRating,
    ratingCount: lastNight.postWatchRatings.length,
  };
}

/**
 * Returns context about a previous night that the user participated in but
 * hasn't yet submitted a post-watch rating for. Used to prompt them to rate
 * before starting a new voting session.
 *
 * Also returns the average post-watch rating from everyone else so we can
 * show "Last night: [Movie] — avg 3.8 ★" even if the user already rated.
 */
export async function getPendingRatingContext(deviceKey: string) {
  // Find the most recently archived night that had a winner
  const lastNight = await prisma.movieNight.findFirst({
    where: {
      status: "ARCHIVED",
      winnerMovieId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: nightInclude,
  });

  if (!lastNight) return null;

  // Only relevant if this device voted in it
  const vote = lastNight.preWatchVotes.find(
    (v) => v.deviceIdentity.deviceKey === deviceKey,
  );
  if (!vote) return null;

  const existingRating = lastNight.postWatchRatings.find(
    (r) => r.deviceIdentityId === vote.deviceIdentityId,
  );

  const avgRating =
    lastNight.postWatchRatings.length > 0
      ? lastNight.postWatchRatings.reduce((sum, r) => sum + r.ratingValue, 0) /
        lastNight.postWatchRatings.length
      : null;

  return {
    nightId: lastNight.id,
    winnerTitle: lastNight.winnerMovie?.title ?? "Last night's movie",
    avgRating,
    hasRated: Boolean(existingRating),
  };
}

export function getNightStatusCopy(status: MovieNightStatus) {
  switch (status) {
    case "DRAFT":
      return "Tonight's lineup is being prepared.";
    case "VOTING_OPEN":
      return "Voting is open now.";
    case "VOTING_CLOSED":
      return "Voting is closed while the winner is locked in.";
    case "TIE_BREAK_OPEN":
      return "A tie-break vote is open.";
    case "WINNER_REVEALED":
      return "The movie is picked. Ratings will open after the watch.";
    case "POST_WATCH_OPEN":
      return "Post-watch ratings are open.";
    case "ARCHIVED":
      return "This movie night has been archived.";
    default:
      return "Movie night status unavailable.";
  }
}

export function getCountdownCopy(votingEndsAt?: Date | null) {
  if (!votingEndsAt) {
    return null;
  }

  return `Voting closes in ${formatDistanceToNowStrict(votingEndsAt)}.`;
}
