import AddGeckoForm from "@/components/add-gecko-form";
import { isBreederAuthorized } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nuovo esemplare — xXSoulOfAresXx",
};

export default async function AddGeckoPage() {
  if (!(await isBreederAuthorized())) redirect("/dashboard/login");
  return <AddGeckoForm />;
}
