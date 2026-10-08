import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "xXSoulOfAresXx — Crested Gecko Breeders",
  description:
    "Allevamento Correlophus ciliatus di xXSoulOfAresXx. Catalogo bilingue IT/EN con pedigree, disponibilità e richieste di cessione.",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
