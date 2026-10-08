import { sql } from "drizzle-orm";
import { db } from "@/db";
import { geckos, type NewGeckoRow } from "@/db/schema";
import { PEDIGREE_SLOTS } from "@/lib/pedigree";

export const SEED_GECKOS: NewGeckoRow[] = [
  {
    code: "CG-2024-09",
    morph: "Lilly White",
    sex: "Male",
    hatchDate: "2024-03-12",
    weightGrams: 24,
    priceEur: 250,
    status: "Available",
    imageUrl: "/images/lilly-white.jpg",
    sire: "Zephyr (Red Lilly White)",
    dam: "Lily (Harlequin 100% Het Axanthic)",
    paternalSire: "Ares Line",
    paternalDam: "Pure White",
    maternalSire: "Dark Knight",
    maternalDam: "Blonde Harlequin",
    notes:
      "Grande contrasto dorsale e laterale pulitissimo. Mangia da solo, temperamento calmo.",
    diet: "Pangaea alla frutta + Grilli spolverati con calcio/D3",
  },
  {
    code: "CG-2024-12",
    morph: "Frappuccino",
    sex: "Female",
    hatchDate: "2024-01-20",
    weightGrams: 42,
    priceEur: 450,
    status: "Available",
    imageUrl: "/images/frappuccino.jpg",
    sire: "Zephyr (Cappuccino)",
    dam: "Lily (Lilly White)",
    paternalSire: "Cap King",
    paternalDam: "Dark Mocha",
    maternalSire: "Nordic Lilly",
    maternalDam: "Harlequin Line",
    notes: "Struttura eccellente, pronta per la riproduzione nella prossima stagione.",
    diet: "Repashy Grubs'N'Fruit + tarme e grilli vivi",
  },
  {
    code: "CG-2024-13",
    morph: "Axanthic",
    sex: "Unsexed",
    hatchDate: "2024-05-10",
    weightGrams: 16,
    priceEur: 450,
    status: "Available",
    imageUrl: "/images/axanthic.jpg",
    sire: "Zephyr (Axanthic Line)",
    dam: "Lily (Het Axanthic)",
    paternalSire: "Silver Storm",
    paternalDam: "Midnight Ash",
    maternalSire: "Graphite",
    maternalDam: "Blue Harlequin",
    notes:
      "Nero/argento solido, genetica certificata senza ingiallimenti. Possibile progetto Axanthic Lilly.",
    diet: "Pangaea Growth & Breeding + micro-grilli",
  },
  {
    code: "CG-2024-19",
    morph: "Superstripe / Lilly",
    sex: "Male",
    hatchDate: "2024-02-15",
    weightGrams: 38,
    priceEur: 250,
    status: "Available",
    imageUrl: "/images/superstripe.jpg",
    sire: "Zephyr (Pinstripe 100%)",
    dam: "Lily (Lilly White Superstripe)",
    paternalSire: "Stripe King",
    paternalDam: "Olive Queen",
    maternalSire: "Nordic Lilly",
    maternalDam: "Harlequin Line",
    notes: "Striscia dorsale completa e simmetrica dal capo alla coda.",
    diet: "Grilli e Pangaea Insect formula",
  },
  {
    code: "CG-2024-11",
    morph: "Axanthic 100% Het Cappuccino",
    sex: "Unsexed",
    hatchDate: "2024-04-18",
    weightGrams: 22,
    priceEur: 320,
    status: "Hold",
    imageUrl: "/images/axanthic.jpg",
    sire: "Zephyr (Axanthic)",
    dam: "Lily (Cappuccino)",
    paternalSire: "Silver Storm",
    paternalDam: "Midnight Ash",
    maternalSire: "Cap King",
    maternalDam: "Dark Mocha",
    notes:
      "Progetto Axanthic Frappuccino. Al momento in opzione per fiera con deposito versato.",
    diet: "Pangaea con insetti",
  },
  {
    code: "CG-2023-04",
    morph: "Harlequin Dalmatian",
    sex: "Female",
    hatchDate: "2023-06-02",
    weightGrams: 48,
    priceEur: 380,
    status: "Sold",
    imageUrl: "/images/superstripe.jpg",
    sire: "Dalmata Rex",
    dam: "Fire Harlequin",
    paternalSire: "Spot Line",
    paternalDam: "Red Dalmatian",
    maternalSire: "Ember",
    maternalDam: "Tiger Harlequin",
    notes: "Tratteggi Dalmatian fitti su base rosso fuoco. Ceduta a kolezionista IT.",
    diet: "Repashy + tarme della farina",
  },
];

