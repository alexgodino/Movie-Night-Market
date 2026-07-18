"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import { Prisma } from "@prisma/client";
import { isValidAdminPasscode, requireAdmin, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adjustBallot } from "@/lib/scoring";
import { getDeviceIdFromCookie, touchDeviceIdentity } from "@/lib/device";
import { getActiveNight, getLastRunnerUpMovie, getNightById, getResultsForNight, getTiedFirstPlaceResults } from "@/lib/queries";

export type FormState = {
  error?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function refreshAll() {
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath("/results");
  revalidatePath("/admin");
  revalidatePath("/admin/create");
  revalidatePath("/admin/history");
}

function getRunnerUpMovieId(
  results: Awaited<ReturnType<typeof getResultsForNight>>,
  winnerMovieId: string,
) {
  return results.find((result) => result.movieId !== winnerMovieId)?.movieId ?? null;
}

function persistResultScores(
  results: Awaited<ReturnType<typeof getResultsForNight>>,
) {
  return results.map((result, index) =>
    prisma.movieNightOption.update({
      where: { id: result.optionId },
      data: {
        marketScore: result.score,
        debugSummary: `Rank ${index + 1} | avg ${result.robustAverage.toFixed(2)} | approval ${(result.approvalShare * 100).toFixed(0)}% | dislike ${(result.dislikeShare * 100).toFixed(0)}%`,
      },
    }),
  );
}

function normalizePosterUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    if (trimmed.startsWith("/")) {
      return trimmed;
    }
  }

  return null;
}

function getPosterUploadDir() {
  return process.env.POSTER_UPLOAD_DIR?.trim() || join(process.cwd(), "public", "uploads");
}

async function savePosterUpload(file: File | null, slug: string) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Poster uploads must be image files.");
  }

  const extensionFromName = extname(file.name).toLowerCase();
  const extensionFromType = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const extension = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extensionFromName)
    ? extensionFromName
    : extensionFromType;
  const fileName = `${slug}${extension}`;
  const uploadDir = getPosterUploadDir();
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  return `/uploads/${fileName}`;
}

export async function loginAdminAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const passcode = String(formData.get("passcode") ?? "");

  if (!isValidAdminPasscode(passcode)) {
    return { error: "That passcode didn't match the local admin code." };
  }

  await setAdminCookie(passcode.trim());
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminCookie();
  redirect("/");
}

export async function createMovieNightAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const existing = await getActiveNight();
  if (existing) {
    return { error: "Archive the current movie night before creating a new one." };
  }

  const title = String(formData.get("title") ?? "").trim() || "Movie Night";
  const closesAtRaw = String(formData.get("votingEndsAt") ?? "");
  const includeLastRunnerUp = formData.get("includeLastRunnerUp") === "on";
  const lastRunnerUp = includeLastRunnerUp ? await getLastRunnerUpMovie() : null;
  const manualPositions = lastRunnerUp ? [1, 2, 3, 4] : [1, 2, 3, 4, 5];

  const manualMovies = manualPositions.map((position) => {
    const movieTitle = String(formData.get(`movieTitle-${position}`) ?? "").trim();
    const synopsis = String(formData.get(`movieDescription-${position}`) ?? "").trim();
    const posterUrl = normalizePosterUrl(String(formData.get(`moviePosterUrl-${position}`) ?? ""));
    const posterFile = formData.get(`moviePosterFile-${position}`);
    const year = Number(formData.get(`movieYear-${position}`));
    const runtimeMinutes = Number(formData.get(`movieRuntimeMinutes-${position}`));

    return {
      position,
      title: movieTitle,
      synopsis,
      posterUrl,
      posterFile: posterFile instanceof File ? posterFile : null,
      year: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
      runtimeMinutes: Number.isFinite(runtimeMinutes) && runtimeMinutes > 0 ? runtimeMinutes : 0,
    };
  });

  if (includeLastRunnerUp && !lastRunnerUp) {
    return { error: "There is no previous runner-up to include yet." };
  }

  if (manualMovies.some((movie) => !movie.title || !movie.synopsis)) {
    return { error: lastRunnerUp ? "Enter a title and description for the four new movie options." : "Enter a title and description for all five movie options." };
  }

  const invalidPosterUrl = manualPositions.some((position) => {
    const raw = String(formData.get(`moviePosterUrl-${position}`) ?? "").trim();
    return raw && !normalizePosterUrl(raw);
  });

  if (invalidPosterUrl) {
    return { error: "Poster URLs must start with http://, https://, or /." };
  }

  const slugBase = `${slugify(title)}-${new Date().toISOString().slice(0, 10)}`;
  const nightSlug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  let moviesWithPosters: Array<{
    position: number;
    title: string;
    year: number;
    runtimeMinutes: number;
    synopsis: string;
    posterUrl: string | null;
  }>;

  try {
    moviesWithPosters = await Promise.all(
      manualMovies.map(async (movie) => {
        const movieSlug = `${slugify(movie.title) || "movie"}-${nightSlug}-${movie.position}`;
        const uploadedPosterUrl = await savePosterUpload(movie.posterFile, movieSlug);

        return {
          position: movie.position,
          title: movie.title,
          year: movie.year,
          runtimeMinutes: movie.runtimeMinutes,
          synopsis: movie.synopsis,
          posterUrl: uploadedPosterUrl ?? movie.posterUrl,
        };
      }),
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save one of the poster uploads.",
    };
  }

  await prisma.movieNight.create({
    data: {
      title,
      slug: nightSlug,
      status: "VOTING_OPEN",
      openedVotingAt: new Date(),
      votingEndsAt: closesAtRaw ? new Date(closesAtRaw) : null,
      options: {
        create: [
          ...moviesWithPosters.map((movie) => ({
            position: movie.position,
            movie: {
              create: {
                slug: `${slugify(movie.title) || "movie"}-${nightSlug}-${movie.position}`,
                title: movie.title,
                year: movie.year,
                runtimeMinutes: movie.runtimeMinutes,
                genres: "Manual pick",
                synopsis: movie.synopsis,
                posterUrl: movie.posterUrl,
                sourceFilename: "Manual entry",
                sourcePath: "Manual admin entry",
              },
            },
          })),
          ...(lastRunnerUp
            ? [
                {
                  position: 5,
                  debugSummary: "Last night's runner-up",
                  movie: {
                    connect: { id: lastRunnerUp.id },
                  },
                },
              ]
            : []),
        ],
      },
    },
  });

  await refreshAll();
  redirect("/admin");
}

