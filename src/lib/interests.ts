// 10 top-level umbrella interests. Re-seed via `npm run db:seed`.
// Reduced from 45 nested sub-interests to one flat list of broad categories
// so onboarding stays under 30 seconds.

export const INTEREST_SEEDS = [
  { slug: "tech", name: "Tech", emoji: "💻", category: "tech" },
  { slug: "fitness", name: "Fitness & Sports", emoji: "🏃", category: "fitness" },
  { slug: "creative", name: "Creative", emoji: "🎨", category: "creative" },
  { slug: "food", name: "Food & Drink", emoji: "🍽️", category: "food" },
  { slug: "music", name: "Music", emoji: "🎵", category: "music" },
  { slug: "outdoors", name: "Outdoors", emoji: "🌲", category: "outdoors" },
  { slug: "learning", name: "Learning", emoji: "🎓", category: "learning" },
  { slug: "social", name: "Social", emoji: "🤝", category: "social" },
  { slug: "wellness", name: "Wellness", emoji: "🧘", category: "wellness" },
  { slug: "culture", name: "Arts & Culture", emoji: "🎭", category: "culture" },
] as const;

export type InterestCategory =
  | "tech"
  | "fitness"
  | "creative"
  | "food"
  | "music"
  | "outdoors"
  | "learning"
  | "social"
  | "wellness"
  | "nightlife"
  | "family"
  | "culture";

// Kept for back-compat with any code that still imports it.
export const CATEGORY_LABELS: Record<InterestCategory, string> = {
  tech: "💻 Tech",
  fitness: "🏃 Fitness & Sports",
  creative: "🎨 Creative",
  food: "🍽️ Food & Drink",
  music: "🎵 Music",
  outdoors: "🌲 Outdoors",
  learning: "🎓 Learning",
  social: "🤝 Social",
  wellness: "🧘 Wellness",
  nightlife: "🌙 Nightlife",
  family: "👨‍👩‍👧 Family",
  culture: "🎭 Arts & Culture",
};
