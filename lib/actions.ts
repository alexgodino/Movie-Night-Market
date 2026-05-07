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
import { getActiveNight, getResultsForNight } from "@/lib/queries";

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
  revalidatePath("/rate");
  revalidatePath("/admin");
  revalidatePath("/admin/create");
  revalidatePath("/admin/history");
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

  const manualMovies = [1, 2, 3, 4, 5].map((position) => {
    const movieTitle = String(formData.get(`movieTitle-${position}`) ?? "").trim();
    const synopsis = String(formData.get(`movieDescription-${position}`) ?? "").trim();
    const posterUrl = normalizePosterUrl(String(formData.get(`moviePosterUrl-${position}`) ?? ""));
    const posterFile = formData.get(`moviePosterFile-${position}`);

    return {
      position,
      title: movieTitle,
      synopsis,
      posterUrl,
      posterFile: posterFile instanceof File ? posterFile : null,
    };
  });

  if (manualMovies.some((movie) => !movie.title || !movie.synopsis)) {
    return { error: "Enter a title and description for all five movie options." };
  }

  const invalidPosterUrl = [1, 2, 3, 4, 5].some((position) => {
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
      status: "DRAFT",
      votingEndsAt: closesAtRaw ? new Date(closesAtRaw) : null,
      options: {
        create: moviesWithPosters.map((movie) => ({
          position: movie.position,
          movie: {
            create: {
              slug: `${slugify(movie.title) || "movie"}-${nightSlug}-${movie.position}`,
              title: movie.title,
              year: new Date().getFullYear(),
              runtimeMinutes: 0,
              genres: "Manual pick",
              synopsis: movie.synopsis,
              posterUrl: movie.posterUrl,
              sourceFilename: "Manual entry",
              sourcePath: "Manual admin entry",
            },
          },
        })),
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
  const winner = results[0];

  if (!winner) {
    return;
  }

  await prisma.$transaction([
    prisma.movieNight.update({
      where: { id: night.id },
      data: {
        status: "WINNER_REVEALED",
        winnerMovieId: winner.movieId,
        winnerRevealedAt: new Date(),
      },
    }),
    ...results.map((result, index) =>
      prisma.movieNightOption.update({
        where: { id: result.optionId },
        data: {
          marketScore: result.score,
          debugSummary: `Rank ${index + 1} | avg ${result.robustAverage.toFixed(2)} | approval ${(result.approvalShare * 100).toFixed(0)}% | dislike ${(result.dislikeShare * 100).toFixed(0)}%`,
        },
      }),
    ),
  ]);

  await refreshAll();
}

export async function openPostWatchRatingsAction() {
  await requireAdmin();
  const night = await getActiveNight();
  if (!night?.winnerMovieId) {
    return;
  }

  await prisma.movieNight.update({
    where: { id: night.id },
    data: {
      status: "POST_WATCH_OPEN",
      postWatchOpenedAt: new Date(),
    },
  });

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

export async function submitPostWatchRatingAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const nightId = String(formData.get("nightId") ?? "");
  const deviceId = String(formData.get("deviceId") ?? "") || (await getDeviceIdFromCookie());
  const ratingValue = Number(formData.get("ratingValue"));

  if (!nightId || !deviceId) {
    return { error: "Missing device identity. Refresh and try again." };
  }

  if (!Number.isFinite(ratingValue) || ratingValue < 0.5 || ratingValue > 5) {
    return { error: "Pick a rating from 0.5 to 5 stars." };
  }

  const night = await prisma.movieNight.findUnique({
    where: { id: nightId },
  });

  // Allow rating for the active post-watch window OR recently archived nights
  const rateableStatuses = ["POST_WATCH_OPEN", "ARCHIVED"];
  if (!night || !rateableStatuses.includes(night.status) || !night.winnerMovieId) {
    return { error: "Post-watch ratings are not open yet." };
  }

  const device = await touchDeviceIdentity(deviceId);
  if (!device) {
    return { error: "Could not verify your device." };
  }

  await prisma.postWatchRating.upsert({
    where: {
      movieNightId_deviceIdentityId: {
        movieNightId: night.id,
        deviceIdentityId: device.id,
      },
    },
    update: {
      ratingValue,
    },
    create: {
      movieNightId: night.id,
      deviceIdentityId: device.id,
      ratingValue,
    },
  });

  await refreshAll();
  // For archived nights (rated from the home page inter-night flow), go back home
  if (night.status === "ARCHIVED") {
    redirect("/?prevRated=1");
  }
  redirect("/rate?submitted=1");
}
