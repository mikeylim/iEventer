import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  parseStructuredAiResponse,
  toGeminiJsonSchema,
} from "@/lib/ai/contracts";

export type AiFeature = "suggestions" | "routeOptimization" | "dailyPick";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export const AI_MODELS: Record<AiFeature, string> = {
  suggestions:
    process.env.GEMINI_SUGGESTIONS_MODEL ||
    process.env.GEMINI_MODEL ||
    DEFAULT_MODEL,
  routeOptimization:
    process.env.GEMINI_ROUTE_MODEL || process.env.GEMINI_MODEL || DEFAULT_MODEL,
  dailyPick:
    process.env.GEMINI_DAILY_PICK_MODEL ||
    process.env.GEMINI_MODEL ||
    DEFAULT_MODEL,
};

export const AI_PROMPT_VERSIONS: Record<AiFeature, string> = {
  suggestions: "suggestions-v2",
  routeOptimization: "route-v2",
  dailyPick: "daily-pick-v2",
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  client ??= new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 15_000,
      retryOptions: {
        attempts: 2,
        initialDelay: 0.5,
        maxDelay: 2,
        expBase: 2,
        jitter: 0.2,
        httpStatusCodes: [408, 429, 500, 502, 503, 504],
      },
    },
  });

  return client;
}

export async function generateStructuredAi<T>({
  feature,
  systemInstruction,
  contents,
  schema,
  maxOutputTokens,
}: {
  feature: AiFeature;
  systemInstruction: string;
  contents: string;
  schema: z.ZodType<T>;
  maxOutputTokens: number;
}): Promise<T> {
  const startedAt = Date.now();
  const model = AI_MODELS[feature];
  const promptVersion = AI_PROMPT_VERSIONS[feature];

  try {
    const response = await getClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiJsonSchema(schema),
        maxOutputTokens,
      },
    });

    if (!response.text) {
      throw new Error("AI response did not contain text");
    }

    const data = parseStructuredAiResponse(response.text, schema);
    const usage = response.usageMetadata;
    console.info("AI generation completed", {
      feature,
      model: response.modelVersion || model,
      promptVersion,
      durationMs: Date.now() - startedAt,
      promptTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
      totalTokens: usage?.totalTokenCount,
    });
    return data;
  } catch (error) {
    console.error("AI generation failed", {
      feature,
      model,
      promptVersion,
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  }
}

export function friendlyAiError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/RESOURCE_EXHAUSTED|429|quota/i.test(message)) {
    return "AI is busy right now (rate limit). Try again in a moment.";
  }
  if (/UNAUTHENTICATED|401|API key|GEMINI_API_KEY/i.test(message)) {
    return "Gemini API key is invalid or missing.";
  }
  if (/PERMISSION_DENIED|403/i.test(message)) {
    return "Gemini API key doesn't have access to this model.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET|timeout/i.test(message)) {
    return "Couldn't reach Gemini. Try again in a moment.";
  }
  if (error instanceof z.ZodError || /response contract failed/i.test(message)) {
    return "AI returned an invalid response. Try again.";
  }
  return fallback;
}
