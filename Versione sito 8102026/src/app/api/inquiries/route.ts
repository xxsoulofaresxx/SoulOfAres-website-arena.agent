import { createInquiry, listInquiries } from "@/lib/data";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  if (!(await isBreederAuthorized())) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const items = await listInquiries();
    return Response.json({ items });
  } catch (error) {
    console.error("GET /api/inquiries failed", error);
    return Response.json({ error: "Database unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json();
    const geckoId = typeof body.geckoId === "string" ? body.geckoId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const locale = body.locale === "en" ? "en" : "it";

    if (!geckoId) {
      return Response.json({ error: "geckoId is required" }, { status: 400 });
    }
    if (name.length < 2) {
      return Response.json({ error: "Name is too short" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: "Email is not valid" }, { status: 400 });
    }

    const inquiry = await createInquiry({
      geckoId,
      name,
      email,
      message,
      locale,
    });
    if (!inquiry) {
      return Response.json({ error: "Specimen not found" }, { status: 404 });
    }
    return Response.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inquiries failed", error);
    return Response.json({ error: "Could not send inquiry" }, { status: 500 });
  }
}
