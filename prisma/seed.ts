import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/champsarena";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@champsarena.gg";
  const adminPassword = "Admin@1234";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    // Ensure role is SUPER_ADMIN
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "SUPER_ADMIN" },
    });
    console.log("✅ Admin user already exists — ensured SUPER_ADMIN role.");
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      name: "Chief Arbiter",
      email: adminEmail,
      password: hashed,
      role: "SUPER_ADMIN",
      elo: 9999,
      homeRegion: "Indigo Plateau",
      favPokemon: "Mewtwo",
    },
  });
  console.log("✅ Admin user created!");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
