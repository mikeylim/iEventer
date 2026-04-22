import { db } from "./client";
import { interests } from "./schema";
import { INTEREST_SEEDS } from "@/lib/interests";

async function seed() {
  console.log("Seeding interests...");
  await db
    .insert(interests)
    .values(INTEREST_SEEDS.map((i) => ({ ...i })))
    .onConflictDoNothing();
  console.log(`Seeded ${INTEREST_SEEDS.length} interests.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
