import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { events, location, preferences } = await req.json();

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: "No events to optimize" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      "time": "suggested time or actual event time",
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
If some events are on different days, group them by day.`;

    const eventList = events
      .map(
        (e: Record<string, string | boolean | null | Record<string, string>>, i: number) =>
          `${i + 1}. "${e.name}" - ${e.start || "flexible time"} - ${
            e.venue
              ? `at ${(e.venue as Record<string, string>).name || ""}, ${(e.venue as Record<string, string>).address || ""}`
              : "location TBD"
          } - ${e.isFree ? "FREE" : "Paid"} - URL: ${e.url || "N/A"}`
      )
      .join("\n");

    const userMessage = `Here are the events/activities I want to do:

${eventList}

${location ? `I'm starting from: ${location}` : ""}
${preferences ? `My preferences: ${preferences}` : ""}

Please optimize the best route/order for me to attend these.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse route plan" },
        { status: 500 }
      );
    }

    const cleaned = jsonMatch[0].replace(/,\s*([\]}])/g, "$1");
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Route optimizer error:", error);
    return NextResponse.json(
      { error: "Failed to optimize route. Check your Gemini API key." },
      { status: 500 }
    );
  }
}
