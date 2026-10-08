"use client";

import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import type { CurrencyCode, Lang } from "@/lib/i18n";

interface SiteHeaderProps {
  lang: Lang;
  currency: CurrencyCode;
  active: "home" | "catalog" | "dashboard";
  onLangChange: (lang: Lang) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

const NAV_LABELS: Record<Lang, { catalog: string; dashboard: string; signIn: string; signUp: string }> = {
  it: { catalog: "Catalogo", dashboard: "Dashboard", signIn: "Accedi", signUp: "Registrati" },
  en: { catalog: "Catalog", dashboard: "Dashboard", signIn: "Sign in", signUp: "Sign up" },
};

const LANGUAGE_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "it", label: "Italiano (IT)" },
  { value: "en", label: "English (EN)" },
];

const CURRENCY_OPTIONS: Array<{ value: CurrencyCode; label: string }> = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
];

export default function SiteHeader({
  lang,
  currency,
  active,
  onLangChange,
  onCurrencyChange,
}: SiteHeaderProps) {
  const labels = NAV_LABELS[lang];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080c]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-fuchsia-400/30">
            <Image
              src="/images/logo-neon.png"
              alt="xXSoulOfAresXx"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-xl font-bold tracking-tight text-fuchsia-300 sm:text-[22px]">
              xXSoulOfAresXx
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Correlophus ciliatus
            </span>
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-5 text-sm sm:order-none sm:w-auto">
          <Link
            href="/catalogo"
            className={`transition-colors ${
              active === "catalog" ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            {labels.catalog}
          </Link>
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 transition-colors ${
              active === "dashboard" ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            {labels.dashboard}
          </Link>
        </nav>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/dashboard/login"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/50"
          >
            {labels.signIn}
          </Link>
          <Link
            href="/dashboard/login"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
          >
            {labels.signUp}
          </Link>

          <label className="sr-only" htmlFor="site-language">
            Language
          </label>
          <select
            id="site-language"
            value={lang}
            onChange={(event) => onLangChange(event.target.value as Lang)}
            className="rounded-full border border-emerald-400/40 bg-[#0b0b11] px-3 py-2 text-xs font-medium text-slate-200 outline-none transition hover:border-emerald-300/60"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="site-currency">
            Currency
          </label>
          <select
            id="site-currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
            className="rounded-full border border-white/15 bg-[#0b0b11] px-3 py-2 text-xs font-medium text-slate-200 outline-none transition hover:border-white/40"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className="h-[2px] w-full"
        style={{
          background:
            "linear-gradient(90deg, #ff2fd0 0%, #b026ff 28%, #22d3ee 62%, #a3e635 100%)",
        }}
      />
    </header>
  );
}
