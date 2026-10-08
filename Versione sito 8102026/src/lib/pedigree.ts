export const PEDIGREE_SLOTS = [
  { slot: "sire", generation: 1, parent: null, labelIt: "Padre (sire)", labelEn: "Sire" },
  { slot: "dam", generation: 1, parent: null, labelIt: "Madre (dam)", labelEn: "Dam" },
  { slot: "paternalSire", generation: 2, parent: "sire", labelIt: "Nonno paterno", labelEn: "Paternal grandsire" },
  { slot: "paternalDam", generation: 2, parent: "sire", labelIt: "Nonna paterna", labelEn: "Paternal granddam" },
  { slot: "maternalSire", generation: 2, parent: "dam", labelIt: "Nonno materno", labelEn: "Maternal grandsire" },
  { slot: "maternalDam", generation: 2, parent: "dam", labelIt: "Nonna materna", labelEn: "Maternal granddam" },
  { slot: "paternalSireSire", generation: 3, parent: "paternalSire", labelIt: "Bisnonno paterno · linea sire", labelEn: "Paternal great-grandsire · sire line" },
  { slot: "paternalSireDam", generation: 3, parent: "paternalSire", labelIt: "Bisnonna paterna · linea sire", labelEn: "Paternal great-granddam · sire line" },
  { slot: "paternalDamSire", generation: 3, parent: "paternalDam", labelIt: "Bisnonno paterno · linea dam", labelEn: "Paternal great-grandsire · dam line" },
  { slot: "paternalDamDam", generation: 3, parent: "paternalDam", labelIt: "Bisnonna paterna · linea dam", labelEn: "Paternal great-granddam · dam line" },
  { slot: "maternalSireSire", generation: 3, parent: "maternalSire", labelIt: "Bisnonno materno · linea sire", labelEn: "Maternal great-grandsire · sire line" },
  { slot: "maternalSireDam", generation: 3, parent: "maternalSire", labelIt: "Bisnonna materna · linea sire", labelEn: "Maternal great-granddam · sire line" },
  { slot: "maternalDamSire", generation: 3, parent: "maternalDam", labelIt: "Bisnonno materno · linea dam", labelEn: "Maternal great-grandsire · dam line" },
  { slot: "maternalDamDam", generation: 3, parent: "maternalDam", labelIt: "Bisnonna materna · linea dam", labelEn: "Maternal great-granddam · dam line" },
] as const;

export type PedigreeSlot = (typeof PEDIGREE_SLOTS)[number]["slot"];

export interface PedigreeNode {
  id: string | null;
  slot: PedigreeSlot;
  generation: 1 | 2 | 3;
  name: string;
  morph: string;
  genetics: string;
  notes: string;
}

export interface GeckoMediaRecord {
  id: string;
  geckoId: string;
  ancestorId: string | null;
  kind: "image" | "video";
  filename: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface PedigreeSaveInput {
  slot: PedigreeSlot;
  name: string;
  morph: string;
  genetics: string;
  notes: string;
}

export function isPedigreeSlot(value: unknown): value is PedigreeSlot {
  return PEDIGREE_SLOTS.some((node) => node.slot === value);
}
