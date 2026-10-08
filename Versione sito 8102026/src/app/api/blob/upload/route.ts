import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAncestorForGecko, getGeckoById } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

interface UploadPayload {
  geckoId?: unknown;
  ancestorId?: unknown;
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Configura uno storage Vercel Blob per abilitare il caricamento." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await isBreederAuthorized())) throw new Error("Non autorizzato");
        const payload = JSON.parse(clientPayload || "{}") as UploadPayload;
        const geckoId = typeof payload.geckoId === "string" ? payload.geckoId : "";
        const ancestorId =
          typeof payload.ancestorId === "string" ? payload.ancestorId : null;
        if (!geckoId || !(await getGeckoById(geckoId))) {
          throw new Error("Esemplare non trovato");
        }
        if (ancestorId && !(await getAncestorForGecko(geckoId, ancestorId))) {
          throw new Error("Nodo genealogico non valido");
        }
        const safeName = pathname.split("/").pop()?.slice(-100) || "media";
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ geckoId, ancestorId, safeName }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // The browser stores the returned blob URL in PostgreSQL after upload.
        // This callback validates that Vercel completed a genuine Blob upload.
        if (!blob.url || !tokenPayload) {
          throw new Error("Il caricamento è terminato senza metadati validi");
        }
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Vercel Blob upload authorization failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload non riuscito" },
      { status: 400 },
    );
  }
}
