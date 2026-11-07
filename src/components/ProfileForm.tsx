"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  name: string;
  email: string;
  phone: string | null;
};

export default function ProfileForm({ name, email, phone }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name")?.toString() ?? "",
          phone: formData.get("phone")?.toString() ?? "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Profil gagal diperbarui.");
      setSaved(true);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profil gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4">
      <div>
        <label className="lbl" htmlFor="profile-name">Nama lengkap</label>
        <input id="profile-name" name="name" className="inp" defaultValue={name} minLength={3} required />
      </div>
      <div>
        <label className="lbl" htmlFor="profile-email">Email</label>
        <input id="profile-email" type="email" className="inp bg-slate-50" value={email} readOnly />
      </div>
      <div>
        <label className="lbl" htmlFor="profile-phone">Nomor telepon</label>
        <input id="profile-phone" name="phone" type="tel" autoComplete="tel" className="inp" defaultValue={phone ?? ""} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profil berhasil diperbarui.</p>}
      <button className="btn" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Perubahan"}</button>
    </form>
  );
}
