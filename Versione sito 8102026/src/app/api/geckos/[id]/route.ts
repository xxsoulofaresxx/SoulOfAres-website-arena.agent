import { deleteGecko, updateGecko, type GeckoInput } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SEXES = ["Male", "Female", "Unsexed"];
const STATUSES = ["Available", "Hold", "Sold"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body: Record<string, unknown> = await request.json();
    const patch: Partial<GeckoInput> = {};

    if (typeof body.status === "string" && STATUSES.includes(body.status)) {
      patch.status = body.status as GeckoInput["status"];
    }
    if (typeof body.sex === "string" && SEXES.includes(body.sex)) {
      patch.sex = body.sex as GeckoInput["sex"];
    }
    if (body.priceEUR !== undefined) {
      const price = Number(body.priceEUR);
      if (Number.isFinite(price) && price >= 0) patch.priceEur = Math.round(price);
    }
    if (body.weightGrams !== undefined) {
      const weight = Number(body.weightGrams);
      if (Number.isFinite(weight) && weight >= 0) {
        patch.weightGrams = Math.round(weight);
      }
    }
    if (typeof body.morph === "string" && body.morph.trim()) {
      patch.morph = body.morph.trim();
    }
    if (typeof body.notes === "string") patch.notes = body.notes;
    if (typeof body.diet === "string") patch.diet = body.diet;

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const gecko = await updateGecko(id, patch);
    if (!gecko) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ gecko });
  } catch (error) {
    console.error("PATCH /api/geckos/[id] failed", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const ok = await deleteGecko(id);
    if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/geckos/[id] failed", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
