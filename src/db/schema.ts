import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── NextAuth Tables ────────────────────────────────────────
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    {
      compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    },
  ]
);

// ─── App Tables ─────────────────────────────────────────────

// Interest categories — seeded once, referenced by users
export const interestCategoryEnum = pgEnum("interest_category", [
  "tech",
  "fitness",
  "creative",
  "food",
  "music",
  "outdoors",
  "learning",
  "social",
  "wellness",
  "nightlife",
  "family",
  "culture",
]);

export const interests = pgTable("interest", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(), // e.g. "tech-meetups"
  name: text("name").notNull(), // e.g. "Tech Meetups"
  emoji: text("emoji").notNull(),
  category: interestCategoryEnum("category").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User profile extends the base user table
export const profiles = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  location: text("location"), // "Toronto, ON, Canada"
  latitude: text("latitude"),
  longitude: text("longitude"),
  defaultRadiusKm: integer("defaultRadiusKm").default(25).notNull(),
  onboardedAt: timestamp("onboardedAt"), // null until they finish onboarding
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Many-to-many: users ↔ interests
export const userInterests = pgTable(
  "user_interest",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interestId: uuid("interestId")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (ui) => [
    {
      compoundKey: primaryKey({ columns: [ui.userId, ui.interestId] }),
    },
  ]
);

// Saved plans (renamed from "plan" in client state — persisted now)
export const plans = pgTable("plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  shareSlug: text("shareSlug").unique(), // null until user shares
  isPublic: boolean("isPublic").default(false).notNull(),
  optimizedRoute: jsonb("optimizedRoute"), // cached Gemini output
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const planEvents = pgTable("plan_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("planId")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  // Event data from external sources (Eventbrite, Lu.ma, Ticketmaster)
  sourceProvider: text("sourceProvider").notNull(), // "eventbrite" | "luma" | "ticketmaster"
  sourceId: text("sourceId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  startAt: timestamp("startAt"),
  venueName: text("venueName"),
  venueAddress: text("venueAddress"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  category: text("category"),
  isFree: boolean("isFree").default(false).notNull(),
  imageUrl: text("imageUrl"),
  orderIdx: integer("orderIdx").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Journal — "did you go?" entries
export const journalEntries = pgTable("journal_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planEventId: uuid("planEventId").references(() => planEvents.id, {
    onDelete: "set null",
  }),
  attended: boolean("attended").notNull(),
  rating: integer("rating"), // 1-5
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Daily surprise picks — one per user per day
export const dailyPicks = pgTable(
  "daily_pick",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pickDate: text("pickDate").notNull(), // YYYY-MM-DD
    sourceProvider: text("sourceProvider").notNull(),
    sourceId: text("sourceId").notNull(),
    eventSnapshot: jsonb("eventSnapshot").notNull(), // full event data
    reason: text("reason").notNull(), // why AI picked it
    seenAt: timestamp("seenAt"),
    dismissedAt: timestamp("dismissedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("daily_pick_user_date_uniq").on(t.userId, t.pickDate),
  ]
);
