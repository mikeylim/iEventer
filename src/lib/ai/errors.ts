import { z } from "zod";

export type AiErrorCode =
  | "AI_BILLING_REQUIRED"
  | "AI_RATE_LIMITED"
  | "AI_DAILY_QUOTA_REACHED"
  | "AI_CONFIGURATION_ERROR"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_RESPONSE"
  | "AI_GENERATION_FAILED";

export type AiErrorDetails = {
  code: AiErrorCode;
  message: string;
  httpStatus: number;
  providerStatus: number | null;
};

type ErrorWithStatus = {
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

export function getAiErrorDetails(
  error: unknown,
  fallback: string
): AiErrorDetails {
  const providerStatus = getProviderStatus(error);
  const message = error instanceof Error ? error.message : String(error);

  // Gemini reports depleted prepaid credit as HTTP 402 with a
  // RESOURCE_EXHAUSTED status, so billing must be checked before rate limits.
  if (
    providerStatus === 402 ||
    /payment_required|prepay(?:ment)? credits?.*depleted|credits?.*depleted/i.test(
      message
    )
  ) {
    return {
      code: "AI_BILLING_REQUIRED",
      message: "AI suggestions are temporarily unavailable. Try again later.",
      httpStatus: 503,
      providerStatus,
    };
  }

  if (/quota_exceeded|daily quota|requests per day|\bRPD\b/i.test(message)) {
    return {
      code: "AI_DAILY_QUOTA_REACHED",
      message: "The daily AI quota has been reached. Try again later.",
      httpStatus: 429,
      providerStatus,
    };
  }

  if (
    providerStatus === 429 ||
    /RESOURCE_EXHAUSTED|rate_limit_exceeded|too_many_requests|rate limit/i.test(
      message
    )
  ) {
    return {
      code: "AI_RATE_LIMITED",
      message: "AI is busy right now. Try again in a moment.",
      httpStatus: 429,
      providerStatus,
    };
  }

  if (
    providerStatus === 401 ||
    /UNAUTHENTICATED|API key|GEMINI_API_KEY/i.test(message)
  ) {
    return {
      code: "AI_CONFIGURATION_ERROR",
      message: "AI suggestions are temporarily unavailable. Try again later.",
      httpStatus: 503,
      providerStatus,
    };
  }

  if (providerStatus === 403 || /PERMISSION_DENIED/i.test(message)) {
    return {
      code: "AI_CONFIGURATION_ERROR",
      message: "AI suggestions are temporarily unavailable. Try again later.",
      httpStatus: 503,
      providerStatus,
    };
  }

  if (
    /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET|timeout/i.test(
      message
    )
  ) {
    return {
      code: "AI_UNAVAILABLE",
      message: "Couldn't reach Gemini. Try again in a moment.",
      httpStatus: 503,
      providerStatus,
    };
  }

  if (error instanceof z.ZodError || /response contract failed/i.test(message)) {
    return {
      code: "AI_INVALID_RESPONSE",
      message: "AI returned an invalid response. Try again.",
      httpStatus: 502,
      providerStatus,
    };
  }

  return {
    code: "AI_GENERATION_FAILED",
    message: fallback,
    httpStatus: 500,
    providerStatus,
  };
}

function getProviderStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const candidate = error as ErrorWithStatus;
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.statusCode === "number") return candidate.statusCode;
  return null;
}
