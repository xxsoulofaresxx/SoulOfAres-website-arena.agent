import { createGecko, listGeckos, type GeckoInput } from "@/lib/data";
import type { GeckoRow } from "@/db/schema";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listGeckos();
    return Response.json({ items });
  } catch (error) {
    console.error("GET /api/geckos failed", error);
    return Response.json({ error: "Database unavailable" }, { status: 500 });
  }
}

const SEXES = ["Male", "Female", "Unsexed"];
const STATUSES = ["Available", "Hold", "Sold"];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: Request) {
  if (!(await isBreederAuthorized())) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const body: Record<string, unknown> = await request.json();

    const code = str(body.code);
    const morph = str(body.morph);
    const hatchDate = str(body.hatchDate);
    const sexRaw = str(body.sex, "Unsexed");
    const statusRaw = str(body.status, "Available");

    if (!code || !morph || !hatchDate) {
      return Response.json(
        { error: "code, morph and hatchDate are required" },
        { status: 400 },
      );
    }

    const payload: GeckoInput = {
      code,
      morph,
      sex: (SEXES.includes(sexRaw) ? sexRaw : "Unsexed") as GeckoRow["sex"],
      hatchDate,
      weightGrams: Math.max(0, Math.round(num(body.weightGrams))),
      priceEur: Math.max(0, Math.round(num(body.priceEUR))),
      status: (STATUSES.includes(statusRaw)
        ? statusRaw
        : "Available") as GeckoRow["status"],
      imageUrl:
        str(body.imageUrl, "/images/lilly-white.jpg") || "/images/lilly-white.jpg",
      sire: str(body.sire, "Unknown"),
      dam: str(body.dam, "Unknown"),
      paternalSire: str(body.paternalSire) || null,
      paternalDam: str(body.paternalDam) || null,
      maternalSire: str(body.maternalSire) || null,
      maternalDam: str(body.maternalDam) || null,
      notes: str(body.notes),
      diet: str(body.diet),
    };

    const gecko = await createGecko(payload);
    return Response.json({ gecko }, { status: 201 });
  } catch (error) {
    console.error("POST /api/geckos failed", error);
    const message =
      typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505"
        ? "A specimen with this ID code already exists"
        : "Could not create specimen";
    return Response.json({ error: message }, { status: 400 });
  }
}
