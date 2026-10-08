import DashboardView from "@/components/dashboard-view";
import { getStats, listGeckos, listInquiries, type CatalogStats } from "@/lib/data";
import { redirect } from "next/navigation";
import { isBreederAuthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — xXSoulOfAresXx",
};

export default async function DashboardPage() {
  if (!(await isBreederAuthorized())) redirect("/dashboard/login");

  let geckos: Awaited<ReturnType<typeof listGeckos>> = [];
  let inquiries: Awaited<ReturnType<typeof listInquiries>> = [];
  let stats: CatalogStats = {
    total: 0,
    available: 0,
    hold: 0,
    sold: 0,
    newInquiries: 0,
  };

  try {
    [geckos, inquiries, stats] = await Promise.all([
      listGeckos(),
      listInquiries(),
      getStats(),
    ]);
  } catch (error) {
    console.error("Dashboard could not load data", error);
  }

  return (
    <DashboardView
      initialGeckos={geckos}
      initialInquiries={inquiries}
      stats={stats}
    />
  );
}
