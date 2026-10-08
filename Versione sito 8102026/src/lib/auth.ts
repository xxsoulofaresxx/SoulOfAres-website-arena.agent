import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const BREEDER_SESSION_COOKIE = "soul-of-ares-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): string | null {
  return process.env.BREEDER_SESSION_SECRET || process.env.BREEDER_PASSWORD || null;
}

function sign(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}

function constantTimeStringEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function isValidBreederPassword(candidate: string): boolean {
  const expected = process.env.BREEDER_PASSWORD;
  if (!expected) return false;
  return constantTimeStringEqual(candidate, expected);
}

export function createBreederSessionToken(now = Date.now()): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const timestamp = String(now);
  return `${timestamp}.${sign(timestamp, secret)}`;
}

export function isValidBreederSessionToken(token?: string): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const [timestamp, signature, ...extra] = token.split(".");
  if (!timestamp || !signature || extra.length > 0) return false;
  const issuedAt = Number(timestamp);
  const now = Date.now();
  const maxAgeMs = SESSION_MAX_AGE_SECONDS * 1000;
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now || now - issuedAt > maxAgeMs) {
    return false;
  }

  return constantTimeStringEqual(signature, sign(timestamp, secret));
}

export async function isBreederAuthorized(): Promise<boolean> {
  if (!process.env.BREEDER_PASSWORD || !getSessionSecret()) return false;
  const store = await cookies();
  return isValidBreederSessionToken(
    store.get(BREEDER_SESSION_COOKIE)?.value,
  );
}
