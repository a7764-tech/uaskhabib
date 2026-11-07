import Link from "next/link";
import { getUser } from "@/lib/auth";
import SignOut from "./SignOut";
import BrandLogo from "./BrandLogo";

export default async function Navbar() {
  const user = await getUser();
  if (user?.role === "PETUGAS") return null;

  const initials = user?.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const renterNav = [
    { href: "/", label: "Beranda", icon: "🏠" },
    { href: "/rooms", label: "Jelajah Ruangan", icon: "🏛️" },
    { href: "/dashboard/bookings", label: "Riwayat Peminjaman", icon: "📋" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/profile", label: "Profil", icon: "👤" },
  ];
  const nav = user
    ? renterNav
    : [{ href: "/", label: "Beranda" }, { href: "/rooms", label: "Ruangan" }];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-[#12263f]">
            <BrandLogo />
          </Link>
          <nav className={`hidden items-center text-xs font-semibold text-slate-600 ${user ? "gap-4 lg:flex" : "gap-6 md:flex"}`}>
            {nav.map(item => <Link key={item.href} href={item.href} className="transition hover:text-teal-700">{item.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="hidden text-slate-500 sm:inline">{user.name} · Penyewa</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-400 text-[10px] font-extrabold text-[#073f44]">{initials}</span>
                <SignOut />
              </>
            ) : (
              <>
                <Link href="/login" className="hidden font-semibold text-slate-600 hover:text-teal-700 sm:inline">Masuk</Link>
                <Link href="/register" className="btn !min-h-8 !px-3 !py-1 text-xs">Daftar</Link>
              </>
            )}
          </div>
        </div>
      </header>
      {user && (
        <nav className="mobile-dock">
          {renterNav.map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 text-center text-[9px] font-semibold leading-tight text-slate-500">
              <span className="text-sm">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
