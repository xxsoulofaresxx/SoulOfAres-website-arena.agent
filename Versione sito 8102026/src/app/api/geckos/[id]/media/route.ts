import { NextResponse } from "next/server";
import { addGeckoMedia, getAncestorForGecko, getGeckoById, listGeckoMedia } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ items: [] });
    const items = await listGeckoMedia(id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET gecko media failed", error);
    return NextResponse.json({ error: "Media non disponibili" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!UUID_RE.test(id) || !(await getGeckoById(id))) {
      return NextResponse.json({ error: "Esemplare non trovato" }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const filename = typeof body.filename === "string" ? body.filename.trim() : "";
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const sizeBytes = Number(body.sizeBytes);
    const ancestorId =
      typeof body.ancestorId === "string" && body.ancestorId.length > 0
        ? body.ancestorId
        : null;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "URL del file non valido" }, { status: 400 });
    }
    if (
      parsedUrl.protocol !== "https:" ||
      !parsedUrl.hostname.endsWith("blob.vercel-storage.com")
    ) {
      return NextResponse.json({ error: "URL media non riconosciuto" }, { status: 400 });
    }
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Formato non supportato" }, { status: 400 });
    }
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_MEDIA_BYTES) {
      return NextResponse.json({ error: "File troppo grande (massimo 100 MB)" }, { status: 400 });
    }
    if (!filename || filename.length > 200) {
      return NextResponse.json({ error: "Nome file non valido" }, { status: 400 });
    }
    if (ancestorId && (!UUID_RE.test(ancestorId) || !(await getAncestorForGecko(id, ancestorId)))) {
      return NextResponse.json({ error: "Nodo genealogico non valido" }, { status: 400 });
    }

    const media = await addGeckoMedia({
      geckoId: id,
      ancestorId,
      kind: contentType.startsWith("video/") ? "video" : "image",
      filename,
      url,
      contentType,
      sizeBytes,
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("POST gecko media failed", error);
    return NextResponse.json({ error: "Impossibile registrare il media" }, { status: 500 });
  }
}
