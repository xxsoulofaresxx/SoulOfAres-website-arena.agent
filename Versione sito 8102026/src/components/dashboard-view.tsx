"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Dna,
  Inbox,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  LogOut,
  Mail,
  Check,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { TRANSLATIONS, formatPrice } from "@/lib/i18n";
import type { CurrencyCode, Lang } from "@/lib/i18n";
import type { CatalogStats } from "@/lib/data";
import type { GeckoSpecimen, InquiryRecord, InquiryStatus } from "@/lib/types";
import BrandLogo from "@/components/brand-logo";

interface Props {
  initialGeckos: GeckoSpecimen[];
  initialInquiries: InquiryRecord[];
  stats: CatalogStats;
}

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Hold: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Sold: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

const INQUIRY_STYLES: Record<string, string> = {
  New: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  Replied: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Closed: "bg-slate-600/30 text-slate-300 border-white/20",
};

export default function DashboardView({
  initialGeckos,
  initialInquiries,
  stats,
}: Props) {
  const router = useRouter();
  const [geckos, setGeckos] = useState(initialGeckos);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [lang, setLang] = useState<Lang>("it");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      const storedLang = window.localStorage.getItem("gecko.lang");
      if (storedLang === "it" || storedLang === "en") setLang(storedLang);
      const storedCur = window.localStorage.getItem("gecko.currency");
      if (storedCur === "EUR" || storedCur === "USD" || storedCur === "GBP") {
        setCurrency(storedCur);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLangAndStore = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem("gecko.lang", next);
  };

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  };

  const patchGecko = async (
    gecko: GeckoSpecimen,
    body: Record<string, unknown>,
    message: string,
  ) => {
    setBusyId(gecko.id);
    try {
      const res = await fetch(`/api/geckos/${gecko.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = (await res.json()) as { gecko: GeckoSpecimen };
      setGeckos((prev) => prev.map((g) => (g.id === data.gecko.id ? data.gecko : g)));
      toast.success(message);
    } catch {
      toast.error(t.statusError);
    } finally {
      setBusyId(null);
    }
  };

  const removeGecko = async (gecko: GeckoSpecimen) => {
    if (!window.confirm(`${t.delete} ${gecko.code}?`)) return;
    setBusyId(gecko.id);
    try {
      const res = await fetch(`/api/geckos/${gecko.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setGeckos((prev) => prev.filter((g) => g.id !== gecko.id));
      toast.success(`${gecko.code} — ${t.deleted}`);
    } catch {
      toast.error(t.statusError);
    } finally {
      setBusyId(null);
    }
  };

  const patchInquiry = async (id: string, status: InquiryStatus) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = (await res.json()) as { inquiry: InquiryRecord };
      setInquiries((prev) => prev.map((i) => (i.id === id ? data.inquiry : i)));
      toast.success(`${data.inquiry.geckoCode} — ${status}`);
    } catch {
      toast.error(t.statusError);
    } finally {
      setBusyId(null);
    }
  };

  const inventoryValue = useMemo(
    () =>
      geckos
        .filter((g) => g.status !== "Sold")
        .reduce((sum, g) => sum + g.priceEUR, 0),
    [geckos],
  );

  const statCards = [
    { label: t.totalGeckos, value: String(stats.total), tone: "text-emerald-400" },
    { label: t.forSale, value: String(stats.available), tone: "text-blue-400" },
    { label: t.onHold, value: String(stats.hold), tone: "text-amber-400" },
    { label: t.soldOut, value: String(stats.sold), tone: "text-rose-400" },
    {
      label: t.newInquiries,
      value: String(inquiries.filter((i) => i.status === "New").length),
      tone: "text-sky-400",
    },
  ];

  const inputClass =
    "bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo href="/" size="sm" subtitle={t.dashboardTitle} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setLangAndStore("it")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  lang === "it" ? "bg-emerald-500 text-white" : "text-slate-400"
                }`}
              >
                IT
              </button>
              <button
                onClick={() => setLangAndStore("en")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  lang === "en" ? "bg-emerald-500 text-white" : "text-slate-400"
                }`}
              >
                EN
              </button>
            </div>
            <Link
              href="/dashboard/add-gecko"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.addGecko}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.backToCatalog}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-4"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {card.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </section>

        <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Valore inventario attivo:{" "}
            <strong className="text-white">{formatPrice(inventoryValue, currency)}</strong>
          </span>
          <span className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.breederModeOn}
          </span>
        </section>

        {/* Inventory */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">
              {t.inventory}
            </h2>
            <span className="text-xs text-slate-500">{geckos.length}</span>
          </div>

          <div className="divide-y divide-white/5">
            {geckos.map((gecko) => (
              <div
                key={gecko.id}
                className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <Image
                  src={gecko.imageUrl}
                  alt={gecko.code}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/geckos/${gecko.id}`}
                      className="font-mono text-xs font-bold text-emerald-400 hover:underline"
                    >
                      {gecko.code}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase ${
                        STATUS_STYLES[gecko.status]
                      }`}
                    >
                      {gecko.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {gecko.morph}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                    <Dna className="w-3 h-3" />
                    {gecko.sire} × {gecko.dam} · {gecko.weightGrams}g ·{" "}
                    {gecko.hatchDate}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={priceDraft[gecko.id] ?? String(gecko.priceEUR)}
                      onChange={(e) =>
                        setPriceDraft((prev) => ({
                          ...prev,
                          [gecko.id]: e.target.value,
                        }))
                      }
                      className={`${inputClass} w-20`}
                      aria-label={t.editPrice}
                    />
                    <span className="text-[10px] text-slate-500">EUR</span>
                    <button
                      onClick={() =>
                        patchGecko(
                          gecko,
                          { priceEUR: Number(priceDraft[gecko.id] ?? gecko.priceEUR) },
                          t.saved,
                        )
                      }
                      className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300 hover:bg-white/10 cursor-pointer"
                    >
                      {t.save}
                    </button>
                  </div>

                  <div className="flex gap-1">
                    {(["Available", "Hold", "Sold"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          patchGecko(gecko, { status }, `${gecko.code} — ${status}`)
                        }
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                          gecko.status === status
                            ? STATUS_STYLES[status]
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {status === "Available"
                          ? t.statusAvailable
                          : status === "Hold"
                            ? t.statusHold
                            : t.statusSold}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => removeGecko(gecko)}
                    disabled={busyId === gecko.id}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
                    aria-label={t.delete}
                  >
                    {busyId === gecko.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {geckos.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {t.noResults}
              </p>
            )}
          </div>
        </section>

        {/* Inquiries */}
        <section className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider inline-flex items-center gap-2">
              <Inbox className="w-4 h-4 text-sky-400" />
              {t.inquiries}
            </h2>
            <span className="text-xs text-slate-500">{inquiries.length}</span>
          </div>

          <div className="divide-y divide-white/5">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase ${
                      INQUIRY_STYLES[inquiry.status]
                    }`}
                  >
                    {inquiry.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {inquiry.geckoCode}
                  </span>
                  <span className="text-xs text-slate-400">{inquiry.geckoMorph}</span>
                  <span className="text-[11px] text-slate-600 uppercase">
                    {inquiry.locale}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {new Date(inquiry.createdAt).toLocaleString(
                      inquiry.locale === "en" ? "en-GB" : "it-IT",
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-100">{inquiry.name}</span>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="inline-flex items-center gap-1 text-sky-300 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {inquiry.email}
                  </a>
                </div>

                {inquiry.message && (
                  <p className="text-xs text-slate-400 bg-slate-950/70 border border-white/5 rounded-xl p-3">
                    {inquiry.message}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {inquiry.status !== "Replied" && (
                    <button
                      onClick={() => patchInquiry(inquiry.id, "Replied")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium hover:bg-emerald-500/25 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.markReplied}
                    </button>
                  )}
                  {inquiry.status !== "Closed" && (
                    <button
                      onClick={() => patchInquiry(inquiry.id, "Closed")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium hover:bg-white/10 cursor-pointer"
                    >
                      {t.markClosed}
                    </button>
                  )}
                  {inquiry.status !== "New" && (
                    <button
                      onClick={() => patchInquiry(inquiry.id, "New")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[11px] font-medium hover:bg-white/10 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.reopen}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {inquiries.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {t.noInquiries}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