export async function openVotingAction() {
  await requireAdmin();
  const night = await getActiveNight();
  if (!night) {
    return;
  }

  await prisma.movieNight.update({
    where: { id: night.id },
    data: {
      status: "VOTING_OPEN",
      openedVotingAt: new Date(),
    },
  });

  await refreshAll();
}

export async function closeVotingAction() {
  await requireAdmin();
  const night = await getActiveNight();
  if (!night) {
    return;
  }

  await prisma.movieNight.update({
    where: { id: night.id },
    data: {
      status: "VOTING_CLOSED",
      closedVotingAt: new Date(),
    },
  });

  await refreshAll();
}

export async function revealWinnerAction() {
  await requireAdmin();
  const night = await getActiveNight();
  if (!night) {
    return;
  }

  const results = await getResultsForNight(night);
  const tiedFirst = getTiedFirstPlaceResults(results);
  const tieBreakVotes = night.tieBreakVotes.filter(
    (vote) =>
      !vote.fineWithEither &&
      vote.movieNightOptionId &&
      tiedFirst.some((result) => result.optionId === vote.movieNightOptionId),
  );
  const winner =
    tiedFirst.length > 1
      ? tiedFirst
          .map((result) => ({
            result,
            tieBreakVotes: tieBreakVotes.filter(
              (vote) => vote.movieNightOptionId === result.optionId,
            ).length,
          }))
          .sort(
            (left, right) =>
              right.tieBreakVotes - left.tieBreakVotes ||
              left.result.position - right.result.position,
          )[0]?.result
      : results[0];

  if (!winner) {
    return;
  }

  const scoreUpdates = persistResultScores(results);

  if (tiedFirst.length > 1 && night.status !== "TIE_BREAK_OPEN" && tieBreakVotes.length === 0) {
    await prisma.$transaction([
      prisma.movieNight.update({
        where: { id: night.id },
        data: {
          status: "TIE_BREAK_OPEN",
          closedVotingAt: night.closedVotingAt ?? new Date(),
        },
      }),
      ...scoreUpdates,
    ]);

    await refreshAll();
    return;
  }

  await prisma.$transaction([
    prisma.movieNight.update({
      where: { id: night.id },
      data: {
        status: "WINNER_REVEALED",
        winnerMovieId: winner.movieId,
        runnerUpMovieId: getRunnerUpMovieId(results, winner.movieId),
        winnerRevealedAt: new Date(),
      },
    }),
    ...scoreUpdates,
  ]);

  await refreshAll();
}

