import type { GeckoRow } from "@/db/schema";
import type { GeckoMediaRecord, PedigreeNode, PedigreeSlot } from "@/lib/pedigree";

export type { GeckoMediaRecord, PedigreeNode, PedigreeSlot } from "@/lib/pedigree";

export type GeckoSex = "Male" | "Female" | "Unsexed";
export type GeckoStatus = "Available" | "Hold" | "Sold";
export type InquiryStatus = "New" | "Replied" | "Closed";

export interface GeckoSpecimen {
  id: string;
  code: string;
  morph: string;
  sex: GeckoSex;
  hatchDate: string;
  weightGrams: number;
  priceEUR: number;
  status: GeckoStatus;
  imageUrl: string;
  sire: string;
  dam: string;
  grandparents?: {
    paternalSire?: string;
    paternalDam?: string;
    maternalSire?: string;
    maternalDam?: string;
  };
  notes: string;
  diet: string;
}

export interface InquiryRecord {
  id: string;
  geckoId: string;
  geckoCode: string;
  geckoMorph: string;
  name: string;
  email: string;
  message: string;
  locale: string;
  status: InquiryStatus;
  createdAt: string;
}

export function serializeGecko(row: GeckoRow): GeckoSpecimen {
  return {
    id: row.id,
    code: row.code,
    morph: row.morph,
    sex: row.sex,
    hatchDate: row.hatchDate,
    weightGrams: row.weightGrams,
    priceEUR: row.priceEur,
    status: row.status,
    imageUrl: row.imageUrl,
    sire: row.sire,
    dam: row.dam,
    grandparents: {
      paternalSire: row.paternalSire ?? undefined,
      paternalDam: row.paternalDam ?? undefined,
      maternalSire: row.maternalSire ?? undefined,
      maternalDam: row.maternalDam ?? undefined,
    },
    notes: row.notes,
    diet: row.diet,
  };
}
