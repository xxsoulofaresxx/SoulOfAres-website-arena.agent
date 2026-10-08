"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/brand-logo";
import { TRANSLATIONS } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default function LoginForm() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("it");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("gecko.lang");
      if (stored === "it" || stored === "en") setLang(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        if (response.status === 503) {
          toast.error(t.setupHint, { duration: 7000 });
        } else {
          toast.error(t.loginError);
        }
        return;
      }
      window.localStorage.setItem("gecko.lang", lang);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error(t.loginError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(217,70,239,0.14),transparent_55%)]" />
      <div className="relative w-full max-w-md space-y-7">
        <BrandLogo href="/" size="lg" subtitle={t.loginSubtitle} className="justify-center" />
        <section className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-fuchsia-950/20 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
                xXSoulOfAresXx
              </p>
              <h1 className="text-2xl font-bold text-white">{t.loginTitle}</h1>
            </div>
            <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="breeder-password"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                {t.passwordLabel}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="breeder-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-fuchsia-400/60"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || password.length === 0}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-fuchsia-600 via-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "…" : t.loginButton}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.backToCatalog}
            </Link>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLang("it")}
                className={`cursor-pointer rounded-md px-2 py-1 ${lang === "it" ? "bg-white/10 text-white" : "text-slate-500"}`}
              >
                IT
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`cursor-pointer rounded-md px-2 py-1 ${lang === "en" ? "bg-white/10 text-white" : "text-slate-500"}`}
              >
                EN
              </button>
            </div>
          </div>
        </section>
        <p className="text-center text-[11px] text-slate-600">
          Connessione privata e sessione protetta · Private breeder access
        </p>
      </div>
    </main>
  );
}
