import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const geckoStatusEnum = pgEnum("gecko_status", [
  "Available",
  "Hold",
  "Sold",
]);

export const geckoSexEnum = pgEnum("gecko_sex", ["Male", "Female", "Unsexed"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "New",
  "Replied",
  "Closed",
]);

export const geckos = pgTable("geckos", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  morph: text("morph").notNull(),
  sex: geckoSexEnum("sex").notNull().default("Unsexed"),
  hatchDate: text("hatch_date").notNull(),
  weightGrams: integer("weight_grams").notNull().default(0),
  priceEur: integer("price_eur").notNull().default(0),
  status: geckoStatusEnum("status").notNull().default("Available"),
  imageUrl: text("image_url").notNull(),
  sire: text("sire").notNull().default(""),
  dam: text("dam").notNull().default(""),
  paternalSire: text("paternal_sire"),
  paternalDam: text("paternal_dam"),
  maternalSire: text("maternal_sire"),
  maternalDam: text("maternal_dam"),
  notes: text("notes").notNull().default(""),
  diet: text("diet").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const geckoAncestors = pgTable(
  "gecko_ancestors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    geckoId: uuid("gecko_id")
      .notNull()
      .references(() => geckos.id, { onDelete: "cascade" }),
    slot: text("slot").notNull(),
    generation: integer("generation").notNull(),
    name: text("name").notNull().default(""),
    morph: text("morph").notNull().default(""),
    genetics: text("genetics").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("gecko_ancestors_gecko_slot_unique").on(
      table.geckoId,
      table.slot,
    ),
    index("gecko_ancestors_gecko_idx").on(table.geckoId),
  ],
);

export const geckoMedia = pgTable(
  "gecko_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    geckoId: uuid("gecko_id")
      .notNull()
      .references(() => geckos.id, { onDelete: "cascade" }),
    ancestorId: uuid("ancestor_id").references(() => geckoAncestors.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gecko_media_gecko_idx").on(table.geckoId),
    index("gecko_media_ancestor_idx").on(table.ancestorId),
  ],
);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  geckoId: uuid("gecko_id")
    .notNull()
    .references(() => geckos.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull().default(""),
  locale: text("locale").notNull().default("it"),
  status: inquiryStatusEnum("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type GeckoRow = typeof geckos.$inferSelect;
export type NewGeckoRow = typeof geckos.$inferInsert;
export type InquiryRow = typeof inquiries.$inferSelect;
export type AncestorRow = typeof geckoAncestors.$inferSelect;
export type MediaRow = typeof geckoMedia.$inferSelect;
