import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { auth } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: headers()
  });

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  return <DashboardClient />;
}
