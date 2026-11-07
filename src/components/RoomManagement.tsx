"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomType } from "@prisma/client";
import RoomImage from "./RoomImage";

const typeNames: Record<RoomType, string> = { KELAS: "Ruang Kelas", LAB: "Laboratorium", AULA: "Aula", RAPAT: "Rapat" };
const emptyForm = { name: "", type: "KELAS" as RoomType, capacity: "40", building: "Gedung A", floor: "1", pricePerHour: "0", facilities: "" };

export default function RoomManagement({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const visibleRooms = useMemo(() => rooms.filter(room => room.name.toLowerCase().includes(search.toLowerCase()) && (!typeFilter || room.type === typeFilter)), [rooms, search, typeFilter]);

  function edit(room: Room) {
    setSelected(room);
    setForm({ name: room.name, type: room.type, capacity: String(room.capacity), building: room.building, floor: String(room.floor), pricePerHour: String(room.pricePerHour), facilities: room.facilities });
    setPhoto(null);
    setError("");
    document.getElementById("room-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function reset() {
    setSelected(null);
    setForm(emptyForm);
    setPhoto(null);
    setError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let imageUrl = selected?.imageUrl ?? undefined;
      if (photo) {
        if (photo.size > 4 * 1024 * 1024) throw new Error("Ukuran foto maksimal 4 MB.");
        const upload = new FormData();
        upload.append("file", photo);
        const result = await fetch("/api/upload", { method: "POST", body: upload });
        const uploaded = await result.json();
        if (!result.ok) throw new Error(uploaded.error ?? "Foto gagal diunggah.");
        imageUrl = uploaded.url;
      }
      const response = await fetch(selected ? `/api/rooms/${selected.id}` : "/api/rooms", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity), floor: Number(form.floor), pricePerHour: Number(form.pricePerHour), imageUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Data ruangan gagal disimpan.");
      reset();
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data ruangan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(room: Room) {
    const response = await fetch(`/api/rooms/${room.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !room.isActive }) });
    if (!response.ok) { const result = await response.json(); setError(result.error ?? "Status ruangan gagal diperbarui."); return; }
    router.refresh();
  }

  async function remove(room: Room) {
    if (!window.confirm(`Hapus atau nonaktifkan ${room.name}?`)) return;
    const response = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    if (!response.ok) { const result = await response.json(); setError(result.error ?? "Ruangan gagal dihapus."); return; }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="card !p-3">
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px]">
          <input value={search} onChange={event => setSearch(event.target.value)} className="inp" placeholder="⌕  Cari nama ruangan…" />
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="inp"><option value="">Semua jenis</option>{Object.entries(typeNames).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select>
        </div>
        <div className="table-wrap">
          <table className="table-base !min-w-[670px]">
            <thead><tr>{["Foto", "Nama", "Jenis", "Kapasitas", "Tarif/jam", "Status", "Aksi"].map(title => <th key={title}>{title}</th>)}</tr></thead>
            <tbody>{visibleRooms.map(room => <tr key={room.id}>
              <td><RoomImage type={room.type} imageUrl={room.imageUrl} name={room.name} className="h-12 w-16 rounded-lg object-cover" /></td>
              <td><b>{room.name}</b><span className="mt-0.5 block text-[10px] text-slate-500">{room.building}</span></td>
              <td>{typeNames[room.type]}</td><td>{room.capacity} orang</td><td>Rp{room.pricePerHour.toLocaleString("id-ID")}</td>
              <td><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${room.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{room.isActive ? "Aktif" : "Nonaktif"}</span></td>
              <td><div className="flex flex-wrap gap-1"><button onClick={() => edit(room)} className="btn-o !min-h-8 !px-2 !py-1 text-[10px]">Ubah</button><button onClick={() => toggleActive(room)} className="btn-o !min-h-8 !px-2 !py-1 text-[10px]">{room.isActive ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => remove(room)} className="btn-d !min-h-8 !px-2 !py-1 text-[10px]">Hapus</button></div></td>
            </tr>)}
            {!visibleRooms.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500">Tidak ada ruangan yang cocok.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section id="room-form" className="card">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold">{selected ? "Ubah Ruangan" : "Tambah Ruangan"}</h2><p className="mt-1 text-xs text-slate-500">Lengkapi detail, kapasitas, fasilitas, dan tarif.</p></div>{selected && <button type="button" onClick={reset} className="btn-o">Batal Ubah</button>}</div>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2"><label className="lbl">Nama ruangan</label><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="inp" required minLength={2} /></div>
          <div><label className="lbl">Jenis</label><select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as RoomType })} className="inp">{Object.entries(typeNames).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></div>
          <div><label className="lbl">Kapasitas</label><input type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} className="inp" required /></div>
          <div><label className="lbl">Gedung</label><input value={form.building} onChange={event => setForm({ ...form, building: event.target.value })} className="inp" required /></div>
          <div><label className="lbl">Lantai</label><input type="number" min="0" value={form.floor} onChange={event => setForm({ ...form, floor: event.target.value })} className="inp" required /></div>
          <div><label className="lbl">Tarif/jam (Rp)</label><input type="number" min="0" value={form.pricePerHour} onChange={event => setForm({ ...form, pricePerHour: event.target.value })} className="inp" required /></div>
          <div><label className="lbl">Fasilitas</label><input value={form.facilities} onChange={event => setForm({ ...form, facilities: event.target.value })} className="inp" placeholder="Proyektor, AC, Wi-Fi" /></div>
          <div><label className="lbl">Foto ruangan</label><input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={event => setPhoto(event.target.files?.[0] ?? null)} className="inp !py-2 text-xs" /></div>
          <div className="flex items-end"><button className="btn w-full" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Ruangan"}</button></div>
        </form>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>
    </div>
  );
}
