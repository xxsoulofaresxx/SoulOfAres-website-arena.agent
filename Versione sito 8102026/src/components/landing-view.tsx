"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Dna, LayoutDashboard, MessagesSquare } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { EXCHANGE_RATES } from "@/lib/i18n";
import type { CurrencyCode, Lang } from "@/lib/i18n";

const COPY = {
  it: {
    tagline: "Selected breeding · Certified pedigree",
    title: "xXSoulOfAresXx",
    description:
      "Scopri gechi ciliati con genealogia trasparente, note di allevamento e contatto diretto con l'allevatore.",
    explore: "Esplora il catalogo",
    start: "Inizia la tua collezione",
    cards: [
      {
        title: "Conosci la genealogia",
        tone: "border-fuchsia-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(255,47,208,0.7)]",
      },
      {
        title: "Tutti i dati di allevamento insieme",
        tone: "border-cyan-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(34,211,238,0.7)]",
      },
      {
        title: "Parla direttamente con l'allevatore",
        tone: "border-lime-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(163,230,53,0.7)]",
      },
    ],
    footerNote:
      "Catalogo pubblico · area allevatore protetta da password · foto e video fino a 100 MB",
    heroAlt: "Logo neon di xXSoulOfAresXx con geco ciliato",
    statsLabel: "Esemplari in catalogo",
  },
  en: {
    tagline: "Selected breeding · Certified pedigree",
    title: "xXSoulOfAresXx",
    description:
      "Discover crested geckos with transparent lineage, husbandry notes and direct contact with the breeder.",
    explore: "Explore the catalog",
    start: "Start your collection",
    cards: [
      {
        title: "Know the lineage",
        tone: "border-fuchsia-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(255,47,208,0.7)]",
      },
      {
        title: "Every husbandry record in one place",
        tone: "border-cyan-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(34,211,238,0.7)]",
      },
      {
        title: "Talk directly with the breeder",
        tone: "border-lime-400/40",
        glow: "shadow-[0_0_36px_-18px_rgba(163,230,53,0.7)]",
      },
    ],
    footerNote:
      "Public catalog · password-protected breeder area · photos and videos up to 100 MB",
    heroAlt: "xXSoulOfAresXx neon crested gecko logo",
    statsLabel: "Specimens in catalog",
  },
} as const;

const CARD_ICONS = [Dna, LayoutDashboard, MessagesSquare];

export default function LandingView({ specimenCount }: { specimenCount: number }) {
  const [lang, setLang] = useState<Lang>("it");
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");

  useEffect(() => {
    // Restoring saved preferences after paint keeps the server-rendered markup
    // stable and avoids a cascading re-render during the effect body.
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedLang = window.localStorage.getItem("gecko.lang");
        if (storedLang === "it" || storedLang === "en") setLang(storedLang);
        const storedCurrency = window.localStorage.getItem("gecko.currency");
        if (storedCurrency && storedCurrency in EXCHANGE_RATES) {
          setCurrency(storedCurrency as CurrencyCode);
        }
      } catch {
        /* storage can be unavailable; defaults are fine */
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateLang = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem("gecko.lang", next);
  };

  const updateCurrency = (next: CurrencyCode) => {
    setCurrency(next);
    window.localStorage.setItem("gecko.currency", next);
  };

  const copy = COPY[lang];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070b] text-slate-100">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 28%, rgba(176,38,255,0.22), transparent 70%)",
        }}
      />
      <div className="relative">
        <SiteHeader
          lang={lang}
          currency={currency}
          active="home"
          onLangChange={updateLang}
          onCurrencyChange={updateCurrency}
        />

        <main className="mx-auto max-w-[1180px] px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <section className="flex flex-col items-center text-center">
            <div className="relative rounded-[28px] bg-black p-2 shadow-[0_0_120px_-30px_rgba(255,47,208,0.55)] ring-1 ring-white/10">
              <div className="relative h-[260px] w-[260px] overflow-hidden rounded-[22px] sm:h-[320px] sm:w-[320px]">
                <Image
                  src="/images/logo-neon.png"
                  alt={copy.heroAlt}
                  fill
                  priority
                  sizes="(max-width: 640px) 260px, 320px"
                  className="object-cover"
                />
              </div>
            </div>

            <h1 className="mt-9 font-serif text-5xl font-bold tracking-tight text-fuchsia-300 sm:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-fuchsia-200/80 sm:text-xs">
              {copy.tagline}
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {copy.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                {copy.explore}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                {copy.start}
              </Link>
            </div>

            <p className="mt-8 text-xs text-slate-500">
              {copy.statsLabel}: <span className="font-semibold text-slate-300">{specimenCount}</span>
            </p>
          </section>

          <section className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
            {copy.cards.map((card, index) => {
              const Icon = CARD_ICONS[index];
              return (
                <article
                  key={card.title}
                  className={`rounded-2xl border bg-[#0b0b11]/80 p-6 text-left ${card.tone} ${card.glow} transition hover:-translate-y-1`}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-5 font-serif text-xl font-bold text-white">{card.title}</h2>
                </article>
              );
            })}
          </section>

          <p className="mt-12 text-center text-xs text-slate-500">{copy.footerNote}</p>
        </main>
      </div>
    </div>
  );
}
