import { NextRequest, NextResponse } from "next/server";
import { searchEventbrite } from "@/lib/eventbrite";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "fun things to do";
    const location = searchParams.get("location") || "";
    const continuation = searchParams.get("continuation") || "";
    const pageSize = parseInt(searchParams.get("page_size") || "10", 10);

    const { events, continuation: nextContinuation } = await searchEventbrite({
      query,
      location,
      pageSize,
      continuation,
    });

    return NextResponse.json({ events, continuation: nextContinuation });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { events: [], continuation: null },
      { status: 200 }
    );
  }
}
