import { describe, expect, it } from "vitest";
import { getAiErrorDetails } from "./errors";

describe("getAiErrorDetails", () => {
  it("classifies depleted prepaid credits before RESOURCE_EXHAUSTED", () => {
    const error = Object.assign(
      new Error(
        "Your prepayment credits are depleted. status: RESOURCE_EXHAUSTED"
      ),
      { status: 402 }
    );

    expect(getAiErrorDetails(error, "Fallback")).toEqual({
      code: "AI_BILLING_REQUIRED",
      message: "AI suggestions are temporarily unavailable. Try again later.",
      httpStatus: 503,
      providerStatus: 402,
    });
  });

  it("classifies short-window rate limits as retryable", () => {
    const error = Object.assign(new Error("429 rate_limit_exceeded"), {
      status: 429,
    });

    expect(getAiErrorDetails(error, "Fallback")).toEqual({
      code: "AI_RATE_LIMITED",
      message: "AI is busy right now. Try again in a moment.",
      httpStatus: 429,
      providerStatus: 429,
    });
  });

  it("distinguishes exhausted daily quota from transient throttling", () => {
    const error = Object.assign(new Error("quota_exceeded: daily quota reached"), {
      statusCode: 429,
    });

    expect(getAiErrorDetails(error, "Fallback")).toEqual({
      code: "AI_DAILY_QUOTA_REACHED",
      message: "The daily AI quota has been reached. Try again later.",
      httpStatus: 429,
      providerStatus: 429,
    });
  });
});
