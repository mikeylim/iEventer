export const MAX_AI_REQUEST_BYTES = 32 * 1024;

export class RequestBodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Request body exceeds the ${Math.floor(maxBytes / 1024)} KiB limit.`);
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readLimitedJsonBody(
  request: Request,
  maxBytes = MAX_AI_REQUEST_BYTES
): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError(maxBytes);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
