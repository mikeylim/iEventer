import { z } from "zod";
import { parseAiJson } from "@/lib/parseAiJson";

export const MAX_SUGGESTIONS = 6;
export const MAX_PLAN_EVENTS = 10;

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must use HTTP or HTTPS");

const preferenceListSchema = z.array(nonEmptyText(60)).max(8);

export const discoveryPreferencesSchema = z
  .object({
    mood: preferenceListSchema.optional(),
    company: preferenceListSchema.optional(),
    budget: preferenceListSchema.optional(),
    setting: preferenceListSchema.optional(),
    timing: preferenceListSchema.optional(),
    location: nonEmptyText(200).optional(),
    date: z.string().date().optional(),
  })
  .strict();

export const suggestionRequestSchema = z
  .object({
    prompt: nonEmptyText(600).optional(),
    preferences: discoveryPreferencesSchema.optional(),
    count: z.number().int().min(1).max(MAX_SUGGESTIONS).default(4),
    exclude: z.array(nonEmptyText(120)).max(20).default([]),
  })
  .strict()
  .refine(
    ({ prompt, preferences }) => {
      if (prompt) return true;
      if (!preferences) return false;
      return Object.values(preferences).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      );
    },
    { message: "Add a prompt or pick at least one option." }
  );

export const suggestionSchema = z
  .object({
    title: nonEmptyText(120),
    emoji: nonEmptyText(16),
    description: nonEmptyText(800),
    steps: z.array(nonEmptyText(300)).min(1).max(8),
    details: z
      .object({
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        cost: nonEmptyText(120),
        duration: nonEmptyText(120),
        bestFor: nonEmptyText(200),
        location: nonEmptyText(300),
      })
      .strict(),
    searchKeyword: nonEmptyText(120),
  })
  .strict();

export const suggestionResponseSchema = z
  .object({
    suggestions: z.array(suggestionSchema).min(1).max(MAX_SUGGESTIONS),
  })
  .strict();

const venueSchema = z
  .object({
    name: z.string().trim().max(200),
    city: z.string().trim().max(120),
    address: z.string().trim().max(300),
  })
  .strict();

export const routeEventSchema = z
  .object({
    id: nonEmptyText(200),
    name: nonEmptyText(200),
    description: z.string().trim().max(1_500).default(""),
    url: httpUrlSchema,
    start: z.string().trim().max(100).default(""),
    category: z.string().trim().max(120).default(""),
    venue: venueSchema.nullable().default(null),
    isFree: z.boolean().default(false),
    logo: httpUrlSchema.nullable().default(null),
    planEventId: nonEmptyText(200).optional(),
  })
  .strict();

export const optimizeRouteRequestSchema = z
  .object({
    events: z.array(routeEventSchema).min(2).max(MAX_PLAN_EVENTS),
    location: z.string().trim().max(200).default(""),
    preferences: z.string().trim().max(600).optional(),
  })
  .strict();

export const routePlanSchema = z
  .object({
    route: z
      .array(
        z
          .object({
            order: z.number().int().min(1).max(MAX_PLAN_EVENTS),
            eventName: nonEmptyText(200),
            eventUrl: httpUrlSchema,
            time: nonEmptyText(120),
            travelTip: nonEmptyText(500),
            reason: nonEmptyText(500),
          })
          .strict()
      )
      .min(2)
      .max(MAX_PLAN_EVENTS),
    summary: nonEmptyText(1_000),
    tips: z.array(nonEmptyText(300)).max(6),
    estimatedTotalTime: nonEmptyText(120),
    estimatedTotalCost: nonEmptyText(120),
  })
  .strict();

export const dailyPickSelectionSchema = z
  .object({
    pickedIndex: z.number().int().min(0).max(7),
    reason: nonEmptyText(500),
  })
  .strict();

export type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;
export type OptimizeRouteRequest = z.infer<typeof optimizeRouteRequestSchema>;
export type RoutePlan = z.infer<typeof routePlanSchema>;
export type DailyPickSelection = z.infer<typeof dailyPickSelectionSchema>;

export function parseStructuredAiResponse<T>(
  raw: string,
  schema: z.ZodType<T>
): T {
  return schema.parse(parseAiJson<unknown>(raw));
}

export function toGeminiJsonSchema(schema: z.ZodType): unknown {
  return removeUnsupportedJsonSchemaFields(z.toJSONSchema(schema));
}

function removeUnsupportedJsonSchemaFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUnsupportedJsonSchemaFields);
  }
  if (!value || typeof value !== "object") return value;

  const unsupported = new Set([
    "$schema",
    "default",
    "minLength",
    "maxLength",
    "pattern",
  ]);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsupported.has(key))
      .map(([key, child]) => [key, removeUnsupportedJsonSchemaFields(child)])
  );
}

export function getValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}

export function assertSuggestionCount(
  response: SuggestionResponse,
  expected: number
): void {
  if (response.suggestions.length !== expected) {
    throw new Error(
      `AI response contract failed: expected ${expected} suggestions, received ${response.suggestions.length}.`
    );
  }
}

export function assertRouteMatchesEvents(
  routePlan: RoutePlan,
  events: OptimizeRouteRequest["events"]
): void {
  if (routePlan.route.length !== events.length) {
    throw new Error(
      `AI response contract failed: expected ${events.length} route stops, received ${routePlan.route.length}.`
    );
  }

  const expectedEvents = new Map(events.map((event) => [event.url, event.name]));
  const routeUrls = routePlan.route.map((stop) => stop.eventUrl);
  if (
    new Set(routeUrls).size !== routeUrls.length ||
    routeUrls.some((url) => !expectedEvents.has(url))
  ) {
    throw new Error("AI response contract failed: route contains unknown or duplicate events.");
  }

  if (
    routePlan.route.some(
      (stop) => expectedEvents.get(stop.eventUrl) !== stop.eventName
    )
  ) {
    throw new Error("AI response contract failed: route changed an event name.");
  }

  if (routePlan.route.some((stop, index) => stop.order !== index + 1)) {
    throw new Error("AI response contract failed: route order is not sequential.");
  }
}
