"use client";
import { useRouter } from "next/navigation";
export default function ApiButton({ url, method = "PATCH", body, text, danger, ask, reasonKey }: { url: string; method?: string; body?: object; text: string; danger?: boolean; ask?: string; reasonKey?: string }) {
  const router = useRouter();
  async function go() {
    if (ask && !confirm(ask)) return;
    let b: any = body; if (reasonKey) { const r = prompt("Catatan/alasan (wajib):"); if (!r) return; b = { ...body, [reasonKey]: r }; }
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    if (!r.ok) alert((await r.json()).error); else router.refresh();
  }
  return <button onClick={go} className={danger ? "btn-d" : "btn-o"}>{text}</button>;
}
