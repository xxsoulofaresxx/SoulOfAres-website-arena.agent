"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bug, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TRANSLATIONS } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { MORPH_IMAGE_OPTIONS } from "@/components/gecko-marketplace";
import BrandLogo from "@/components/brand-logo";

interface FormState {
  code: string;
  morph: string;
  sex: "Male" | "Female" | "Unsexed";
  hatchDate: string;
  weightGrams: string;
  priceEUR: string;
  status: "Available" | "Hold" | "Sold";
  imageUrl: string;
  sire: string;
  dam: string;
  paternalSire: string;
  paternalDam: string;
  maternalSire: string;
  maternalDam: string;
  notes: string;
  diet: string;
}

const EMPTY_FORM: FormState = {
  code: "",
  morph: "",
  sex: "Unsexed",
  hatchDate: new Date().toISOString().slice(0, 10),
  weightGrams: "",
  priceEUR: "",
  status: "Available",
  imageUrl: "/images/lilly-white.jpg",
  sire: "",
  dam: "",
  paternalSire: "",
  paternalDam: "",
  maternalSire: "",
  maternalDam: "",
  notes: "",
  diet: "Pangaea + grilli spolverati calcio/D3",
};

export default function AddGeckoForm() {
  const [lang, setLang] = useState<Lang>("it");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("gecko.lang");
      if (stored === "it" || stored === "en") setLang(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/geckos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightGrams: Number(form.weightGrams || 0),
          priceEUR: Number(form.priceEUR || 0),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t.createError);
        return;
      }
      const data = (await res.json()) as { gecko: { code: string } };
      toast.success(`${data.gecko.code} — ${t.created}`);
      setForm({ ...EMPTY_FORM, imageUrl: form.imageUrl });
    } catch {
      toast.error(t.createError);
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors";
  const label = "text-slate-400 block mb-1 text-xs font-medium";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo href="/" size="sm" subtitle={t.addGeckoTitle} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setLang("it");
                  window.localStorage.setItem("gecko.lang", "it");
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  lang === "it" ? "bg-emerald-500 text-white" : "text-slate-400"
                }`}
              >
                IT
              </button>
              <button
                onClick={() => {
                  setLang("en");
                  window.localStorage.setItem("gecko.lang", "en");
                }}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  lang === "en" ? "bg-emerald-500 text-white" : "text-slate-400"
                }`}
              >
                EN
              </button>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t.codeLabel}</label>
              <input
                required
                value={form.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="CG-2025-01"
                className={field}
              />
            </div>
            <div>
              <label className={label}>{t.morphLabel}</label>
              <input
                required
                value={form.morph}
                onChange={(e) => update("morph", e.target.value)}
                placeholder="Lilly White 66% Het Axanthic"
                className={field}
              />
            </div>
            <div>
              <label className={label}>{t.sex}</label>
              <select
                value={form.sex}
                onChange={(e) =>
                  update("sex", e.target.value as FormState["sex"])
                }
                className={field}
              >
                <option value="Unsexed">{t.sexUnsexed}</option>
                <option value="Male">{t.sexMale}</option>
                <option value="Female">{t.sexFemale}</option>
              </select>
            </div>
            <div>
              <label className={label}>{t.status}</label>
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as FormState["status"])
                }
                className={field}
              >
                <option value="Available">{t.statusAvailable}</option>
                <option value="Hold">{t.statusHold}</option>
                <option value="Sold">{t.statusSold}</option>
              </select>
            </div>
            <div>
              <label className={label}>{t.hatchDateLabelShort}</label>
              <input
                required
                type="date"
                value={form.hatchDate}
                onChange={(e) => update("hatchDate", e.target.value)}
                className={field}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>{t.weightShort}</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightGrams}
                  onChange={(e) => update("weightGrams", e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={label}>{t.priceShort}</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.priceEUR}
                  onChange={(e) => update("priceEUR", e.target.value)}
                  className={field}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={label}>{t.imageUrlLabel}</label>
            <div className="flex gap-3 items-start">
              <Image
                src={form.imageUrl}
                alt="preview"
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-xl object-cover border border-white/10 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="/images/lilly-white.jpg"
                  className={field}
                />
                <div className="flex flex-wrap gap-2">
                  {MORPH_IMAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("imageUrl", opt.value)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                        form.imageUrl === opt.value
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t.sireLabel}</label>
              <input
                value={form.sire}
                onChange={(e) => update("sire", e.target.value)}
                placeholder="Zephyr (Red Lilly White)"
                className={field}
              />
            </div>
            <div>
              <label className={label}>{t.damLabel}</label>
              <input
                value={form.dam}
                onChange={(e) => update("dam", e.target.value)}
                placeholder="Lily (Harlequin)"
                className={field}
              />
            </div>
            <div>
              <label className={label}>{t.paternalLineLabel}</label>
              <div className="flex gap-2">
                <input
                  value={form.paternalSire}
                  onChange={(e) => update("paternalSire", e.target.value)}
                  placeholder="Sire"
                  className={field}
                />
                <input
                  value={form.paternalDam}
                  onChange={(e) => update("paternalDam", e.target.value)}
                  placeholder="Dam"
                  className={field}
                />
              </div>
            </div>
            <div>
              <label className={label}>{t.maternalLineLabel}</label>
              <div className="flex gap-2">
                <input
                  value={form.maternalSire}
                  onChange={(e) => update("maternalSire", e.target.value)}
                  placeholder="Sire"
                  className={field}
                />
                <input
                  value={form.maternalDam}
                  onChange={(e) => update("maternalDam", e.target.value)}
                  placeholder="Dam"
                  className={field}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t.notesShort}</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={label}>{t.dietShort}</label>
              <textarea
                rows={3}
                value={form.diet}
                onChange={(e) => update("diet", e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bug className="w-4 h-4" />
              )}
              {saving ? t.creating : t.createBtn}
            </button>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 transition-colors"
            >
              {t.viewCatalog}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
