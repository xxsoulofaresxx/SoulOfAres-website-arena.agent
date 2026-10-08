import LandingView from "@/components/landing-view";
import { getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let specimenCount = 0;
  try {
    specimenCount = (await getStats()).total;
  } catch (error) {
    console.error("Home page could not load catalog stats", error);
  }

  return <LandingView specimenCount={specimenCount} />;
}
