import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Apple,
  Ruler,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

export const metadata = {
  title: "Care Guide — xXSoulOfAresXx",
  description:
    "Bilingual husbandry guide for crested geckos: temperature, humidity, diet and growth benchmarks.",
};

const SECTIONS = [
  {
    icon: Thermometer,
    title: { it: "Temperature", en: "Temperature" },
    it: "24-26 °C diurni, 20-22 °C notturni. Mai oltre 28 °C: il crested gecko non tollera il calore eccessivo.",
    en: "24-26 °C by day, 20-22 °C at night. Never above 28 °C: crested geckos do not tolerate excess heat.",
  },
  {
    icon: Droplets,
    title: { it: "Umidità", en: "Humidity" },
    it: "60-70% con nebulizzazioni serali e zona asciutta. Vasca verticale con substrate biodattile e corteccia.",
    en: "60-70% with evening misting and a dry zone. Vertical enclosure with bioactive substrate and cork bark.",
  },
  {
    icon: Apple,
    title: { it: "Alimentazione", en: "Feeding" },
    it: "Dieta completa in polvere (Pangaea / Repashy) 3 volte a settimana + insetti spolverati con calcio D3.",
    en: "Complete powder diet (Pangea / Repashy) three times a week + insects dusted with calcium D3.",
  },
  {
    icon: Ruler,
    title: { it: "Crescita", en: "Growth" },
    it: "Peso registrato ogni 15 giorni: 2 g alla nascita, 15-20 g a 6 mesi, 35-45 g da adulto.",
    en: "Weight recorded every two weeks: 2 g at hatch, 15-20 g at six months, 35-45 g as an adult.",
  },
];

export default function CareGuidePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <BrandLogo href="/" size="sm" subtitle="Guida alla Cura / Care Guide" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Catalogo / Catalog
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => (
            <article
              key={section.title.en}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-2"
            >
              <section.icon className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white">{section.title.it}</h2>
              <p className="text-sm text-slate-300">{section.it}</p>
              <p className="text-sm text-slate-500 border-t border-white/5 pt-2">
                {section.en}
              </p>
            </article>
          ))}
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex gap-3 text-sm text-emerald-200">
          <Image
            src="/images/logo-mark.png"
            alt="xXSoulOfAresXx"
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-contain bg-black ring-1 ring-white/10 shrink-0"
          />
          <p>
            Ogni esemplare in catalogo viene ceduto con scheda di alimentazione,
            peso alla consegna e pedigree completo. / Every specimen is sold with a
            feeding record, shipping weight and full pedigree.
          </p>
        </div>
      </main>
    </div>
  );
}
