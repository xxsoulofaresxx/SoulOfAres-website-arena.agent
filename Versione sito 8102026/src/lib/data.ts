import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  geckos,
  geckoAncestors,
  geckoMedia,
  inquiries,
  type GeckoRow,
  type MediaRow,
} from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import {
  serializeGecko,
  type GeckoSpecimen,
  type GeckoStatus,
  type InquiryStatus,
  type InquiryRecord,
  type GeckoMediaRecord,
  type PedigreeNode,
} from "@/lib/types";
import { PEDIGREE_SLOTS, type PedigreeSaveInput, type PedigreeSlot } from "@/lib/pedigree";

export async function listGeckos(): Promise<GeckoSpecimen[]> {
  await ensureSeed();
  const rows = await db.select().from(geckos).orderBy(desc(geckos.createdAt));
  return rows.map(serializeGecko);
}

export interface CatalogStats {
  total: number;
  available: number;
  hold: number;
  sold: number;
  newInquiries: number;
}

export async function getStats(): Promise<CatalogStats> {
  await ensureSeed();
  const rows = await db.execute<{
    total: string;
    available: string;
    hold: string;
    sold: string;
    new_inquiries: string;
  }>(sql`
    select
      count(*)::text as total,
      count(*) filter (where status = 'Available')::text as available,
      count(*) filter (where status = 'Hold')::text as hold,
      count(*) filter (where status = 'Sold')::text as sold,
      (select count(*) from inquiries where status = 'New')::text as new_inquiries
    from geckos
  `);
  const row = rows.rows[0];
  return {
    total: Number(row?.total ?? 0),
    available: Number(row?.available ?? 0),
    hold: Number(row?.hold ?? 0),
    sold: Number(row?.sold ?? 0),
    newInquiries: Number(row?.new_inquiries ?? 0),
  };
}

export interface GeckoInput {
  code: string;
  morph: string;
  sex: GeckoRow["sex"];
  hatchDate: string;
  weightGrams: number;
  priceEur: number;
  status: GeckoRow["status"];
  imageUrl: string;
  sire: string;
  dam: string;
  paternalSire?: string | null;
  paternalDam?: string | null;
  maternalSire?: string | null;
  maternalDam?: string | null;
  notes: string;
  diet: string;
}

export async function createGecko(input: GeckoInput): Promise<GeckoSpecimen> {
  await ensureSeed();
  const [row] = await db.insert(geckos).values(input).returning();
  return serializeGecko(row);
}

export async function updateGecko(
  id: string,
  patch: Partial<GeckoInput>,
): Promise<GeckoSpecimen | null> {
  await ensureSeed();
  const [row] = await db
    .update(geckos)
    .set(patch)
    .where(eq(geckos.id, id))
    .returning();
  return row ? serializeGecko(row) : null;
}

export async function updateGeckoStatus(
  id: string,
  status: GeckoStatus,
): Promise<GeckoSpecimen | null> {
  return updateGecko(id, { status });
}

export async function deleteGecko(id: string): Promise<boolean> {
  await ensureSeed();
  const deleted = await db
    .delete(geckos)
    .where(eq(geckos.id, id))
    .returning({ id: geckos.id });
  return deleted.length > 0;
}

export async function listInquiries(): Promise<InquiryRecord[]> {
  await ensureSeed();
  const rows = await db
    .select({
      id: inquiries.id,
      geckoId: inquiries.geckoId,
      geckoCode: geckos.code,
      geckoMorph: geckos.morph,
      name: inquiries.name,
      email: inquiries.email,
      message: inquiries.message,
      locale: inquiries.locale,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
    })
    .from(inquiries)
    .innerJoin(geckos, eq(inquiries.geckoId, geckos.id))
    .orderBy(desc(inquiries.createdAt));

  return rows.map((row) => ({
    ...row,
    status: row.status as InquiryStatus,
    createdAt: row.createdAt.toISOString(),
  }));
}

export interface InquiryInput {
  geckoId: string;
  name: string;
  email: string;
  message: string;
  locale: string;
}

