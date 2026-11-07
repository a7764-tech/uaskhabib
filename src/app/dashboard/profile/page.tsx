import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const sessionUser = await getUser();
  if (!sessionUser || sessionUser.role !== "PENYEWA") redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, phone: true } });
  if (!user) redirect("/login");
  return <div><p className="eyebrow">Pengaturan akun</p><h1 className="mt-1 text-2xl font-extrabold">Profil Saya</h1><p className="mb-5 mt-1 text-sm text-slate-500">Perbarui informasi kontak yang digunakan pada pengajuan.</p><ProfileForm {...user} /></div>;
}
