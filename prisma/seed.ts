import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding demo user...");

  const passwordHash = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@hogar.dev" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@hogar.dev",
      passwordHash,
    },
  });

  console.log(`  User: ${user.email} (${user.id})`);

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      name: "Apartamento Demo",
      description: "Apartment floor plan from Dunna Santuario Nunciatura — Apartamento 07, Tipo B",
      userId: user.id,
    },
  });

  console.log(`  Project: ${project.name} (${project.id})`);
  console.log("");
  console.log("Demo credentials:");
  console.log("  Email: demo@hogar.dev");
  console.log("  Password: demo123");
  console.log("");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
