"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      callbackUrl: "/",
      redirect: false,
    });
    if (result?.error) {
      setError("Email atau kata sandi tidak sesuai.");
      setBusy(false);
      return;
    }
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    window.location.href = role === "PETUGAS" ? "/admin" : "/";
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_12px_42px_rgba(27,50,79,0.12)] md:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex min-h-64 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#12263f] via-[#174b60] to-[#0c8b80] p-8 text-white md:p-10">
        <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[34px] border-white/5" />
        <div className="relative">
          <div className="mb-8"><BrandLogo variant="light" className="gap-3 [&>span:first-child]:h-12 [&>span:first-child]:w-12 [&>span:first-child>svg]:h-8 [&>span:first-child>svg]:w-8 [&>span:last-child]:text-2xl" /></div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">Sewa ruang kampus tanpa antre dan tanpa bentrok jadwal</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">Satu aplikasi untuk organisasi, kegiatan akademik, dan keperluan pribadi atau umum.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
            {["Cek bentrok otomatis", "Pantau status", "Bayar mudah"].map(item => <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">✓ {item}</span>)}
          </div>
        </div>
      </section>
      <section className="flex items-center p-7 md:p-10">
        <div className="w-full">
          <h2 className="text-2xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-sm text-slate-500">Masuk dengan akun Penyewa atau Petugas. Anda akan diarahkan ke halaman sesuai peran akun.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><label className="lbl">Email</label><input name="email" type="email" autoComplete="email" className="inp" placeholder="nama@kampus.ac.id" required /></div>
            <div><div className="mb-1.5 flex justify-between"><label className="lbl mb-0">Kata sandi</label><span className="text-[11px] text-slate-400">Lupa kata sandi?</span></div><input name="password" type="password" autoComplete="current-password" className="inp" placeholder="Masukkan kata sandi" required /></div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="btn w-full" disabled={busy}>{busy ? "Memeriksa akun…" : "Masuk"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-teal-700">Daftar sebagai Penyewa</Link></p>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
            <b className="text-slate-700">Akun demo (kata sandi: password123)</b><br />
            Penyewa: rina.putri@mhs.unugiri.ac.id<br />
            Petugas: budi.santoso@unugiri.ac.id
          </div>
        </div>
      </section>
    </div>
  );
}
