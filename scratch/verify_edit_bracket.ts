import { prisma } from "../src/lib/db";
import { generateMatchesForTournament } from "../src/lib/tournament/engine";

async function main() {
  console.log("=== Seeding / Bracket Generation Verification ===");

  // Find a tournament with registrations
  const tournament = await prisma.tournament.findFirst({
    include: {
      registrations: {
        where: { status: "APPROVED" },
        include: { user: true }
      }
    }
  });

  if (!tournament) {
    console.log("No tournament found. Please make sure there is at least one tournament in the database.");
    return;
  }

  const registrationsCount = tournament.registrations.length;
  console.log(`Using Tournament: "${tournament.title}" (ID: ${tournament.id})`);
  console.log(`Approved registrations: ${registrationsCount}`);

  if (registrationsCount < 2) {
    console.log("Not enough registered approved players to generate matches (need at least 2).");
    console.log("Please run prisma seed or register players in a tournament.");
    return;
  }

  // Helper to print matches
  const printMatches = async (label: string) => {
    const matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id },
      include: {
        p1: true,
        p2: true
      },
      orderBy: { round: "asc" }
    });
    console.log(`\n--- Matches Generated for ${label} Seeding (Total: ${matches.length}) ---`);
    matches.forEach((m, idx) => {
      console.log(`Match ${idx + 1} (Round ${m.round}, Status: ${m.status}): ${m.p1?.name ?? "TBD"} (${m.p1?.elo ?? 0} ELO) VS ${m.p2?.name ?? "TBD"} (${m.p2?.elo ?? 0} ELO)`);
    });
  };

  // 1. Test ELO Seeding
  console.log("\nDeleting existing matches...");
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });

  console.log("Generating matches with ELO Seeding...");
  await generateMatchesForTournament(tournament.id, "ELO");
  await printMatches("ELO");

  // 2. Test RANDOM Seeding
  console.log("\nDeleting matches to test Random Seeding...");
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });

  console.log("Generating matches with RANDOM Seeding...");
  await generateMatchesForTournament(tournament.id, "RANDOM");
  await printMatches("RANDOM");

  // Cleanup matches to return to original state
  console.log("\nCleaning up verification matches...");
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
  
  // Set status back to DRAFT or original
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: "DRAFT" }
  });

  console.log("\n=== Seeding/Bracket Verification Complete! ===");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
