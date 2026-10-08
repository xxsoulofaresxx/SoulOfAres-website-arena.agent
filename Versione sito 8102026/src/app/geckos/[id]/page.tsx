import { notFound } from "next/navigation";
import GeckoDetailView from "@/components/gecko-detail-view";
import { getGeckoById, getPedigreeForGecko, listGeckoMedia } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scheda esemplare — xXSoulOfAresXx",
  description: "Foto, video, genetica e albero genealogico del Correlophus ciliatus.",
};

export default async function GeckoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }
  const [gecko, ancestors, media, isOwner] = await Promise.all([
    getGeckoById(id),
    getPedigreeForGecko(id),
    listGeckoMedia(id),
    isBreederAuthorized(),
  ]);

  if (!gecko || !ancestors) notFound();

  return (
    <GeckoDetailView
      initialGecko={gecko}
      initialAncestors={ancestors}
      initialMedia={media}
      isOwner={isOwner}
    />
  );
}
