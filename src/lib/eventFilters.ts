// Pure functions for filtering events. Designed for testability —
// `filterByWhen` accepts an injected `now` so unit tests can pin time.

export type FilterableEvent = {
  start: string;
  isFree: boolean;
  category: string;
};

export const WHEN_FILTERS = [
  { value: "all", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_weekend", label: "Weekend" },
  { value: "this_week", label: "This Week" },
] as const;

export const PRICE_FILTERS = [
  { value: "all", label: "Any Price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

export type WhenFilter = (typeof WHEN_FILTERS)[number]["value"];
export type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function filterByWhen<T extends FilterableEvent>(
  events: T[],
  when: WhenFilter,
  now: Date = new Date()
): T[] {
  if (when === "all") return events;

  const todayStr = toIsoDate(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toIsoDate(tomorrow);

  const dayOfWeek = now.getDay(); // 0 = Sunday … 6 = Saturday
  const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysToSat));
  const satStr = toIsoDate(saturday);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const sunStr = toIsoDate(sunday);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - dayOfWeek));
  const endOfWeekStr = toIsoDate(endOfWeek);

  return events.filter((e) => {
    if (!e.start) return false;
    const eventDate = e.start.split("T")[0];
    switch (when) {
      case "today":
        return eventDate === todayStr;
      case "tomorrow":
        return eventDate === tomorrowStr;
      case "this_weekend":
        return eventDate === satStr || eventDate === sunStr;
      case "this_week":
        return eventDate >= todayStr && eventDate <= endOfWeekStr;
      default:
        return true;
    }
  });
}

export function filterByPrice<T extends FilterableEvent>(
  events: T[],
  price: PriceFilter
): T[] {
  if (price === "all") return events;
  if (price === "free") return events.filter((e) => e.isFree);
  return events.filter((e) => !e.isFree);
}

export function filterByCategory<T extends FilterableEvent>(
  events: T[],
  category: string
): T[] {
  if (!category) return events;
  return events.filter((e) => e.category === category);
}
