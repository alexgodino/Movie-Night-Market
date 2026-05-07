import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.preWatchVoteItem.deleteMany();
  await prisma.preWatchVote.deleteMany();
  await prisma.postWatchRating.deleteMany();
  await prisma.movieNightOption.deleteMany();
  await prisma.movieNight.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.deviceIdentity.deleteMany();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
