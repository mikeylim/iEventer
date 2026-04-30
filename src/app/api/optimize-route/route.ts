import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile, summarizeProfile } from "@/lib/session";
import { parseAiJson } from "@/lib/parseAiJson";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { events, location, preferences } = await req.json();
    const sessionProfile = await getSessionProfile();
    const effectiveLocation = location || sessionProfile?.profile?.location || "";
    const profileNote = sessionProfile
      ? `User profile: ${summarizeProfile(sessionProfile)}`
      : "";

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: "No events to optimize" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are a smart trip/day planner. The user has selected multiple events and activities they want to do.
Your job is to figure out the best ORDER to attend them, considering:
- Event times and dates (don't schedule conflicts)
- Geographic proximity (minimize travel between events)
- User's starting location
- User preferences and priorities
- Logical flow of the day (e.g., don't put a high-energy activity right after a big meal)

Respond in this exact JSON format:
{
  "route": [
    {
      "order": 1,
      "eventName": "Name of event",
      "eventUrl": "URL to event page",
      "time": "Human-readable time like 'Sat Jun 13, 7:00 PM' or 'Saturday evening' — NEVER raw ISO timestamps",
      "travelTip": "how to get there from the previous stop",
      "reason": "why this is placed here in the order"
    }
  ],
  "summary": "A 2-3 sentence overview of the planned day/itinerary",
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "estimatedTotalTime": "total time including travel",
  "estimatedTotalCost": "rough cost estimate"
}

Be practical and specific with travel tips. If events have set times, respect those.
If some events are on different days, group them by day.
ALWAYS write the "time" field in a friendly human-readable format. Never echo back ISO 8601 timestamps.`;

    // Format dates into human-readable strings before sending to Gemini.
    const formatDate = (iso: unknown): string => {
      if (typeof iso !== "string" || !iso) return "flexible time";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    };

    const eventList = events
      .map(
        (e: Record<string, string | boolean | null | Record<string, string>>, i: number) =>
          `${i + 1}. "${e.name}" - ${formatDate(e.start)} - ${
            e.venue
              ? `at ${(e.venue as Record<string, string>).name || ""}, ${(e.venue as Record<string, string>).address || ""}`
              : "location TBD"
          } - ${e.isFree ? "FREE" : "Paid"} - URL: ${e.url || "N/A"}`
      )
      .join("\n");

    const userMessage = `Here are the events/activities I want to do:

${eventList}

${effectiveLocation ? `I'm starting from: ${effectiveLocation}` : ""}
${preferences ? `My preferences: ${preferences}` : ""}
${profileNote}

Please optimize the best route/order for me to attend these.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const text = result.response.text();
    const data = parseAiJson(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Route optimizer error:", error);
    return NextResponse.json(
      { error: friendlyGeminiError(error) },
      { status: 500 }
    );
  }
}

function friendlyGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(msg)) {
    return "AI is busy right now (rate limit). Try again in a moment.";
  }
  if (/UNAUTHENTICATED|401|API key/i.test(msg)) {
    return "Gemini API key is invalid or missing.";
  }
  if (/PERMISSION_DENIED|403/i.test(msg)) {
    return "Gemini API key doesn't have access to this model.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET/i.test(msg)) {
    return "Couldn't reach Gemini. Check your internet connection.";
  }
  return "Failed to optimize route. Try again.";
}
