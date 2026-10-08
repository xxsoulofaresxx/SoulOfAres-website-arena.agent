import { NextResponse } from "next/server";
import { getPedigreeForGecko, savePedigreeForGecko } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";
import { PEDIGREE_SLOTS, isPedigreeSlot, type PedigreeSaveInput } from "@/lib/pedigree";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELD_LIMITS = { name: 180, morph: 180, genetics: 500, notes: 1000 } as const;

function readText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    const ancestors = await getPedigreeForGecko(id);
    if (!ancestors) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    return NextResponse.json({ ancestors });
  } catch (error) {
    console.error("GET gecko ancestors failed", error);
    return NextResponse.json({ error: "Pedigree non disponibile" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    const body = (await request.json()) as { ancestors?: unknown };
    if (!Array.isArray(body.ancestors) || body.ancestors.length !== PEDIGREE_SLOTS.length) {
      return NextResponse.json({ error: "Servono tutti i 14 nodi del pedigree" }, { status: 400 });
    }

    const entries: PedigreeSaveInput[] = [];
    for (const raw of body.ancestors) {
      if (!raw || typeof raw !== "object") {
        return NextResponse.json({ error: "Nodo non valido" }, { status: 400 });
      }
      const entry = raw as Record<string, unknown>;
      if (!isPedigreeSlot(entry.slot)) {
        return NextResponse.json({ error: "Posizione genealogica non valida" }, { status: 400 });
      }
      const name = readText(entry.name ?? "", FIELD_LIMITS.name);
      const morph = readText(entry.morph ?? "", FIELD_LIMITS.morph);
      const genetics = readText(entry.genetics ?? "", FIELD_LIMITS.genetics);
      const notes = readText(entry.notes ?? "", FIELD_LIMITS.notes);
      if (name === null || morph === null || genetics === null || notes === null) {
        return NextResponse.json({ error: "Uno dei campi supera la lunghezza consentita" }, { status: 400 });
      }
      entries.push({ slot: entry.slot, name, morph, genetics, notes });
    }
    if (new Set(entries.map((entry) => entry.slot)).size !== PEDIGREE_SLOTS.length) {
      return NextResponse.json({ error: "Ci sono posizioni genealogiche duplicate" }, { status: 400 });
    }

    const ancestors = await savePedigreeForGecko(id, entries);
    if (!ancestors) return NextResponse.json({ error: "Esemplare non trovato" }, { status: 404 });
    return NextResponse.json({ ancestors });
  } catch (error) {
    console.error("PUT gecko ancestors failed", error);
    return NextResponse.json({ error: "Impossibile salvare il pedigree" }, { status: 500 });
  }
}
