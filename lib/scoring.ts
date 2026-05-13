type BallotInput = {
  deviceKey: string;
  ratings: Array<{
    optionId: string;
    movieId: string;
    rating: number;
  }>;
};

export type RankedMovieResult = {
  optionId: string;
  movieId: string;
  score: number;
  robustAverage: number;
  approvalShare: number;
  dislikeShare: number;
  volatility: number;
  voteCount: number;
  ratingCounts: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  profileLabel: string;
};

export type BallotAdjustmentSummary = {
  mean: number;
  spread: number;
  adjustmentFactor: number;
  adjustedRatings: Record<string, number>;
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function trimmedAverage(values: number[]) {
  if (values.length <= 4) {
    return average(values);
  }

  const sorted = [...values].sort((a, b) => a - b);
  return average(sorted.slice(1, -1));
}

function countRatings(values: number[]) {
  return values.reduce(
    (counts, value) => {
      if (value === 1) counts.one += 1;
      if (value === 2) counts.two += 1;
      if (value === 3) counts.three += 1;
      if (value === 4) counts.four += 1;
      if (value === 5) counts.five += 1;
      return counts;
    },
    {
      one: 0,
      two: 0,
      three: 0,
      four: 0,
      five: 0,
    },
  );
}

function getProfileLabel({
  ratingCounts,
  approvalShare,
  dislikeShare,
  robustAverage,
}: {
  ratingCounts: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
  approvalShare: number;
  dislikeShare: number;
  robustAverage: number;
}) {
  const voteCount =
    ratingCounts.one +
    ratingCounts.two +
    ratingCounts.three +
    ratingCounts.four +
    ratingCounts.five;

  if (!voteCount) {
    return "Casual Interest";
  }

  const lowShare = (ratingCounts.one + ratingCounts.two) / voteCount;
  const highShare = (ratingCounts.four + ratingCounts.five) / voteCount;
  const fiveShare = ratingCounts.five / voteCount;
  const oneShare = ratingCounts.one / voteCount;
  const mixedExtremes = oneShare >= 0.2 && fiveShare >= 0.2;

  if (lowShare >= 0.4 || dislikeShare >= 0.4 || robustAverage <= 2.6) {
    return "Cold Reception";
  }

  if (mixedExtremes && highShare >= 0.5) {
    return "Divisive";
  }

  if (fiveShare >= 0.32 && ratingCounts.five >= ratingCounts.four) {
    return "Heavy Buzz";
  }

  if (ratingCounts.four >= ratingCounts.three && highShare >= 0.55 && lowShare <= 0.18) {
    return "Broad Support";
  }

  if (approvalShare >= 0.45 && dislikeShare <= 0.2) {
    return "Broad Support";
  }

  return "Casual Interest";
}

export function adjustBallot(ballot: BallotInput): BallotAdjustmentSummary {
  const ratings = ballot.ratings.map((item) => item.rating);
  const mean = average(ratings);
  const spread = Math.max(...ratings) - Math.min(...ratings);
  const extremes = ratings.filter((value) => value === 1 || value === 5).length;
  const adjustmentFactor =
    spread >= 4 && extremes >= 4 ? 0.2 : spread >= 3 && extremes >= 3 ? 0.1 : 0.04;

  const adjustedRatings = ballot.ratings.reduce<Record<string, number>>((acc, item) => {
    acc[item.optionId] = Number(
      (item.rating * (1 - adjustmentFactor) + mean * adjustmentFactor).toFixed(3),
    );
    return acc;
  }, {});

  return {
    mean: Number(mean.toFixed(3)),
    spread,
    adjustmentFactor,
    adjustedRatings,
  };
}

export function rankMovies(ballots: BallotInput[]) {
  const byOption = new Map<
    string,
    {
      movieId: string;
      adjustedRatings: number[];
      rawRatings: number[];
    }
  >();

  for (const ballot of ballots) {
    const adjusted = adjustBallot(ballot);

    for (const item of ballot.ratings) {
      const bucket =
        byOption.get(item.optionId) ??
        {
          movieId: item.movieId,
          adjustedRatings: [],
          rawRatings: [],
        };

      bucket.adjustedRatings.push(adjusted.adjustedRatings[item.optionId]);
      bucket.rawRatings.push(item.rating);
      byOption.set(item.optionId, bucket);
    }
  }

  const results: RankedMovieResult[] = [...byOption.entries()].map(([optionId, bucket]) => {
    const robustAverage = trimmedAverage(bucket.adjustedRatings);
    const approvalShare =
      bucket.rawRatings.filter((value) => value >= 4).length / bucket.rawRatings.length;
    const dislikeShare =
      bucket.rawRatings.filter((value) => value <= 2).length / bucket.rawRatings.length;
    const volatility = standardDeviation(bucket.adjustedRatings);
    const ratingCounts = countRatings(bucket.rawRatings);
    const score =
      robustAverage + approvalShare * 0.45 - dislikeShare * 0.6 - volatility * 0.18;

    return {
      optionId,
      movieId: bucket.movieId,
      score: Number(score.toFixed(3)),
      robustAverage: Number(robustAverage.toFixed(3)),
      approvalShare: Number(approvalShare.toFixed(3)),
      dislikeShare: Number(dislikeShare.toFixed(3)),
      volatility: Number(volatility.toFixed(3)),
      voteCount: bucket.rawRatings.length,
      ratingCounts,
      profileLabel: getProfileLabel({
        ratingCounts,
        approvalShare,
        dislikeShare,
        robustAverage,
      }),
    };
  });

  return results.sort((left, right) => right.score - left.score);
}
