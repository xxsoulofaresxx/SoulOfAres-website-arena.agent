import GeckoMarketplace from "@/components/gecko-marketplace";
import { listGeckos } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catalogo — xXSoulOfAresXx",
  description:
    "Catalogo bilingue IT/EN dei gechi ciliati di xXSoulOfAresXx: genealogia, foto, video e disponibilità.",
};

export default async function CatalogPage() {
  let geckos: Awaited<ReturnType<typeof listGeckos>> = [];
  try {
    geckos = await listGeckos();
  } catch (error) {
    console.error("Catalog page could not load the catalog", error);
  }

  const isOwner = await isBreederAuthorized();

  return <GeckoMarketplace initialGeckos={geckos} isOwner={isOwner} />;
}