export async function createInquiry(
  input: InquiryInput,
): Promise<InquiryRecord | null> {
  await ensureSeed();
  const [gecko] = await db
    .select()
    .from(geckos)
    .where(eq(geckos.id, input.geckoId));
  if (!gecko) return null;

  const [row] = await db.insert(inquiries).values(input).returning();

  return {
    id: row.id,
    geckoId: row.geckoId,
    geckoCode: gecko.code,
    geckoMorph: gecko.morph,
    name: row.name,
    email: row.email,
    message: row.message,
    locale: row.locale,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<InquiryRecord | null> {
  await ensureSeed();
  const [row] = await db
    .update(inquiries)
    .set({ status })
    .where(eq(inquiries.id, id))
    .returning();
  if (!row) return null;
  const [gecko] = await db
    .select({ code: geckos.code, morph: geckos.morph })
    .from(geckos)
    .where(eq(geckos.id, row.geckoId));

  return {
    id: row.id,
    geckoId: row.geckoId,
    geckoCode: gecko?.code ?? "—",
    geckoMorph: gecko?.morph ?? "—",
    name: row.name,
    email: row.email,
    message: row.message,
    locale: row.locale,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getGeckoById(id: string): Promise<GeckoSpecimen | null> {
  await ensureSeed();
  const [row] = await db.select().from(geckos).where(eq(geckos.id, id));
  return row ? serializeGecko(row) : null;
}

function serializeMedia(row: MediaRow): GeckoMediaRecord {
  return {
    id: row.id,
    geckoId: row.geckoId,
    ancestorId: row.ancestorId,
    kind: row.kind === "video" ? "video" : "image",
    filename: row.filename,
    url: row.url,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

function legacyAncestorName(gecko: GeckoRow, slot: PedigreeSlot): string {
  const legacyNames: Partial<Record<PedigreeSlot, string | null>> = {
    sire: gecko.sire,
    dam: gecko.dam,
    paternalSire: gecko.paternalSire,
    paternalDam: gecko.paternalDam,
    maternalSire: gecko.maternalSire,
    maternalDam: gecko.maternalDam,
  };
  return legacyNames[slot] ?? "";
}

export async function getPedigreeForGecko(
  geckoId: string,
): Promise<PedigreeNode[] | null> {
  await ensureSeed();
  const [gecko] = await db.select().from(geckos).where(eq(geckos.id, geckoId));
  if (!gecko) return null;

  const rows = await db
    .select()
    .from(geckoAncestors)
    .where(eq(geckoAncestors.geckoId, geckoId));
  const found = new Set(rows.map((row) => row.slot));
  const missing = PEDIGREE_SLOTS.filter((entry) => !found.has(entry.slot));

  if (missing.length) {
    await db
      .insert(geckoAncestors)
      .values(
        missing.map((entry) => ({
          geckoId,
          slot: entry.slot,
          generation: entry.generation,
          name: legacyAncestorName(gecko, entry.slot),
        })),
      )
      .onConflictDoNothing();
  }

  const allRows = missing.length
    ? await db
        .select()
        .from(geckoAncestors)
        .where(eq(geckoAncestors.geckoId, geckoId))
    : rows;
  const bySlot = new Map(allRows.map((row) => [row.slot, row]));

  return PEDIGREE_SLOTS.map((definition) => {
    const row = bySlot.get(definition.slot);
    return {
      id: row?.id ?? null,
      slot: definition.slot,
      generation: definition.generation,
      name: row?.name ?? legacyAncestorName(gecko, definition.slot),
      morph: row?.morph ?? "",
      genetics: row?.genetics ?? "",
      notes: row?.notes ?? "",
    };
  });
}

export async function savePedigreeForGecko(
  geckoId: string,
  entries: PedigreeSaveInput[],
): Promise<PedigreeNode[] | null> {
  await ensureSeed();
  const [gecko] = await db.select().from(geckos).where(eq(geckos.id, geckoId));
  if (!gecko) return null;

  const inputBySlot = new Map(entries.map((entry) => [entry.slot, entry]));
  const values = PEDIGREE_SLOTS.map((definition) => {
    const entry = inputBySlot.get(definition.slot);
    return {
      geckoId,
      slot: definition.slot,
      generation: definition.generation,
      name: entry?.name.trim() ?? "",
      morph: entry?.morph.trim() ?? "",
      genetics: entry?.genetics.trim() ?? "",
      notes: entry?.notes.trim() ?? "",
    };
  });

  await db
    .insert(geckoAncestors)
    .values(values)
    .onConflictDoUpdate({
      target: [geckoAncestors.geckoId, geckoAncestors.slot],
      set: {
        generation: sql`excluded.generation`,
        name: sql`excluded.name`,
        morph: sql`excluded.morph`,
        genetics: sql`excluded.genetics`,
        notes: sql`excluded.notes`,
      },
    });

  const bySlot = new Map(values.map((entry) => [entry.slot, entry]));
  await db
    .update(geckos)
    .set({
      sire: bySlot.get("sire")?.name ?? "",
      dam: bySlot.get("dam")?.name ?? "",
      paternalSire: bySlot.get("paternalSire")?.name ?? null,
      paternalDam: bySlot.get("paternalDam")?.name ?? null,
      maternalSire: bySlot.get("maternalSire")?.name ?? null,
      maternalDam: bySlot.get("maternalDam")?.name ?? null,
    })
    .where(eq(geckos.id, geckoId));

  return getPedigreeForGecko(geckoId);
}

export async function listGeckoMedia(
  geckoId: string,
): Promise<GeckoMediaRecord[]> {
  await ensureSeed();
  const rows = await db
    .select()
    .from(geckoMedia)
    .where(eq(geckoMedia.geckoId, geckoId))
    .orderBy(desc(geckoMedia.createdAt));
  return rows.map(serializeMedia);
}

export async function getAncestorForGecko(geckoId: string, ancestorId: string) {
  await ensureSeed();
  const [ancestor] = await db
    .select()
    .from(geckoAncestors)
    .where(
      sql`${geckoAncestors.geckoId} = ${geckoId} and ${geckoAncestors.id} = ${ancestorId}`,
    );
  return ancestor ?? null;
}

export async function addGeckoMedia(input: {
  geckoId: string;
  ancestorId: string | null;
  kind: "image" | "video";
  filename: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}): Promise<GeckoMediaRecord> {
  await ensureSeed();
  const [row] = await db.insert(geckoMedia).values(input).returning();
  return serializeMedia(row);
}

export async function getGeckoMediaById(
  geckoId: string,
  mediaId: string,
): Promise<GeckoMediaRecord | null> {
  await ensureSeed();
  const [row] = await db
    .select()
    .from(geckoMedia)
    .where(
      sql`${geckoMedia.geckoId} = ${geckoId} and ${geckoMedia.id} = ${mediaId}`,
    );
  return row ? serializeMedia(row) : null;
}

export async function removeGeckoMedia(
  geckoId: string,
  mediaId: string,
): Promise<GeckoMediaRecord | null> {
  await ensureSeed();
  const [row] = await db
    .delete(geckoMedia)
    .where(
      sql`${geckoMedia.geckoId} = ${geckoId} and ${geckoMedia.id} = ${mediaId}`,
    )
    .returning();
  return row ? serializeMedia(row) : null;
}
