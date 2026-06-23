import { prisma } from "../src/lib/db";

async function main() {
  console.log("Resetting ELO and Win/Loss stats for all users in the database...");
  const result = await prisma.user.updateMany({
    data: {
      elo: 1000,
      wins: 0,
      losses: 0,
    },
  });
  console.log(`Success! Reset ELO, wins, and losses for ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error("Error running ELO reset script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
