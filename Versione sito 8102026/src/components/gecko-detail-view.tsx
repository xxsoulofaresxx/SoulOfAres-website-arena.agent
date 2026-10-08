"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Dna,
  Egg,
  ImagePlus,
  Loader2,
  Play,
  Scale,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/brand-logo";
import { EXCHANGE_RATES, TRANSLATIONS, formatPrice } from "@/lib/i18n";
import type { CurrencyCode, Lang } from "@/lib/i18n";
import { PEDIGREE_SLOTS, type PedigreeNode, type PedigreeSlot } from "@/lib/pedigree";
import type { GeckoMediaRecord } from "@/lib/types";
import type { GeckoSpecimen } from "@/lib/types";

interface Props {
  initialGecko: GeckoSpecimen;
  initialAncestors: PedigreeNode[];
  initialMedia: GeckoMediaRecord[];
  isOwner: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const GREAT_GRANDPARENT_GROUPS: Array<{
  titleIt: string;
  titleEn: string;
  parent: PedigreeSlot;
  slots: [PedigreeSlot, PedigreeSlot];
}> = [
  {
    titleIt: "Nonno paterno · linea sire",
    titleEn: "Paternal grandsire's line",
    parent: "paternalSire",
    slots: ["paternalSireSire", "paternalSireDam"],
  },
  {
    titleIt: "Nonna paterna · linea dam",
    titleEn: "Paternal granddam's line",
    parent: "paternalDam",
    slots: ["paternalDamSire", "paternalDamDam"],
  },
  {
    titleIt: "Nonno materno · linea sire",
    titleEn: "Maternal grandsire's line",
    parent: "maternalSire",
    slots: ["maternalSireSire", "maternalSireDam"],
  },
  {
    titleIt: "Nonna materna · linea dam",
    titleEn: "Maternal granddam's line",
    parent: "maternalDam",
    slots: ["maternalDamSire", "maternalDamDam"],
  },
];

function generationLabel(slot: PedigreeSlot, lang: Lang) {
  const definition = PEDIGREE_SLOTS.find((item) => item.slot === slot);
  return lang === "it" ? definition?.labelIt : definition?.labelEn;
}

function displayDate(date: string, lang: Lang) {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function GeckoDetailView({
  initialGecko,
  initialAncestors,
  initialMedia,
  isOwner,
}: Props) {
  const [gecko, setGecko] = useState(initialGecko);
  const [ancestors, setAncestors] = useState(initialAncestors);
  const [savedAncestors, setSavedAncestors] = useState(initialAncestors);
  const [media, setMedia] = useState(initialMedia);
  const [lang, setLang] = useState<Lang>("it");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [activeMediaId, setActiveMediaId] = useState<string | null>(
    initialMedia.find((item) => item.ancestorId === null && item.kind === "image")?.id ?? null,
  );
  const [editingPedigree, setEditingPedigree] = useState(false);
  const [savingPedigree, setSavingPedigree] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem("gecko.lang");
      if (savedLang === "it" || savedLang === "en") setLang(savedLang);
      const savedCurrency = window.localStorage.getItem("gecko.currency");
      if (savedCurrency && savedCurrency in EXCHANGE_RATES) {
        setCurrency(savedCurrency as CurrencyCode);
      }
    } catch {
      /* ignore unavailable storage */
    }
  }, []);

  const setLanguage = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem("gecko.lang", next);
  };

  const publicMedia = useMemo(
    () => media.filter((item) => item.ancestorId === null),
    [media],
  );
  const selectedMedia = publicMedia.find((item) => item.id === activeMediaId);
  const ancestorMap = useMemo(
    () => new Map(ancestors.map((node) => [node.slot, node])),
    [ancestors],
  );

  const updateAncestor = (
    slot: PedigreeSlot,
    key: "name" | "morph" | "genetics" | "notes",
    value: string,
  ) => {
    setAncestors((current) =>
      current.map((node) =>
        node.slot === slot ? { ...node, [key]: value } : node,
      ),
    );
  };

  const savePedigree = async () => {
    setSavingPedigree(true);
    try {
      const response = await fetch(`/api/geckos/${gecko.id}/ancestors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ancestors: ancestors.map(({ slot, name, morph, genetics, notes }) => ({
            slot,
            name,
            morph,
            genetics,
            notes,
          })),
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? t.pedigreeError);
      }
      const data = (await response.json()) as { ancestors: PedigreeNode[] };
      setAncestors(data.ancestors);
      setSavedAncestors(data.ancestors);
      const bySlot = new Map(data.ancestors.map((node) => [node.slot, node]));
      setGecko((current) => ({
        ...current,
        sire: bySlot.get("sire")?.name ?? current.sire,
        dam: bySlot.get("dam")?.name ?? current.dam,
        grandparents: {
          paternalSire: bySlot.get("paternalSire")?.name,
          paternalDam: bySlot.get("paternalDam")?.name,
          maternalSire: bySlot.get("maternalSire")?.name,
          maternalDam: bySlot.get("maternalDam")?.name,
        },
      }));
      setEditingPedigree(false);
      toast.success(t.pedigreeSaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.pedigreeError);
    } finally {
      setSavingPedigree(false);
    }
  };

  const uploadFiles = async (fileList: FileList | null, ancestorId: string | null = null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const targetKey = ancestorId ?? "specimen";
    setUploadProgress((current) => ({ ...current, [targetKey]: 0 }));
    let completed = 0;

    for (const file of files) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        toast.error(`${file.name}: formato non supportato`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: massimo 100 MB`);
        continue;
      }

      try {
        const blob = await upload(file.name.slice(-120), file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          clientPayload: JSON.stringify({ geckoId: gecko.id, ancestorId }),
          multipart: file.size > 50 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploadProgress((current) => ({ ...current, [targetKey]: percentage }));
          },
        });

        const response = await fetch(`/api/geckos/${gecko.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ancestorId,
            url: blob.url,
            filename: file.name.slice(0, 200),
            contentType: file.type,
            sizeBytes: file.size,
          }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? t.uploadError);
        }
        const data = (await response.json()) as { media: GeckoMediaRecord };
        setMedia((current) => [data.media, ...current]);
        if (!ancestorId && data.media.kind === "image") {
          setActiveMediaId(data.media.id);
        }
        completed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : t.uploadError;
        if (
          message.toLowerCase().includes("blob") ||
          message.toLowerCase().includes("token") ||
          message.includes("503")
        ) {
          toast.error(t.mediaSetupHint, { duration: 7000 });
        } else {
          toast.error(`${t.uploadError}: ${message}`);
        }
      }
    }

    setUploadProgress((current) => {
      const next = { ...current };
      delete next[targetKey];
      return next;
    });
    if (completed > 0) toast.success(`${completed} · ${t.uploadSuccess}`);
  };

  const deleteMedia = async (item: GeckoMediaRecord) => {
    if (!window.confirm(`${t.deleteMedia}: ${item.filename}?`)) return;
    setDeletingMediaId(item.id);
    try {
      const response = await fetch(
        `/api/geckos/${gecko.id}/media/${item.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? t.uploadError);
      }
      setMedia((current) => current.filter((entry) => entry.id !== item.id));
      if (activeMediaId === item.id) setActiveMediaId(null);
      toast.success(t.deleted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.uploadError);
    } finally {
      setDeletingMediaId(null);
    }
  };

  const rootProgress = uploadProgress.specimen;
  const mainImage = selectedMedia?.kind === "image" ? selectedMedia.url : gecko.imageUrl;

  const renderNode = (slot: PedigreeSlot) => {
    const node = ancestorMap.get(slot);
    if (!node) return null;
    const label = generationLabel(slot, lang) ?? slot;
    const nodeMedia = media.filter((item) => item.ancestorId === node.id);
    const nodePhoto = nodeMedia.find((item) => item.kind === "image");
    const progress = node.id ? uploadProgress[node.id] : undefined;

    return (
      <article
        key={slot}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 transition hover:border-fuchsia-300/25"
      >
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
            {nodePhoto ? (
              <Image src={nodePhoto.url} alt={node.name || label} fill sizes="56px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-700">
                <Dna className="h-5 w-5" />
              </div>
            )}
            {nodeMedia.some((item) => item.kind === "video") && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 p-0.5 text-fuchsia-200">
                <Video className="h-3 w-3" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-fuchsia-300/75">
              {label}
            </p>
            {editingPedigree ? (
              <div className="mt-1.5 space-y-1.5">
                <input
                  value={node.name}
                  onChange={(event) => updateAncestor(slot, "name", event.target.value)}
                  placeholder={t.ancestorUnknown}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white outline-none focus:border-fuchsia-400/60"
                />
                <input
                  value={node.morph}
                  onChange={(event) => updateAncestor(slot, "morph", event.target.value)}
                  placeholder={t.morph}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-fuchsia-400/60"
                />
                <input
                  value={node.genetics}
                  onChange={(event) => updateAncestor(slot, "genetics", event.target.value)}
                  placeholder={t.geneticsLabel}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-fuchsia-400/60"
                />
                <textarea
                  value={node.notes}
                  onChange={(event) => updateAncestor(slot, "notes", event.target.value)}
                  placeholder={t.ancestorNotes}
                  rows={2}
                  className="w-full resize-y rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-fuchsia-400/60"
                />
              </div>
            ) : (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {node.name || <span className="font-normal italic text-slate-600">{t.ancestorUnknown}</span>}
                </p>
                {node.morph && <p className="mt-0.5 text-[11px] text-slate-400">{node.morph}</p>}
                {node.genetics && (
                  <p className="mt-1 inline-flex items-start gap-1 text-[10px] text-emerald-300/90">
                    <Dna className="mt-0.5 h-3 w-3 shrink-0" />
                    {node.genetics}
                  </p>
                )}
                {node.notes && <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{node.notes}</p>}
              </>
            )}
          </div>
        </div>
        {nodeMedia.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {nodeMedia.map((item) => (
              <div key={item.id} className="group/ancestor-media relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                <a href={item.url} target="_blank" rel="noreferrer" title={item.filename} className="absolute inset-0">
                  {item.kind === "image" ? (
                    <Image src={item.url} alt={item.filename} fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-fuchsia-200"><Video className="h-4 w-4" /></span>
                  )}
                </a>
                {isOwner && (
                  <button
                    type="button"
                    aria-label={t.deleteMedia}
                    onClick={() => void deleteMedia(item)}
                    disabled={deletingMediaId === item.id}
                    className="absolute right-0.5 top-0.5 rounded bg-black/80 p-0.5 text-white opacity-100 sm:opacity-0 sm:group-hover/ancestor-media:opacity-100"
                  >
                    {deletingMediaId === item.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {isOwner && node.id && (
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 px-2 py-1.5 text-[10px] font-medium text-slate-400 transition hover:border-fuchsia-300/30 hover:text-fuchsia-200">
            {progress !== undefined ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.uploadProgress} {Math.round(progress)}%
              </>
            ) : (
              <>
                <ImagePlus className="h-3 w-3" />
                {t.uploadAncestorMedia}
              </>
            )}
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime"
              multiple
              disabled={progress !== undefined}
              onChange={(event) => {
                void uploadFiles(event.target.files, node.id);
                event.currentTarget.value = "";
              }}
            />
          </label>
        )}
      </article>
    );
  };

  const statusColor =
    gecko.status === "Available"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : gecko.status === "Hold"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : "border-rose-400/30 bg-rose-400/10 text-rose-200";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <BrandLogo href="/" size="sm" subtitle={t.detailPage} />
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-slate-900 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLanguage("it")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 ${lang === "it" ? "bg-fuchsia-500/20 text-fuchsia-100" : "text-slate-500 hover:text-white"}`}
              >
                IT
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 ${lang === "en" ? "bg-fuchsia-500/20 text-fuchsia-100" : "text-slate-500 hover:text-white"}`}
              >
                EN
              </button>
            </div>
            <select
              value={currency}
              onChange={(event) => {
                const next = event.target.value as CurrencyCode;
                setCurrency(next);
                window.localStorage.setItem("gecko.currency", next);
              }}
              className="rounded-xl border border-white/10 bg-slate-900 px-2.5 py-2 text-[11px] text-slate-300 outline-none"
              aria-label="Currency"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
            </select>
            {isOwner && (
              <Link href="/dashboard" className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 sm:inline-flex">
                {t.dashboard}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {t.backToCatalog}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
            xXSoulOfAresXx · specimen archive
          </span>
        </div>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)] lg:gap-7">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30">
            <div className="relative aspect-[4/3] min-h-[300px] overflow-hidden bg-black sm:aspect-[16/10] lg:min-h-[530px]">
              {selectedMedia?.kind === "video" ? (
                <video
                  key={selectedMedia.id}
                  src={selectedMedia.url}
                  controls
                  playsInline
                  className="h-full w-full object-contain"
                  poster={gecko.imageUrl}
                />
              ) : (
                <Image
                  src={mainImage}
                  alt={`${gecko.code} — ${gecko.morph}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-contain"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] backdrop-blur ${statusColor}`}>
                  {gecko.status === "Available" ? t.statusAvailable : gecko.status === "Hold" ? t.statusHold : t.statusSold}
                </span>
                {selectedMedia?.kind === "video" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
                    <Play className="h-3 w-3 fill-current" /> VIDEO
                  </span>
                )}
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-7 sm:left-7 sm:right-7">
                <div>
                  <p className="font-mono text-xs font-semibold tracking-widest text-fuchsia-200">{gecko.code}</p>
                  <h1 className="mt-1 text-2xl font-bold text-white drop-shadow sm:text-4xl">{gecko.morph}</h1>
                </div>
                <span className="text-xl font-bold text-white drop-shadow sm:text-3xl">
                  {formatPrice(gecko.priceEUR, currency)}
                </span>
              </div>
            </div>

            {publicMedia.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-white/5 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => setActiveMediaId(null)}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${activeMediaId === null ? "border-fuchsia-300 ring-1 ring-fuchsia-300/50" : "border-white/10 opacity-65 hover:opacity-100"}`}
                  aria-label={gecko.code}
                >
                  <Image src={gecko.imageUrl} alt={gecko.code} fill sizes="80px" className="object-cover" />
                </button>
                {publicMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaId(item.id)}
                    className={`group relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${activeMediaId === item.id ? "border-fuchsia-300 ring-1 ring-fuchsia-300/50" : "border-white/10 opacity-65 hover:opacity-100"}`}
                    aria-label={item.filename}
                  >
                    {item.kind === "video" ? (
                      <>
                        <video src={`${item.url}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                      </>
                    ) : (
                      <Image src={item.url} alt={item.filename} fill sizes="80px" className="object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[28px] border border-white/10 bg-slate-900/75 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
                <Egg className="h-4 w-4" />
                {t.specimenOverview}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{gecko.notes || "—"}</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.sex}</span>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {gecko.sex === "Male" ? t.sexMale : gecko.sex === "Female" ? t.sexFemale : t.sexUnsexed}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.weightLabel.replace(": ", "")}</span>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Scale className="h-3.5 w-3.5 text-fuchsia-300" /> {gecko.weightGrams} g
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.hatchDateLabel}</span>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Calendar className="h-3.5 w-3.5 text-fuchsia-300" /> {displayDate(gecko.hatchDate, lang)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.dietLabel}</span>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-white">{gecko.diet || "—"}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-fuchsia-300/10 bg-fuchsia-300/[0.04] p-4">
                <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-fuchsia-200">
                  <Dna className="h-4 w-4" />
                  {t.sireDamLine}
                </p>
                <p className="text-xs text-slate-400"><span className="text-slate-500">{t.sire}: </span>{gecko.sire || "—"}</p>
                <p className="mt-1.5 text-xs text-slate-400"><span className="text-slate-500">{t.dam}: </span>{gecko.dam || "—"}</p>
              </div>
              {isOwner && (
                <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3 text-[10px] leading-relaxed text-emerald-100/70">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-300" />
                  {t.mediaStorageHint}
                </div>
              )}
            </section>

            {isOwner && (
              <section className="rounded-[28px] border border-white/10 bg-slate-900/75 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{t.mediaGallery}</h2>
                    <p className="mt-1 text-[10px] text-slate-500">{t.mediaUploadHint}</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/15">
                    {rootProgress !== undefined ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {Math.round(rootProgress)}%
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        {t.uploadMedia}
                      </>
                    )}
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime"
                      multiple
                      disabled={rootProgress !== undefined}
                      onChange={(event) => {
                        void uploadFiles(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </section>
            )}
          </aside>
        </section>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-slate-900/50 p-4 sm:p-6 lg:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-300">
                <Dna className="h-4 w-4" /> xXSoulOfAresXx · genetics archive
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">{t.pedigreeTitle}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {lang === "it"
                  ? "Tre generazioni: genitori, nonni e bisnonni, con foto e genetica per ogni linea."
                  : "Three generations: parents, grandparents and great-grandparents, with photos and genetics for every branch."}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {editingPedigree ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAncestors(savedAncestors);
                        setEditingPedigree(false);
                      }}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5"
                    >
                      {t.cancelEdit}
                    </button>
                    <button
                      type="button"
                      onClick={() => void savePedigree()}
                      disabled={savingPedigree}
                      className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
                    >
                      {savingPedigree ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {savingPedigree ? t.savingPedigree : t.savePedigree}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAncestors(savedAncestors.map((node) => ({ ...node })));
                      setEditingPedigree(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-300/15"
                  >
                    <Dna className="h-3.5 w-3.5" />
                    {t.editPedigree}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(220px,0.8fr)_auto_minmax(300px,1.05fr)_auto_minmax(360px,1.3fr)]">
            <section className="space-y-3">
              <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.04] px-3 py-2.5">
                <h3 className="text-xs font-bold text-fuchsia-100">{t.generationOne}</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">{gecko.code} · {gecko.morph}</p>
              </div>
              {renderNode("sire")}
              <div className="flex justify-center text-fuchsia-300/50"><span className="h-6 w-px bg-gradient-to-b from-fuchsia-400/40 to-transparent" /></div>
              {renderNode("dam")}
            </section>

            <div className="hidden items-center justify-center pt-20 text-fuchsia-300/50 xl:flex">
              <ArrowRight className="h-5 w-5" />
            </div>

            <section className="space-y-3">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2.5">
                <h3 className="text-xs font-bold text-cyan-100">{t.generationTwo}</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">{t.paternalLine} · {t.maternalLine}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/15 p-2.5">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/70">{t.paternalLine}</p>
                <div className="space-y-2">{renderNode("paternalSire")}{renderNode("paternalDam")}</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/15 p-2.5">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/70">{t.maternalLine}</p>
                <div className="space-y-2">{renderNode("maternalSire")}{renderNode("maternalDam")}</div>
              </div>
            </section>

            <div className="hidden items-center justify-center pt-20 text-fuchsia-300/50 xl:flex">
              <ArrowRight className="h-5 w-5" />
            </div>

            <section className="space-y-3">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] px-3 py-2.5">
                <h3 className="text-xs font-bold text-emerald-100">{t.generationThree}</h3>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {lang === "it" ? "8 antenati · 4 linee" : "8 ancestors · 4 branches"}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {GREAT_GRANDPARENT_GROUPS.map((group) => {
                  const branch = ancestorMap.get(group.parent);
                  return (
                    <div key={group.parent} className="rounded-2xl border border-white/5 bg-black/15 p-2.5">
                      <p className="mb-2 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200/70">
                        {lang === "it" ? group.titleIt : group.titleEn}
                        {branch?.name ? <span className="ml-1 normal-case tracking-normal text-slate-500">· {branch.name}</span> : null}
                      </p>
                      <div className="space-y-2">{group.slots.map(renderNode)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-white/5 bg-black/20 p-3 text-[10px] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
            {lang === "it"
              ? "I campi non compilati restano volutamente vuoti: inserisci solo dati genealogici documentati. Le foto caricate su ogni scheda restano associate al relativo antenato."
              : "Unfilled fields are intentionally blank: enter only documented pedigree information. Photos uploaded on each card remain attached to that ancestor."}
          </div>
        </section>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-slate-900/50 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <ImagePlus className="h-4 w-4 text-fuchsia-300" /> {t.mediaGallery}
              </h2>
              <p className="mt-1 text-[10px] text-slate-500">{publicMedia.length} {lang === "it" ? "file" : "files"}</p>
            </div>
            {isOwner && rootProgress !== undefined && (
              <span className="text-xs text-fuchsia-200">{t.uploadProgress} {Math.round(rootProgress)}%</span>
            )}
          </div>
          {publicMedia.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 py-10 text-center">
              <ImagePlus className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-xs text-slate-400">{t.noMedia}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {publicMedia.map((item) => (
                <article key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black">
                  {item.kind === "video" ? (
                    <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                  ) : (
                    <Image src={item.url} alt={item.filename} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                    <span className="max-w-[80%] truncate text-[10px] text-white/80">{item.filename}</span>
                    {item.kind === "video" && <Video className="h-3.5 w-3.5 text-fuchsia-200" />}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => void deleteMedia(item)}
                      disabled={deletingMediaId === item.id}
                      aria-label={t.deleteMedia}
                      className="absolute right-2 top-2 rounded-lg border border-white/10 bg-black/70 p-2 text-slate-300 opacity-100 transition hover:bg-rose-500/80 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      {deletingMediaId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5 text-[10px] text-slate-600">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> xXSoulOfAresXx · Correlophus ciliatus</span>
          <Link href="/" className="text-slate-400 hover:text-white">{t.backToCatalog}</Link>
        </footer>
      </main>
    </div>
  );
}
