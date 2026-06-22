import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== Creating Test Tournament and Registrations ===");

  // 1. Create/find mock users
  const playersData = [
    { name: "Cynthia", email: "cynthia@champsarena.gg", elo: 1900, favPokemon: "Garchomp" },
    { name: "Lance", email: "lance@champsarena.gg", elo: 1800, favPokemon: "Dragonite" },
    { name: "Blue", email: "blue@champsarena.gg", elo: 1600, favPokemon: "Blastoise" },
    { name: "Gary", email: "gary@champsarena.gg", elo: 1450, favPokemon: "Arcanine" },
    { name: "Red", email: "red@champsarena.gg", elo: 1500, favPokemon: "Charizard" },
    { name: "Ash", email: "ash@champsarena.gg", elo: 1200, favPokemon: "Pikachu" },
  ];

  const users = [];
  for (const p of playersData) {
    let user = await prisma.user.findUnique({ where: { email: p.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: p.name,
          email: p.email,
          elo: p.elo,
          favPokemon: p.favPokemon,
          password: "mockpassword",
          role: "USER"
        }
      });
      console.log(`Created mock user: ${p.name} (${p.elo} ELO)`);
    } else {
      // Update ELO
      user = await prisma.user.update({
        where: { email: p.email },
        data: { elo: p.elo, favPokemon: p.favPokemon }
      });
      console.log(`Found existing user: ${p.name} (${p.elo} ELO)`);
    }
    users.push(user);
  }

  // 2. Create test tournament
  let tournament = await prisma.tournament.findFirst({
    where: { title: "Indigo Plateau Cup" }
  });

  if (!tournament) {
    tournament = await prisma.tournament.create({
      data: {
        title: "Indigo Plateau Cup",
        description: "The ultimate showdown of mock trainers.",
        rules: "Standard VGC rules apply.",
        entryFee: 0,
        prizePool: 1000,
        maxPlayers: 8,
        type: "SINGLE_ELIMINATION",
        status: "DRAFT",
        registrationDeadline: new Date(Date.now() + 10 * 86400000),
        startDate: new Date(Date.now() + 12 * 86400000),
        endDate: new Date(Date.now() + 15 * 86400000)
      }
    });
    console.log(`Created tournament: ${tournament.title}`);
  } else {
    // Reset status and capacity
    tournament = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: "DRAFT", maxPlayers: 8 }
    });
    console.log(`Found existing tournament: ${tournament.title}, reset to DRAFT status.`);
  }

  // 3. Register mock users
  await prisma.registration.deleteMany({ where: { tournamentId: tournament.id } });
  
  for (const u of users) {
    await prisma.registration.create({
      data: {
        userId: u.id,
        tournamentId: tournament.id,
        status: "APPROVED"
      }
    });
    console.log(`Registered and approved player: ${u.name}`);
  }

  console.log("=== Test Tournament and Players Ready! ===");
}

main()
  .catch((err) => {
    console.error("Test seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
