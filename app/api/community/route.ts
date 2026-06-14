import { NextResponse } from "next/server";
import {
  deleteBallot,
  getCommunityStats,
  saveBallot,
  validatePicks,
} from "@/lib/community-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_POSTS = 30;
const RATE_LIMIT_MAX_CLIENTS = 5_000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  liellaCommunityRateLimit?: Map<string, RateLimitEntry>;
};

const rateLimit = globalRateLimit.liellaCommunityRateLimit ?? new Map();
globalRateLimit.liellaCommunityRateLimit = rateLimit;

function errorResponse(message: string, status: number, retryAfter?: number) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return NextResponse.json({ error: message }, { status, headers });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(request: Request): number | null {
  const now = Date.now();
  const key = clientKey(request);
  const existing = rateLimit.get(key);

  if (rateLimit.size >= RATE_LIMIT_MAX_CLIENTS) {
    for (const [entryKey, entry] of rateLimit) {
      if (entry.resetAt <= now) rateLimit.delete(entryKey);
    }
    if (rateLimit.size >= RATE_LIMIT_MAX_CLIENTS) {
      const oldestKey = rateLimit.keys().next().value as string | undefined;
      if (oldestKey) rateLimit.delete(oldestKey);
    }
  }

  if (!existing || existing.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (existing.count >= RATE_LIMIT_MAX_POSTS) {
    return Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  }

  existing.count += 1;
  return null;
}

export async function GET() {
  return NextResponse.json(getCommunityStats(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-site submissions are not allowed.", 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large.", 413);
  }

  const retryAfter = checkRateLimit(request);
  if (retryAfter) {
    return errorResponse("Too many submissions. Please wait briefly.", 429, retryAfter);
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse("Request body is too large.", 413);
    }

    const body = JSON.parse(rawBody) as {
      voterId?: unknown;
      picks?: unknown;
    };
    if (typeof body.voterId !== "string") {
      throw new Error("Missing anonymous voter ID.");
    }

    const picks = validatePicks(body.picks);
    saveBallot(body.voterId, picks);
    return NextResponse.json(getCommunityStats(), {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid ballot.";
    return errorResponse(message, 400);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-site submissions are not allowed.", 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return errorResponse("Request body is too large.", 413);
  }

  const retryAfter = checkRateLimit(request);
  if (retryAfter) {
    return errorResponse("Too many submissions. Please wait briefly.", 429, retryAfter);
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse("Request body is too large.", 413);
    }

    const body = JSON.parse(rawBody) as { voterId?: unknown };
    if (typeof body.voterId !== "string") {
      throw new Error("Missing anonymous voter ID.");
    }

    deleteBallot(body.voterId);
    return NextResponse.json(getCommunityStats(), {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return errorResponse(message, 400);
  }
}
