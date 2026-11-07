"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = {
      name: formData.get("name")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
    };
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Akun petugas gagal dibuat.");
      form.reset();
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Akun petugas gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-4">
      <h2 className="font-extrabold">Tambah Petugas</h2>
      <p className="mt-1 text-xs text-slate-500">Akun petugas sarana prasarana dapat memproses pengajuan dan pembayaran.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
        <div><label className="lbl">Nama lengkap</label><input name="name" className="inp" minLength={3} required /></div>
        <div><label className="lbl">Email</label><input name="email" type="email" className="inp" required /></div>
        <div><label className="lbl">Nomor telepon</label><input name="phone" type="tel" className="inp" /></div>
        <div><label className="lbl">Kata sandi sementara</label><input name="password" type="password" className="inp" minLength={8} required /></div>
        <div className="md:col-span-4"><button className="btn" disabled={busy}>{busy ? "Menyimpan…" : "Tambah Petugas"}</button></div>
      </form>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
