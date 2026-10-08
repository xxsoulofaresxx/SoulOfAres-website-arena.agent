import { updateInquiryStatus } from "@/lib/data";
import type { InquiryStatus } from "@/lib/types";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["New", "Replied", "Closed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isBreederAuthorized())) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body: Record<string, unknown> = await request.json();
    const status = typeof body.status === "string" ? body.status : "";
    if (!STATUSES.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    const inquiry = await updateInquiryStatus(id, status as InquiryStatus);
    if (!inquiry) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ inquiry });
  } catch (error) {
    console.error("PATCH /api/inquiries/[id] failed", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}
