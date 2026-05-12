-- CreateEnum
CREATE TYPE "MovieNightStatus" AS ENUM ('DRAFT', 'VOTING_OPEN', 'VOTING_CLOSED', 'TIE_BREAK_OPEN', 'WINNER_REVEALED', 'POST_WATCH_OPEN', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runtimeMinutes" INTEGER NOT NULL,
    "genres" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "posterUrl" TEXT,
    "sourceFilename" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieNight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "MovieNightStatus" NOT NULL DEFAULT 'DRAFT',
    "openedVotingAt" TIMESTAMP(3),
    "closedVotingAt" TIMESTAMP(3),
    "winnerRevealedAt" TIMESTAMP(3),
    "postWatchOpenedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "winnerMovieId" TEXT,
    "runnerUpMovieId" TEXT,
    "votingEndsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MovieNight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieNightOption" (
    "id" TEXT NOT NULL,
    "movieNightId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "marketScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debugSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MovieNightOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceIdentity" (
    "id" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreWatchVote" (
    "id" TEXT NOT NULL,
    "movieNightId" TEXT NOT NULL,
    "deviceIdentityId" TEXT NOT NULL,
    "ballotMean" DOUBLE PRECISION NOT NULL,
    "ballotSpread" DOUBLE PRECISION NOT NULL,
    "adjustmentFactor" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreWatchVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreWatchVoteItem" (
    "id" TEXT NOT NULL,
    "preWatchVoteId" TEXT NOT NULL,
    "movieNightOptionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "adjustedRating" DOUBLE PRECISION NOT NULL,
    "seenBefore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreWatchVoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TieBreakVote" (
    "id" TEXT NOT NULL,
    "movieNightId" TEXT NOT NULL,
    "deviceIdentityId" TEXT NOT NULL,
    "movieNightOptionId" TEXT,
    "fineWithEither" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TieBreakVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostWatchRating" (
    "id" TEXT NOT NULL,
    "movieNightId" TEXT NOT NULL,
    "deviceIdentityId" TEXT NOT NULL,
    "ratingValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostWatchRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_slug_key" ON "Movie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MovieNight_slug_key" ON "MovieNight"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MovieNightOption_movieNightId_movieId_key" ON "MovieNightOption"("movieNightId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX "MovieNightOption_movieNightId_position_key" ON "MovieNightOption"("movieNightId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceIdentity_deviceKey_key" ON "DeviceIdentity"("deviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "PreWatchVote_movieNightId_deviceIdentityId_key" ON "PreWatchVote"("movieNightId", "deviceIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "TieBreakVote_movieNightId_deviceIdentityId_key" ON "TieBreakVote"("movieNightId", "deviceIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "PostWatchRating_movieNightId_deviceIdentityId_key" ON "PostWatchRating"("movieNightId", "deviceIdentityId");

-- AddForeignKey
ALTER TABLE "MovieNight" ADD CONSTRAINT "MovieNight_winnerMovieId_fkey" FOREIGN KEY ("winnerMovieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieNight" ADD CONSTRAINT "MovieNight_runnerUpMovieId_fkey" FOREIGN KEY ("runnerUpMovieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieNightOption" ADD CONSTRAINT "MovieNightOption_movieNightId_fkey" FOREIGN KEY ("movieNightId") REFERENCES "MovieNight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieNightOption" ADD CONSTRAINT "MovieNightOption_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreWatchVote" ADD CONSTRAINT "PreWatchVote_movieNightId_fkey" FOREIGN KEY ("movieNightId") REFERENCES "MovieNight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreWatchVote" ADD CONSTRAINT "PreWatchVote_deviceIdentityId_fkey" FOREIGN KEY ("deviceIdentityId") REFERENCES "DeviceIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreWatchVoteItem" ADD CONSTRAINT "PreWatchVoteItem_preWatchVoteId_fkey" FOREIGN KEY ("preWatchVoteId") REFERENCES "PreWatchVote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreWatchVoteItem" ADD CONSTRAINT "PreWatchVoteItem_movieNightOptionId_fkey" FOREIGN KEY ("movieNightOptionId") REFERENCES "MovieNightOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TieBreakVote" ADD CONSTRAINT "TieBreakVote_movieNightId_fkey" FOREIGN KEY ("movieNightId") REFERENCES "MovieNight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TieBreakVote" ADD CONSTRAINT "TieBreakVote_deviceIdentityId_fkey" FOREIGN KEY ("deviceIdentityId") REFERENCES "DeviceIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TieBreakVote" ADD CONSTRAINT "TieBreakVote_movieNightOptionId_fkey" FOREIGN KEY ("movieNightOptionId") REFERENCES "MovieNightOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostWatchRating" ADD CONSTRAINT "PostWatchRating_movieNightId_fkey" FOREIGN KEY ("movieNightId") REFERENCES "MovieNight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostWatchRating" ADD CONSTRAINT "PostWatchRating_deviceIdentityId_fkey" FOREIGN KEY ("deviceIdentityId") REFERENCES "DeviceIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
