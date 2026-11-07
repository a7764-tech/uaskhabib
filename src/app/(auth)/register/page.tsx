"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Register() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const form = {
      name: values.get("name")?.toString() ?? "",
      email: values.get("email")?.toString() ?? "",
      phone: values.get("phone")?.toString() ?? "",
      password: values.get("password")?.toString() ?? "",
      confirm: values.get("confirm")?.toString() ?? "",
    };
    if (form.password !== form.confirm) return setError("Konfirmasi kata sandi tidak sama.");
    setBusy(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Pendaftaran gagal.");
      window.location.href = "/login";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pendaftaran gagal.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 text-center"><BrandLogo className="mx-auto h-10" /><h1 className="mt-3 text-2xl font-extrabold">Buat Akun Penyewa</h1><p className="mt-1 text-sm text-slate-500">Satu akun untuk mahasiswa, organisasi, dosen, dan masyarakat umum.</p></div>
      <div className="card">
        <form onSubmit={submit} className="space-y-4">
          <div><label className="lbl">Nama lengkap</label><input name="name" autoComplete="name" className="inp" placeholder="Nama sesuai identitas" minLength={3} required /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="lbl">Email</label><input name="email" type="email" autoComplete="email" className="inp" placeholder="nama@email.com" required /></div>
            <div><label className="lbl">Nomor telepon</label><input name="phone" type="tel" autoComplete="tel" className="inp" placeholder="08xxxxxxxxxx" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="lbl">Kata sandi</label><input name="password" type="password" autoComplete="new-password" minLength={8} className="inp" required /></div>
            <div><label className="lbl">Konfirmasi kata sandi</label><input name="confirm" type="password" autoComplete="new-password" minLength={8} className="inp" required /></div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900">💡 Kepentingan sewa (organisasi, akademik, atau pribadi/umum) dipilih saat memesan ruangan, bukan saat mendaftar.</div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? "Membuat akun…" : "Daftar"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="font-bold text-teal-700">Masuk</Link></p>
      </div>
    </div>
  );
}
