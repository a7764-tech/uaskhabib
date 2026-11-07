"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOut from "./SignOut";
import BrandLogo from "./BrandLogo";

const links = [
  ["/admin", "▦", "Dashboard"],
  ["/admin/rooms", "🏛", "Kelola Ruangan"],
  ["/admin/bookings", "☑", "Persetujuan"],
  ["/admin/payments", "▤", "Verifikasi Pembayaran"],
  ["/admin/reports", "▥", "Laporan"],
  ["/admin/users", "♙", "Kelola Pengguna"],
  ["/admin/profile", "👤", "Profil Saya"],
];

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="flex items-center gap-2 px-2 py-2 font-extrabold tracking-tight">
        <BrandLogo variant="light" className="[&>span:first-child]:h-8 [&>span:first-child]:w-8 [&>span:first-child>svg]:h-6 [&>span:first-child>svg]:w-6 [&>span:last-child]:text-sm" />
      </Link>
      <p className="mb-2 mt-5 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Panel Petugas</p>
      <nav className="space-y-1">
        {links.map(([href, icon, label]) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return <Link key={href} href={href} className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}><span className="w-4 text-center">{icon}</span>{label}</Link>;
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-400 text-[10px] font-extrabold text-[#073f44]">{initials}</span>
          <span className="min-w-0 flex-1"><b className="block truncate text-[11px]">{name}</b><span className="text-[10px] text-slate-400">Petugas Sarpras</span></span>
          <SignOut />
        </div>
      </div>
    </aside>
  );
}
