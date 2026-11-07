"use client";
import { useRouter } from "next/navigation";
export default function ApprovalButtons({ id, actions }: { id: string; actions: { key: string; text: string; danger?: boolean }[] }) {
  const router = useRouter();
  async function run(action: string) {
    let rejectReason: string | undefined;
    if (action === "tolak") { rejectReason = prompt("Alasan penolakan (wajib):") ?? ""; if (!rejectReason) return; }
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, rejectReason }) });
      if (!res.ok) {
        const body = await res.text();
        let message = "";
        try {
          const result: { error?: string } = JSON.parse(body);
          message = result.error ?? "";
        } catch {
          message = "";
        }
        alert(message || `Permintaan gagal (${res.status}${res.statusText ? ` ${res.statusText}` : ""}).`);
        return;
      }
      router.refresh();
    } catch (reason) {
      alert(reason instanceof Error ? `Permintaan gagal: ${reason.message}` : "Permintaan gagal karena terjadi kesalahan jaringan.");
    }
  }
  return <div className="flex gap-2">{actions.map(a => <button key={a.key} className={a.danger ? "btn-d" : "btn"} onClick={() => run(a.key)}>{a.text}</button>)}</div>;
}
