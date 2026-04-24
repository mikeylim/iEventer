import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile, summarizeProfile } from "@/lib/session";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { prompt, preferences, count, exclude } = await req.json();
    const numSuggestions = count || 4;

    // Enrich with user profile if signed in
    const sessionProfile = await getSessionProfile();
    const profileNote = sessionProfile
      ? `\n\nUser profile: ${summarizeProfile(sessionProfile)}. Weight suggestions toward these interests when relevant, but still vary the ideas.`
      : "";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const excludeNote = exclude && exclude.length > 0
      ? `\n\nIMPORTANT: Do NOT suggest any of these activities (already suggested): ${exclude.join(", ")}. Come up with completely different ideas.`
      : "";

    const systemPrompt = `You are iEventer, a fun and enthusiastic activity recommender.
Given a user's input about what they want to do, their mood, who they're with, and their preferences,
suggest exactly ${numSuggestions} creative and detailed activity ideas.${excludeNote}${profileNote}

For EACH suggestion, respond in this exact JSON format:
{
  "suggestions": [
    {
      "title": "Activity Name",
      "emoji": "relevant emoji",
      "description": "2-3 sentence engaging description",
      "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
      "details": {
        "difficulty": "Easy/Medium/Hard",
        "cost": "Free/$/$$/$$$ with brief explanation",
        "duration": "estimated time",
        "bestFor": "who this is ideal for",
        "location": "where to do this (be specific with types of venues or areas)"
      },
      "searchKeyword": "keyword to search for related events on Eventbrite"
    }
  ]
}

Be creative, practical, and inclusive. Mix free and paid options. Include both indoor and outdoor ideas.
If the user mentions a location, tailor suggestions to that area.
Always include at least one free option.
Make the steps actionable and specific — tell them HOW to do it, not just what to do.`;

    const userMessage = prompt
      ? `User says: "${prompt}"`
      : `User preferences: ${JSON.stringify(preferences)}`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const text = result.response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Clean up common Gemini JSON issues: trailing commas before ] or }
    const cleaned = jsonMatch[0]
      .replace(/,\s*([\]}])/g, "$1");

    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions. Check your Gemini API key." },
      { status: 500 }
    );
  }
}