export async function archiveNightAction() {
  await requireAdmin();
  const night = await getActiveNight();
  if (!night) {
    return;
  }

  await prisma.movieNight.update({
    where: { id: night.id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  await refreshAll();
}

export async function clearArchivedNightHistoryAction() {
  await requireAdmin();

  await prisma.movieNight.deleteMany({
    where: {
      status: "ARCHIVED",
    },
  });

  await refreshAll();
  redirect("/admin/history?cleared=1");
}

export async function deleteArchivedNightAction(formData: FormData) {
  await requireAdmin();

  const nightId = String(formData.get("nightId") ?? "");
  if (!nightId) {
    return;
  }

  await prisma.movieNight.deleteMany({
    where: {
      id: nightId,
      status: "ARCHIVED",
    },
  });

  await refreshAll();
  redirect("/admin/history?deleted=1");
}

export async function submitPreWatchVoteAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const nightId = String(formData.get("nightId") ?? "");
  const deviceId = String(formData.get("deviceId") ?? "") || (await getDeviceIdFromCookie());

  if (!nightId || !deviceId) {
    return { error: "Missing device identity. Refresh the page and try again." };
  }

  const night = await prisma.movieNight.findUnique({
    where: { id: nightId },
    include: {
      options: {
        include: { movie: true },
      },
    },
  });

  if (!night || night.status !== "VOTING_OPEN") {
    return { error: "Voting is not open right now." };
  }

  const device = await touchDeviceIdentity(deviceId);
  if (!device) {
    return { error: "Could not verify your device." };
  }

  const existing = await prisma.preWatchVote.findUnique({
    where: {
      movieNightId_deviceIdentityId: {
        movieNightId: night.id,
        deviceIdentityId: device.id,
      },
    },
  });

  if (existing) {
    redirect("/results");
  }

  const ratings = night.options.map((option) => ({
    optionId: option.id,
    movieId: option.movieId,
    rating: Number(formData.get(`option-${option.id}`)),
    seenBefore: formData.get(`seen-${option.id}`) === "on",
  }));

  if (ratings.some((item) => Number.isNaN(item.rating) || item.rating < 1 || item.rating > 5)) {
    return { error: "Rate all five movies from 1 to 5 before submitting." };
  }

  const adjusted = adjustBallot({
    deviceKey: device.deviceKey,
    ratings,
  });

  try {
    await prisma.preWatchVote.create({
      data: {
        movieNightId: night.id,
        deviceIdentityId: device.id,
        ballotMean: adjusted.mean,
        ballotSpread: adjusted.spread,
        adjustmentFactor: adjusted.adjustmentFactor,
        items: {
          create: ratings.map((item) => ({
            movieNightOptionId: item.optionId,
            rating: item.rating,
            adjustedRating: adjusted.adjustedRatings[item.optionId],
            seenBefore: item.seenBefore,
          })),
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/results");
    }
    throw error;
  }

  await refreshAll();
  redirect("/results?submitted=1");
}

export async function submitTieBreakVoteAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const nightId = String(formData.get("nightId") ?? "");
  const deviceId = String(formData.get("deviceId") ?? "") || (await getDeviceIdFromCookie());
  const tieChoice = String(formData.get("tieChoice") ?? "");

  if (!nightId || !deviceId) {
    return { error: "Missing device identity. Refresh the page and try again." };
  }

  const night = await getNightById(nightId);

  if (!night || night.status !== "TIE_BREAK_OPEN") {
    return { error: "Tie-break voting is not open right now." };
  }

  const device = await touchDeviceIdentity(deviceId);
  if (!device) {
    return { error: "Could not verify your device." };
  }

  const results = await getResultsForNight(night);
  const tiedFirst = getTiedFirstPlaceResults(results);
  const tiedOptionIds = new Set(tiedFirst.map((result) => result.optionId));

  if (!tiedOptionIds.has(tieChoice)) {
    return { error: "Pick one of the tied movies to break the tie." };
  }

  await prisma.tieBreakVote.upsert({
    where: {
      movieNightId_deviceIdentityId: {
        movieNightId: night.id,
        deviceIdentityId: device.id,
      },
    },
    update: {
      movieNightOptionId: tieChoice,
      fineWithEither: false,
    },
    create: {
      movieNightId: night.id,
      deviceIdentityId: device.id,
      movieNightOptionId: tieChoice,
      fineWithEither: false,
    },
  });

  await refreshAll();
  redirect("/results?tiebreak=1");
}