let seedPromise: Promise<void> | null = null;

async function runSeed() {
  await db.execute(sql`
    do $$ begin
      create type gecko_sex as enum ('Male', 'Female', 'Unsexed');
    exception when duplicate_object then null; end $$;
  `);
  await db.execute(sql`
    do $$ begin
      create type gecko_status as enum ('Available', 'Hold', 'Sold');
    exception when duplicate_object then null; end $$;
  `);
  await db.execute(sql`
    do $$ begin
      create type inquiry_status as enum ('New', 'Replied', 'Closed');
    exception when duplicate_object then null; end $$;
  `);
  await db.execute(sql`
    create table if not exists geckos (
      id uuid primary key default gen_random_uuid(),
      code text not null unique,
      morph text not null,
      sex gecko_sex not null default 'Unsexed',
      hatch_date text not null,
      weight_grams integer not null default 0,
      price_eur integer not null default 0,
      status gecko_status not null default 'Available',
      image_url text not null,
      sire text not null default '',
      dam text not null default '',
      paternal_sire text,
      paternal_dam text,
      maternal_sire text,
      maternal_dam text,
      notes text not null default '',
      diet text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`
    create table if not exists gecko_ancestors (
      id uuid primary key default gen_random_uuid(),
      gecko_id uuid not null references geckos(id) on delete cascade,
      slot text not null,
      generation integer not null,
      name text not null default '',
      morph text not null default '',
      genetics text not null default '',
      notes text not null default '',
      created_at timestamptz not null default now(),
      constraint gecko_ancestors_gecko_slot_unique unique (gecko_id, slot)
    )
  `);
  await db.execute(sql`
    create index if not exists gecko_ancestors_gecko_idx on gecko_ancestors (gecko_id)
  `);
  await db.execute(sql`
    create table if not exists gecko_media (
      id uuid primary key default gen_random_uuid(),
      gecko_id uuid not null references geckos(id) on delete cascade,
      ancestor_id uuid references gecko_ancestors(id) on delete cascade,
      kind text not null,
      filename text not null,
      url text not null,
      content_type text not null,
      size_bytes integer not null default 0,
      created_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`
    create index if not exists gecko_media_gecko_idx on gecko_media (gecko_id)
  `);
  await db.execute(sql`
    create index if not exists gecko_media_ancestor_idx on gecko_media (ancestor_id)
  `);
  await db.execute(sql`
    create table if not exists inquiries (
      id uuid primary key default gen_random_uuid(),
      gecko_id uuid not null references geckos(id) on delete cascade,
      name text not null,
      email text not null,
      message text not null default '',
      locale text not null default 'it',
      status inquiry_status not null default 'New',
      created_at timestamptz not null default now()
    )
  `);

  const existing = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from geckos`,
  );
  const count = Number(existing.rows[0]?.count ?? "0");
  if (count === 0) {
    await db.insert(geckos).values(SEED_GECKOS).onConflictDoNothing();
  }

  const slotValues = sql.join(
    PEDIGREE_SLOTS.map(({ slot, generation }) => sql`(${slot}, ${generation})`),
    sql`,`,
  );
  await db.execute(sql`
    insert into gecko_ancestors (gecko_id, slot, generation, name)
    select
      g.id,
      pedigree_slot.slot,
      pedigree_slot.generation::integer,
      case pedigree_slot.slot
        when 'sire' then g.sire
        when 'dam' then g.dam
        when 'paternalSire' then coalesce(g.paternal_sire, '')
        when 'paternalDam' then coalesce(g.paternal_dam, '')
        when 'maternalSire' then coalesce(g.maternal_sire, '')
        when 'maternalDam' then coalesce(g.maternal_dam, '')
        else ''
      end
    from geckos as g
    cross join (values ${slotValues}) as pedigree_slot(slot, generation)
    on conflict (gecko_id, slot) do nothing
  `);
}

/** Ensures tables + starter inventory exist. Safe to call on every request. */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
