// Seed data for the interests table.
// Run via `npm run db:seed`.

export const INTEREST_SEEDS = [
  // Tech
  { slug: "tech-meetups", name: "Tech Meetups", emoji: "💻", category: "tech" },
  { slug: "hackathons", name: "Hackathons", emoji: "🏆", category: "tech" },
  { slug: "ai-ml", name: "AI & Machine Learning", emoji: "🤖", category: "tech" },
  { slug: "web3", name: "Web3 & Crypto", emoji: "⛓️", category: "tech" },
  { slug: "indie-hacking", name: "Startups & Indie Hacking", emoji: "🚀", category: "tech" },

  // Fitness
  { slug: "running", name: "Running & Marathons", emoji: "🏃", category: "fitness" },
  { slug: "yoga", name: "Yoga & Pilates", emoji: "🧘", category: "fitness" },
  { slug: "climbing", name: "Climbing & Bouldering", emoji: "🧗", category: "fitness" },
  { slug: "cycling", name: "Cycling", emoji: "🚴", category: "fitness" },
  { slug: "team-sports", name: "Team Sports", emoji: "⚽", category: "fitness" },

  // Creative
  { slug: "art-classes", name: "Art Classes", emoji: "🎨", category: "creative" },
  { slug: "pottery", name: "Pottery & Ceramics", emoji: "🏺", category: "creative" },
  { slug: "photography", name: "Photography", emoji: "📷", category: "creative" },
  { slug: "writing", name: "Writing & Poetry", emoji: "✍️", category: "creative" },

  // Food & Drink
  { slug: "food-tastings", name: "Food Tastings", emoji: "🍽️", category: "food" },
  { slug: "cooking-classes", name: "Cooking Classes", emoji: "👨‍🍳", category: "food" },
  { slug: "wine-beer", name: "Wine & Beer", emoji: "🍷", category: "food" },
  { slug: "coffee", name: "Coffee Culture", emoji: "☕", category: "food" },

  // Music
  { slug: "live-music", name: "Live Music", emoji: "🎵", category: "music" },
  { slug: "electronic", name: "Electronic / EDM", emoji: "🎧", category: "music" },
  { slug: "jazz-classical", name: "Jazz & Classical", emoji: "🎷", category: "music" },
  { slug: "open-mic", name: "Open Mic", emoji: "🎤", category: "music" },

  // Outdoors
  { slug: "hiking", name: "Hiking", emoji: "🥾", category: "outdoors" },
  { slug: "camping", name: "Camping", emoji: "⛺", category: "outdoors" },
  { slug: "kayaking", name: "Kayaking & Paddleboarding", emoji: "🛶", category: "outdoors" },
  { slug: "gardening", name: "Gardening", emoji: "🌱", category: "outdoors" },

  // Learning
  { slug: "lectures", name: "Talks & Lectures", emoji: "🎓", category: "learning" },
  { slug: "languages", name: "Language Exchange", emoji: "🗣️", category: "learning" },
  { slug: "book-clubs", name: "Book Clubs", emoji: "📚", category: "learning" },
  { slug: "museums", name: "Museums", emoji: "🏛️", category: "learning" },

  // Social
  { slug: "board-games", name: "Board Games", emoji: "🎲", category: "social" },
  { slug: "trivia", name: "Trivia & Pub Quiz", emoji: "❓", category: "social" },
  { slug: "networking", name: "Networking", emoji: "🤝", category: "social" },
  { slug: "singles-events", name: "Singles Events", emoji: "💘", category: "social" },

  // Wellness
  { slug: "meditation", name: "Meditation", emoji: "🕉️", category: "wellness" },
  { slug: "sound-baths", name: "Sound Baths", emoji: "🔔", category: "wellness" },
  { slug: "breathwork", name: "Breathwork", emoji: "🌬️", category: "wellness" },

  // Nightlife
  { slug: "clubs", name: "Clubs & Dancing", emoji: "🪩", category: "nightlife" },
  { slug: "bars", name: "Bar Hopping", emoji: "🍸", category: "nightlife" },
  { slug: "comedy", name: "Comedy Shows", emoji: "🎭", category: "nightlife" },

  // Family
  { slug: "kids-activities", name: "Kids Activities", emoji: "🧸", category: "family" },
  { slug: "family-outings", name: "Family Outings", emoji: "👨‍👩‍👧", category: "family" },

  // Culture
  { slug: "theatre", name: "Theatre", emoji: "🎬", category: "culture" },
  { slug: "film-festivals", name: "Film Festivals", emoji: "🎞️", category: "culture" },
  { slug: "gallery-openings", name: "Gallery Openings", emoji: "🖼️", category: "culture" },
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
  culture: "🎭 Culture",
};
