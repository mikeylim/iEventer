const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function pickInterestForDate(
  interestSlugs: string[],
  date: string
): string | null {
  if (interestSlugs.length === 0) return null;

  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? Date.parse(`${date}T00:00:00Z`)
    : Number.NaN;
  if (
    Number.isNaN(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Daily Pick date must use YYYY-MM-DD format.");
  }

  const utcDayIndex = Math.floor(timestamp / MILLISECONDS_PER_DAY);
  return interestSlugs[utcDayIndex % interestSlugs.length];
}
