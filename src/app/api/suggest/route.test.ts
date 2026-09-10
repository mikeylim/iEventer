import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  generateStructuredAi: vi.fn(),
  getSessionProfile: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  generateStructuredAi: mocks.generateStructuredAi,
  friendlyAiError: (error: unknown, fallback: string) =>
    error instanceof Error && /response contract failed/i.test(error.message)
      ? "AI returned an invalid response. Try again."
      : fallback,
}));

vi.mock("@/lib/session", () => ({
  getSessionProfile: mocks.getSessionProfile,
  summarizeProfile: vi.fn(() => ""),
}));

import { POST } from "./route";

const suggestion = {
  title: "Waterfront walk",
  emoji: "🚶",
  description: "Explore the waterfront at an easy pace.",
  steps: ["Choose a trail", "Bring water"],
  details: {
    difficulty: "Easy",
    cost: "Free",
    duration: "90 minutes",
    bestFor: "Friends",
    location: "Toronto waterfront",
  },
  searchKeyword: "Toronto waterfront walk",
};

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionProfile.mockResolvedValue(null);
  });

  it("rejects an empty request before calling Gemini", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Add a prompt or pick at least one option.",
    });
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
    expect(mocks.getSessionProfile).not.toHaveBeenCalled();
  });

  it("rejects an excessive suggestion count before calling Gemini", async () => {
    const response = await POST(request({ prompt: "live music", count: 99 }));

    expect(response.status).toBe(400);
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
  });

  it("rejects an oversized body before loading profile data or calling Gemini", async () => {
    const response = await POST(request({ prompt: "a".repeat(33 * 1024) }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "Request body exceeds the 32 KiB limit.",
    });
    expect(mocks.getSessionProfile).not.toHaveBeenCalled();
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
  });

  it("returns the validated structured response", async () => {
    mocks.generateStructuredAi.mockResolvedValue({
      suggestions: [suggestion, suggestion],
    });

    const response = await POST(request({ prompt: "live music", count: 2 }));

    expect(response.status).toBe(200);
    expect((await response.json()).suggestions).toHaveLength(2);
    expect(mocks.generateStructuredAi).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "suggestions",
        contents: expect.stringContaining('"request":"live music"'),
      })
    );
  });

  it("rejects a response with fewer suggestions than requested", async () => {
    mocks.generateStructuredAi.mockResolvedValue({ suggestions: [suggestion] });

    const response = await POST(request({ prompt: "live music", count: 2 }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "AI returned an invalid response. Try again.",
    });
  });
});
