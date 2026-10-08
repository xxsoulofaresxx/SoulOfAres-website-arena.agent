import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getGeckoMediaById, removeGeckoMedia } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id, mediaId } = await params;
    if (!UUID_RE.test(id) || !UUID_RE.test(mediaId)) {
      return NextResponse.json({ error: "File non trovato" }, { status: 404 });
    }
    const media = await getGeckoMediaById(id, mediaId);
    if (!media) return NextResponse.json({ error: "File non trovato" }, { status: 404 });

    await del(media.url);
    await removeGeckoMedia(id, mediaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE gecko media failed", error);
    return NextResponse.json({ error: "Impossibile eliminare il file" }, { status: 500 });
  }
}
