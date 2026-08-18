import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import * as dotenv from "dotenv";

// Load .env file from root
dotenv.config({ path: "../../.env" });

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting test user passwords...\n");

  const testPassword = await hash("Test@1234", 10);

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "admin@aratc.edu.ph",
          "content@aratc.edu.ph",
          "school@aratc.edu.ph",
          "teacher@aratc.edu.ph",
          "student@aratc.edu.ph",
          "parent@aratc.edu.ph",
        ],
      },
    },
  });

  console.log(`Found ${users.length} test users\n`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: testPassword },
    });
    console.log(`✓ Reset password for: ${user.email}`);
  }

  console.log("\n===========================================");
  console.log("  All passwords reset to: Test@1234");
  console.log("===========================================\n");

  // Also verify the hashes match
  const testUser = await prisma.user.findUnique({
    where: { email: "admin@aratc.edu.ph" },
  });

  if (testUser) {
    const isMatch = await compare("Test@1234", testUser.passwordHash);
    console.log(`Verification: Password for admin@aratc.edu.ph ${isMatch ? "✓ MATCHES" : "✗ DOES NOT MATCH"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
