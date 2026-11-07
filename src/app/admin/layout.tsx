import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.role !== "PETUGAS") redirect("/login");
  return <div className="admin-shell"><AdminSidebar name={user.name} /><div className="min-w-0 pb-24 lg:pb-6">{children}</div></div>;
}
