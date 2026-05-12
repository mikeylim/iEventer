/**
 * Render an ISO/parseable date as a friendly local string.
 *
 * - Empty input → empty string
 * - Unparseable input → returned as-is (so human-readable strings from AI
 *   like "Sat Jun 13, 7:00 PM" pass through unchanged)
 * - Valid date → "Sat, Jun 13, 7:00 PM"
 */
export function formatEventDate(input: string | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
