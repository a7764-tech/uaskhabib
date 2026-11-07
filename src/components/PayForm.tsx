"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayForm({ bookingId, dueAmount }: { bookingId: string; dueAmount: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return setError("Pilih bukti transfer terlebih dahulu.");
    if (file.size > 4 * 1024 * 1024) return setError("Ukuran bukti maksimal 4 MB.");
    setBusy(true);
    try {
      const upload = new FormData();
      upload.append("file", file);
      const uploaded = await fetch("/api/upload", { method: "POST", body: upload });
      const uploadResult = await uploaded.json();
      if (!uploaded.ok) throw new Error(uploadResult.error ?? "Bukti transfer gagal diunggah.");
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          proofUrl: uploadResult.url,
          amount: dueAmount,
          paidAt: new FormData(form).get("paidAt"),
          senderName: new FormData(form).get("sender"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Bukti pembayaran gagal dikirim.");
      router.push("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bukti pembayaran gagal dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="lbl">Nominal transfer (Rp)</label><input className="inp bg-slate-50" value={dueAmount} readOnly /></div>
        <div><label className="lbl">Tanggal transfer</label><input name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="inp" required /></div>
      </div>
      <div><label className="lbl">Nama pengirim</label><input name="sender" className="inp" placeholder="Nama sesuai rekening pengirim" required /></div>
      <div><label className="lbl">Bukti transfer</label><input name="file" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="inp file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-teal-700" required /><p className="mt-1 text-[10px] text-slate-500">Format JPG, PNG, atau PDF, maksimal 4 MB.</p></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Mengirim bukti…" : "Kirim Bukti Pembayaran"}</button>
    </form>
  );
}
