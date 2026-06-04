import { db } from "./client";
import { interests, userInterests } from "./schema";
import { INTEREST_SEEDS } from "@/lib/interests";

async function seed() {
  // Clear existing interests + their user-link rows so the new top-level
  // umbrellas replace the legacy 45-tag set. user_interest must go first
  // because of the FK to interest.
  console.log("Clearing existing user_interests...");
  await db.delete(userInterests);
  console.log("Clearing existing interests...");
  await db.delete(interests);

  console.log("Seeding interests...");
  await db.insert(interests).values(INTEREST_SEEDS.map((i) => ({ ...i })));
  console.log(`Seeded ${INTEREST_SEEDS.length} interests.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
