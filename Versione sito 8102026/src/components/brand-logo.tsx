import Image from "next/image";
import Link from "next/link";

export const BREEDER_NAME = "xXSoulOfAresXx";

interface BrandLogoProps {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

const MARK = {
  sm: { box: "h-10 w-10", img: 40 },
  md: { box: "h-12 w-12 sm:h-14 sm:w-14", img: 56 },
  lg: { box: "h-16 w-16 sm:h-20 sm:w-20", img: 80 },
};

const TITLE = {
  sm: "text-sm sm:text-base",
  md: "text-base sm:text-lg",
  lg: "text-xl sm:text-2xl",
};

export default function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = true,
  subtitle = "Correlophus ciliatus",
  className = "",
}: BrandLogoProps) {
  const mark = MARK[size];

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`relative ${mark.box} shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-black`}
      >
        <Image
          src="/images/logo-mark.png"
          alt={`${BREEDER_NAME} holographic gecko mark`}
          fill
          sizes={`${mark.img}px`}
          className="object-contain p-[2px]"
          priority
        />
      </span>
      {showWordmark && (
        <span className="min-w-0 leading-tight">
          <span
            className={`block font-serif font-bold tracking-wide ${TITLE[size]} bg-linear-to-r from-lime-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent`}
            style={{
              backgroundImage:
                "linear-gradient(90deg, #b6ff6a 0%, #ffe14a 18%, #ff6ad5 42%, #6ad4ff 68%, #c084fc 86%, #ff4e8a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {BREEDER_NAME}
          </span>
          {subtitle ? (
            <span className="block text-[10px] sm:text-[11px] text-fuchsia-300/80 font-mono tracking-[0.18em] uppercase">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center" aria-label={BREEDER_NAME}>
      {inner}
    </Link>
  );
}

export function FullBrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`}>
      <Image
        src="/images/logo.png"
        alt={BREEDER_NAME}
        width={420}
        height={375}
        className="mx-auto h-auto w-[220px] sm:w-[280px] object-contain drop-shadow-[0_0_28px_rgba(217,70,239,0.25)]"
        priority
      />
    </div>
  );
}
