"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Search,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Scale,
  Dna,
  X,
  Send,
  Calendar,
  SlidersHorizontal,
  Loader2,
  Egg,
} from "lucide-react";
import { toast } from "sonner";
import { EXCHANGE_RATES, TRANSLATIONS, formatPrice } from "@/lib/i18n";
import type { CurrencyCode, Lang } from "@/lib/i18n";
import type { GeckoSpecimen, GeckoStatus } from "@/lib/types";
import BrandLogo, { FullBrandLogo } from "@/components/brand-logo";
import SiteHeader from "@/components/site-header";

interface Props {
  initialGeckos: GeckoSpecimen[];
  isOwner?: boolean;
}

const MORPH_IMAGE_OPTIONS = [
  { value: "/images/lilly-white.jpg", label: "Lilly White" },
  { value: "/images/frappuccino.jpg", label: "Frappuccino" },
  { value: "/images/axanthic.jpg", label: "Axanthic" },
  { value: "/images/superstripe.jpg", label: "Superstripe / Harlequin" },
];

const FAV_KEY = "gecko.favorites";
const LANG_KEY = "gecko.lang";
const CUR_KEY = "gecko.currency";

export default function GeckoMarketplace({
  initialGeckos,
  isOwner = false,
}: Props) {
  const [geckos, setGeckos] = useState<GeckoSpecimen[]>(initialGeckos);
  const [lang, setLang] = useState<Lang>("it");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMorph, setSelectedMorph] = useState("all");
  const [selectedSex, setSelectedSex] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [selectedGeckoForPedigree, setSelectedGeckoForPedigree] =
    useState<GeckoSpecimen | null>(null);
  const [inquireGecko, setInquireGecko] = useState<GeckoSpecimen | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMsg, setInquiryMsg] = useState("");

  const t = TRANSLATIONS[lang];

  /* ---------- persisted client preferences ---------- */
  useEffect(() => {
    try {
      const storedFav = window.localStorage.getItem(FAV_KEY);
      if (storedFav) setFavorites(JSON.parse(storedFav) as string[]);
      const storedLang = window.localStorage.getItem(LANG_KEY);
      if (storedLang === "it" || storedLang === "en") setLang(storedLang);
      const storedCur = window.localStorage.getItem(CUR_KEY);
      if (storedCur && storedCur in EXCHANGE_RATES) {
        setCurrency(storedCur as CurrencyCode);
      }
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
    window.localStorage.setItem(CUR_KEY, currency);
  }, [lang, currency]);

  /* ---------- helpers ---------- */
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        toast.info(t.favoriteRemoved);
        return prev.filter((fav) => fav !== id);
      }
      toast.success(t.favoriteAdded);
      return [...prev, id];
    });
  };

  const changeStatus = useCallback(
    async (gecko: GeckoSpecimen, status: GeckoStatus) => {
      if (gecko.status === status) return;
      const previous = geckos;
      setGeckos((prev) =>
        prev.map((g) => (g.id === gecko.id ? { ...g, status } : g)),
      );
      setPendingStatus(`${gecko.id}:${status}`);
      try {
        const res = await fetch(`/api/geckos/${gecko.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("patch failed");
        const data = (await res.json()) as { gecko: GeckoSpecimen };
        setGeckos((prev) =>
          prev.map((g) => (g.id === data.gecko.id ? data.gecko : g)),
        );
        toast.success(`${data.gecko.code} — ${t.statusUpdated}`);
      } catch {
        setGeckos(previous);
        toast.error(t.statusError);
      } finally {
        setPendingStatus(null);
      }
    },
    [geckos, t.statusError, t.statusUpdated],
  );

  const morphOptions = useMemo(() => {
    const set = new Set<string>();
    geckos.forEach((g) => {
      g.morph
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((token) => set.add(token));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [geckos]);

  const filteredGeckos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = geckos.filter((g) => {
      const matchesSearch =
        query.length === 0 ||
        g.code.toLowerCase().includes(query) ||
        g.morph.toLowerCase().includes(query) ||
        g.notes.toLowerCase().includes(query) ||
        g.sire.toLowerCase().includes(query) ||
        g.dam.toLowerCase().includes(query);
      const matchesMorph =
        selectedMorph === "all" ||
        g.morph.toLowerCase().includes(selectedMorph.toLowerCase());
      const matchesSex = selectedSex === "all" || g.sex === selectedSex;
      const matchesStatus =
        selectedStatus === "all" || g.status === selectedStatus;
      const matchesFav = !onlyFavorites || favorites.includes(g.id);
      return matchesSearch && matchesMorph && matchesSex && matchesStatus && matchesFav;
    });

    return list.sort((a, b) => {
      if (sortBy === "price-asc") return a.priceEUR - b.priceEUR;
      if (sortBy === "price-desc") return b.priceEUR - a.priceEUR;
      if (sortBy === "weight-desc") return b.weightGrams - a.weightGrams;
      if (sortBy === "newest") return b.hatchDate.localeCompare(a.hatchDate);
      if (sortBy === "favorites") {
        const aFav = favorites.includes(a.id) ? 0 : 1;
        const bFav = favorites.includes(b.id) ? 0 : 1;
        return aFav - bFav;
      }
      return a.code.localeCompare(b.code);
    });
  }, [
    geckos,
    searchQuery,
    selectedMorph,
    selectedSex,
    selectedStatus,
    sortBy,
    onlyFavorites,
    favorites,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMorph("all");
    setSelectedSex("all");
    setSelectedStatus("all");
    setSortBy("default");
    setOnlyFavorites(false);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquireGecko) return;
    setSendingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geckoId: inquireGecko.id,
          name: inquiryName,
          email: inquiryEmail,
          message: inquiryMsg,
          locale: lang,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t.inquiryError);
        return;
      }
      toast.success(t.inquirySuccess);
      setInquireGecko(null);
      setInquiryMsg("");
      setInquiryName("");
      setInquiryEmail("");
    } catch {
      toast.error(t.inquiryError);
    } finally {
      setSendingInquiry(false);
    }
  };

  const totalCount = geckos.length;
  const availableCount = geckos.filter((g) => g.status === "Available").length;
  const onHoldCount = geckos.filter((g) => g.status === "Hold").length;
  const soldCount = geckos.filter((g) => g.status === "Sold").length;

  const inputClass =
    "w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header */}
      <SiteHeader
        lang={lang}
        currency={currency}
        active="catalog"
        onLangChange={setLang}
        onCurrencyChange={(next) => setCurrency(next)}
      />

      {/* 2. Breeder stats bar */}
      <section className="bg-slate-900/60 border-b border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">{t.adminBarTitle}:</span>
            <span className="font-semibold text-white">
              {t.totalGeckos}:{" "}
              <strong className="text-emerald-400">{totalCount}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white">
              {t.forSale}:{" "}
              <strong className="text-blue-400">{availableCount}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white">
              {t.onHold}: <strong className="text-amber-400">{onHoldCount}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white">
              {t.soldOut}: <strong className="text-rose-400">{soldCount}</strong>
            </span>
          </div>

          {isOwner && (
            <Link
              href="/dashboard/add-gecko"
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl font-medium text-xs transition-colors"
            >
              + {t.addGecko}
            </Link>
          )}
        </div>
      </section>

      {/* 3. Filters */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {t.morph}
              </label>
              <select
                value={selectedMorph}
                onChange={(e) => setSelectedMorph(e.target.value)}
                className={inputClass}
              >
                <option value="all">{t.filterMorph}</option>
                {morphOptions.map((morph) => (
                  <option key={morph} value={morph}>
                    {morph}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {t.sex}
              </label>
              <select
                value={selectedSex}
                onChange={(e) => setSelectedSex(e.target.value)}
                className={inputClass}
              >
                <option value="all">{t.filterSex}</option>
                <option value="Male">{t.sexMale}</option>
                <option value="Female">{t.sexFemale}</option>
                <option value="Unsexed">{t.sexUnsexed}</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {t.filterStatus}
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={inputClass}
              >
                <option value="all">{t.filterStatus}</option>
                <option value="Available">{t.statusAvailable}</option>
                <option value="Hold">{t.statusHold}</option>
                <option value="Sold">{t.statusSold}</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                {t.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={inputClass}
              >
                <option value="default">{t.sortSelect}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
                <option value="weight-desc">{t.sortWeightDesc}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="favorites">{t.sortFavorites}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <button
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-colors cursor-pointer ${
                onlyFavorites
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-rose-400" : ""}`} />
              {t.favorites} ({favorites.length})
            </button>
            <span className="text-slate-500">
              {filteredGeckos.length} {t.resultsCount}
            </span>
            <button
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t.resetFilters}
            </button>
          </div>
        </div>

        {/* 4. Catalog grid */}
        {filteredGeckos.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-2xl bg-slate-900/50 py-16 text-center space-y-3">
            <Egg className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-medium">{t.noResults}</p>
            <p className="text-slate-500 text-sm">{t.noResultsHint}</p>
            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGeckos.map((gecko) => {
              const isFav = favorites.includes(gecko.id);
              const busy = pendingStatus?.startsWith(gecko.id) ?? false;

              return (
                <div
                  key={gecko.id}
                  className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col group shadow-lg"
                >
                  <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
                    <Link
                      href={`/geckos/${gecko.id}`}
                      aria-label={`${t.viewDetails}: ${gecko.code}`}
                      className="absolute inset-0 z-0"
                    >
                      <Image
                        src={gecko.imageUrl}
                        alt={`${gecko.code} - ${gecko.morph}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${
                          gecko.status === "Available"
                            ? "bg-emerald-500/80 text-white"
                            : gecko.status === "Hold"
                              ? "bg-amber-500/80 text-white"
                              : "bg-rose-500/80 text-white"
                        }`}
                      >
                        {gecko.status === "Available"
                          ? t.statusAvailable
                          : gecko.status === "Hold"
                            ? t.statusHold
                            : t.statusSold}
                      </span>
                      {busy && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/70 text-[10px] text-slate-300 backdrop-blur-md">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          ...
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleFavorite(gecko.id)}
                      aria-label={t.favorites}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/60 backdrop-blur-md flex items-center justify-center text-white hover:text-rose-400 hover:scale-110 transition-all cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? "fill-rose-500 text-rose-500" : "text-white"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm font-bold text-emerald-400">
                          <Link href={`/geckos/${gecko.id}`} className="hover:text-emerald-300 hover:underline">
                            {gecko.code}
                          </Link>
                        </h3>
                        <span className="text-xl font-bold text-white">
                          {formatPrice(gecko.priceEUR, currency)}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-100 mt-0.5">
                        {gecko.morph}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-slate-400">
                        <div>
                          <span>{t.sexLabel}</span>
                          <strong className="text-slate-200">
                            {gecko.sex === "Male"
                              ? t.sexMale
                              : gecko.sex === "Female"
                                ? t.sexFemale
                                : t.sexUnsexed}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.weightLabel}</span>
                          <strong className="text-slate-200">
                            {gecko.weightGrams}g
                          </strong>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 text-[11px] truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{t.hatchLabel}</span>
                          <span className="text-slate-300">{gecko.hatchDate}</span>
                        </div>
                        <div className="col-span-2 text-[11px] truncate">
                          <span className="text-slate-500">Sire: </span>
                          <span className="text-slate-300">{gecko.sire}</span>
                        </div>
                        <div className="col-span-2 text-[11px] truncate">
                          <span className="text-slate-500">Dam: </span>
                          <span className="text-slate-300">{gecko.dam}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedGeckoForPedigree(gecko)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Dna className="w-3.5 h-3.5 text-emerald-400" />
                          {t.pedigreeBtn}
                        </button>
                        <button
                          onClick={() => setInquireGecko(gecko)}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {t.inquireBtn}
                        </button>
                      </div>
                      <Link
                        href={`/geckos/${gecko.id}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 px-3 py-2 text-xs font-semibold text-fuchsia-200 transition-colors hover:border-fuchsia-300/40 hover:bg-fuchsia-400/10"
                      >
                        {t.viewDetails}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>

                      {isOwner && (
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-500">
                          <span>Cambia stato:</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => changeStatus(gecko, "Available")}
                              className={`px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer ${
                                gecko.status === "Available" ? "ring-1 ring-emerald-400" : ""
                              }`}
                            >
                              Avail
                            </button>
                            <button
                              onClick={() => changeStatus(gecko, "Hold")}
                              className={`px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer ${
                                gecko.status === "Hold" ? "ring-1 ring-amber-400" : ""
                              }`}
                            >
                              Hold
                            </button>
                            <button
                              onClick={() => changeStatus(gecko, "Sold")}
                              className={`px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer ${
                                gecko.status === "Sold" ? "ring-1 ring-rose-400" : ""
                              }`}
                            >
                              Sold
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500/70" />
            xXSoulOfAresXx · Correlophus ciliatus — captive bred, crescita
            registrata e genetica certificata.
          </span>
          <Link
            href="/care-guide"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
          >
            {t.careGuide}
          </Link>
        </div>
      </main>

      {/* 5. Pedigree modal */}
      {selectedGeckoForPedigree && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedGeckoForPedigree(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">{t.pedigreeTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedGeckoForPedigree(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-emerald-400 font-mono font-bold text-sm">
                  {selectedGeckoForPedigree.code} — {selectedGeckoForPedigree.morph}
                </p>
                <p className="text-slate-400 mt-1">{selectedGeckoForPedigree.notes}</p>
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400">
                  <span>
                    {t.hatchDateLabel}:{" "}
                    <strong className="text-slate-200">
                      {selectedGeckoForPedigree.hatchDate}
                    </strong>
                  </span>
                  <span>
                    {t.weightLabel}
                    <strong className="text-slate-200">
                      {selectedGeckoForPedigree.weightGrams}g
                    </strong>
                  </span>
                  <span>
                    Prezzo:{" "}
                    <strong className="text-slate-200">
                      {formatPrice(selectedGeckoForPedigree.priceEUR, currency)}
                    </strong>
                  </span>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {t.sireDamLine}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                    {t.sire}
                  </span>
                  <p className="font-medium text-slate-200 mt-1">
                    {selectedGeckoForPedigree.sire}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 space-y-1">
                    <span className="block">
                      {t.paternalSire}:{" "}
                      {selectedGeckoForPedigree.grandparents?.paternalSire ?? "—"}
                    </span>
                    <span className="block">
                      {t.paternalDam}:{" "}
                      {selectedGeckoForPedigree.grandparents?.paternalDam ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                    {t.dam}
                  </span>
                  <p className="font-medium text-slate-200 mt-1">
                    {selectedGeckoForPedigree.dam}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 space-y-1">
                    <span className="block">
                      {t.maternalSire}:{" "}
                      {selectedGeckoForPedigree.grandparents?.maternalSire ?? "—"}
                    </span>
                    <span className="block">
                      {t.maternalDam}:{" "}
                      {selectedGeckoForPedigree.grandparents?.maternalDam ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  {t.dietLabel}:
                </span>
                <p className="text-slate-300">{selectedGeckoForPedigree.diet}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedGeckoForPedigree(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* 6. Inquiry drawer */}
      {inquireGecko && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-white/10 w-full max-w-md h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-lg text-white">{t.drawerTitle}</h3>
              <button
                onClick={() => setInquireGecko(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex gap-3 items-center">
              <Image
                src={inquireGecko.imageUrl}
                alt={inquireGecko.code}
                width={56}
                height={56}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div>
                <h4 className="font-mono text-sm font-bold text-emerald-400">
                  {inquireGecko.code}
                </h4>
                <p className="text-xs text-slate-300">{inquireGecko.morph}</p>
                <p className="text-xs font-semibold text-white mt-1">
                  {formatPrice(inquireGecko.priceEUR, currency)}
                </p>
              </div>
              </div>

              <form onSubmit={handleSendInquiry} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">{t.fullName} *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder={lang === "it" ? "Mario Rossi" : "John Doe"}
                    className={inputClass}
                  />
                </div>

                <div>
                <label className="text-slate-400 block mb-1">{t.email} *</label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="mario@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t.notesLabel}</label>
                <textarea
                  rows={4}
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  placeholder={
                    lang === "it"
                      ? "Richiesta informazioni su consegna a Verona Reptiles o spedizione autorizzata..."
                      : "Inquiry on reptile expo handover or certified live courier shipping..."
                  }
                  className={inputClass}
                />
              </div>

              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 text-[11px] flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t.expoDelivery}</span>
              </div>

              <button
                type="submit"
                disabled={sendingInquiry}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {sendingInquiry ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sendingInquiry ? t.sending : t.sendInquiryBtn}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { MORPH_IMAGE_OPTIONS };
