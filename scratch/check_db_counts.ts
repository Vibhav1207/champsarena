import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/champsarena";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.count();
  const tournaments = await prisma.tournament.count();
  const matches = await prisma.match.count();
  const registrations = await prisma.registration.count();

  console.log("Counts in DB:");
  console.log("Users (Trainers):", users);
  console.log("Tournaments:", tournaments);
  console.log("Matches:", matches);
  console.log("Registrations:", registrations);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
