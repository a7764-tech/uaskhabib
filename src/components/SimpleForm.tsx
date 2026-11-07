"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type F = { name: string; label: string; type?: string; options?: [string, string][]; required?: boolean };
export default function SimpleForm({ url, fields, title }: { url: string; fields: F[]; title: string }) {
  const router = useRouter(); const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget;
    const values: Record<string, string> = {};
    new FormData(form).forEach((value, key) => { values[key] = value.toString(); });
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (r.ok) { form.reset(); setErr(""); router.refresh(); } else setErr((await r.json()).error);
  }
  return (<form onSubmit={submit} className="card mt-4"><h2 className="mb-3 font-bold">{title}</h2>
    <div className="grid gap-3 md:grid-cols-3">{fields.map(f => <div key={f.name}><label className="lbl">{f.label}</label>
      {f.options ? <select name={f.name} className="inp">{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        : <input name={f.name} type={f.type ?? "text"} required={f.required ?? true} className="inp" />}</div>)}</div>
    {err && <p className="mt-2 text-sm text-red-700">{err}</p>}<button className="btn mt-3">Simpan</button></form>);
}
