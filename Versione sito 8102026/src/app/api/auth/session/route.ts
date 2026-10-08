import { NextResponse } from "next/server";
import {
  BREEDER_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createBreederSessionToken,
  isValidBreederPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function POST(request: Request) {
  if (!process.env.BREEDER_PASSWORD) {
    return NextResponse.json(
      { error: "Breeder access is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (!isValidBreederPassword(password)) {
      return NextResponse.json(
        { error: "Password non corretta" },
        { status: 401 },
      );
    }

    const token = createBreederSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: "Session secret is not configured" },
        { status: 503 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(BREEDER_SESSION_COOKIE, token, {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BREEDER_SESSION_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
