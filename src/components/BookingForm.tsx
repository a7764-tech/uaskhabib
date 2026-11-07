"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Room } from "@prisma/client";

type Purpose = "ORGANISASI" | "AKADEMIK" | "UMUM";
const purposeOptions: { key: Purpose; icon: string; title: string; description: string; tone: string }[] = [
  { key: "ORGANISASI", icon: "👥", title: "Kegiatan Organisasi", description: "Rapat, UKM, BEM/DPM, acara organisasi", tone: "bg-indigo-100" },
  { key: "AKADEMIK", icon: "🎓", title: "Kegiatan Akademik", description: "Kuliah tambahan, seminar, ujian, pelatihan", tone: "bg-sky-100" },
  { key: "UMUM", icon: "🎉", title: "Keperluan Pribadi / Umum", description: "Acara pribadi, instansi luar, masyarakat umum", tone: "bg-amber-100" },
];

async function readApiResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.text();
  let result: { error?: string } & T;
  try {
    result = JSON.parse(body) as { error?: string } & T;
  } catch {
    throw new Error(`${fallback} (respons server tidak valid, HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(result.error ?? `${fallback} (HTTP ${response.status}).`);
  return result;
}

function localDate(offset = 2) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function BookingForm({ rooms, roomId, initialPurpose, userName }: { rooms: Room[]; roomId?: string; initialPurpose?: Purpose; userName: string }) {
  const router = useRouter();
  const [purposeType, setPurposeType] = useState<Purpose>(initialPurpose ?? "UMUM");
  const [selectedRoom, setSelectedRoom] = useState(roomId ?? rooms[0]?.id ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [date, setDate] = useState(localDate());
  const [participants, setParticipants] = useState(20);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const room = rooms.find(item => item.id === selectedRoom);
  const duration = useMemo(() => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
  }, [startTime, endTime]);
  const total = room ? Math.round(duration * room.pricePerHour) : 0;
  const formatMoney = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    if (!room) return setError("Pilih ruangan yang akan digunakan.");
    if (participants > room.capacity) return setError(`Jumlah peserta melebihi kapasitas ${room.capacity} orang.`);
    if (purposeType !== "UMUM" && !file) return setError("Dokumen pendukung wajib dilampirkan untuk kegiatan organisasi dan akademik.");
    if (file && file.size > 4 * 1024 * 1024) return setError("Ukuran dokumen maksimal 4 MB.");
    if (duration <= 0) return setError("Jam selesai harus lebih besar daripada jam mulai.");

    setBusy(true);
    try {
      let documentUrl: string | undefined;
      if (file) {
        const upload = new FormData();
        upload.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: upload });
        const result = await readApiResponse<{ url: string }>(response, "Dokumen gagal diunggah.");
        documentUrl = result.url;
      }

      const values = new FormData(formElement);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom,
          date,
          startTime,
          endTime,
          participants,
          purposeType,
          purpose: values.get("purpose")?.toString(),
          eventName: values.get("eventName")?.toString(),
          organizationName: values.get("organizationName")?.toString() || undefined,
          programStudy: values.get("programStudy")?.toString() || undefined,
          course: values.get("course")?.toString() || undefined,
          documentUrl,
        }),
      });
      await readApiResponse(response, "Pengajuan gagal disimpan.");
      router.push("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pengajuan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow">Ajukan jadwal baru</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Form Pemesanan Ruangan</h1>
        <p className="mt-1 text-sm text-slate-500">Pilih kepentingan sewa, lalu lengkapi data pemesanan.</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={submit} className="space-y-4">
          <section className="card !p-4">
            <h2 className="mb-3 text-sm font-extrabold">Kepentingan Sewa</h2>
            <div className="space-y-2">
              {purposeOptions.map(option => (
                <button key={option.key} type="button" onClick={() => setPurposeType(option.key)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${purposeType === option.key ? "border-teal-700 bg-teal-50/80 ring-1 ring-teal-700" : "border-slate-200 hover:border-teal-300"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${option.tone}`}>{option.icon}</span>
                  <span className="min-w-0 flex-1"><b className="block text-xs">{option.title}</b><span className="mt-0.5 block text-[11px] text-slate-500">{option.description}</span></span>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${purposeType === option.key ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card !p-4">
            <h2 className="mb-3 text-sm font-extrabold">1. Data Pemesan dan Keperluan</h2>
            <div className="space-y-3">
              <div><label className="lbl">Nama pemesan</label><input className="inp bg-slate-50" value={userName} readOnly /></div>
              {purposeType === "ORGANISASI" && <div><label className="lbl">Organisasi</label><input name="organizationName" className="inp" placeholder="Nama organisasi / UKM" required /></div>}
              <div className="grid gap-3 sm:grid-cols-2">
                {purposeType === "AKADEMIK" && <div><label className="lbl">Program studi</label><input name="programStudy" className="inp" placeholder="Contoh: Teknik Informatika" required /></div>}
                {purposeType === "AKADEMIK" && <div><label className="lbl">Mata kuliah / kelas</label><input name="course" className="inp" placeholder="Contoh: PBF · 3A" required /></div>}
                <div><label className="lbl">Nama kegiatan</label><input name="eventName" className="inp" placeholder="Contoh: Rapat Pengurus Harian" required /></div>
                {purposeType === "UMUM" && <div><label className="lbl">Instansi / asal (opsional)</label><input name="organizationName" className="inp" placeholder="Nama instansi atau komunitas" /></div>}
              </div>
              <div><label className="lbl">Keperluan</label><textarea name="purpose" className="inp min-h-24 resize-y" placeholder="Jelaskan tujuan penggunaan ruangan" required minLength={3} /></div>
            </div>
          </section>

          <section className="card !p-4">
            <h2 className="mb-3 text-sm font-extrabold">2. Ruangan dan Jadwal</h2>
            <div className="space-y-3">
              <div><label className="lbl">Ruangan</label><select name="roomId" value={selectedRoom} onChange={event => setSelectedRoom(event.target.value)} className="inp" required>{rooms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="lbl">Tanggal</label><input name="date" type="date" min={localDate(0)} value={date} onChange={event => setDate(event.target.value)} className="inp" required /></div>
                <div><label className="lbl">Jumlah peserta</label><input name="participants" type="number" min="1" max={room?.capacity} value={participants} onChange={event => setParticipants(Number(event.target.value))} className="inp" required /><p className="mt-1 text-[10px] text-slate-500">Kapasitas ruangan {room?.capacity ?? 0} orang</p></div>
                <div><label className="lbl">Jam mulai</label><input name="startTime" type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="inp" required /></div>
                <div><label className="lbl">Jam selesai</label><input name="endTime" type="time" value={endTime} onChange={event => setEndTime(event.target.value)} className="inp" required /></div>
              </div>
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Jadwal akan diperiksa otomatis sebelum pengajuan disimpan.</p>
            </div>
          </section>

          <section className="card !p-4">
            <h2 className="mb-1 text-sm font-extrabold">3. Dokumen Pendukung {purposeType === "UMUM" ? "(opsional)" : "(wajib)"}</h2>
            <p className="mb-3 text-[11px] text-slate-500">{purposeType === "ORGANISASI" ? "Surat izin atau proposal kegiatan organisasi" : purposeType === "AKADEMIK" ? "Surat tugas atau jadwal kegiatan dari program studi" : "Surat permohonan kegiatan jika tersedia"} · PDF/JPG/PNG, maks. 4 MB</p>
            <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-xs text-slate-500 transition hover:border-teal-500 hover:bg-teal-50">
              {file ? <span className="font-semibold text-teal-800">📎 {file.name}</span> : <span>Tarik berkas ke sini atau <b className="text-teal-700">pilih berkas</b></span>}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={event => setFile(event.target.files?.[0] ?? null)} required={purposeType !== "UMUM"} />
            </label>
          </section>
          {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 pb-20 lg:pb-0">
            <button type="button" onClick={() => history.back()} className="btn-o">Batal</button>
            <button className="btn" disabled={busy}>{busy ? "Mengirim…" : "Ajukan Pemesanan"}</button>
          </div>
        </form>

        <aside className="space-y-3 lg:sticky lg:top-20">
          <div className="card !p-4">
            <h2 className="text-sm font-extrabold">Ringkasan</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Kepentingan</dt><dd className="text-right font-bold">{purposeOptions.find(item => item.key === purposeType)?.title.replace("Kegiatan ", "").replace("Keperluan ", "")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Ruangan</dt><dd className="text-right font-bold">{room?.name ?? "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Waktu</dt><dd className="text-right font-bold">{date} · {startTime}–{endTime}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Durasi</dt><dd className="font-bold">{duration} jam</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tarif</dt><dd className="font-bold">{formatMoney(room?.pricePerHour ?? 0)} / jam</dd></div>
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs font-bold">Total biaya</span><strong className="text-lg text-teal-700">{formatMoney(total)}</strong></div>
            <p className="mt-2 text-[10px] text-slate-500">Status awal <b className="text-amber-700">Menunggu Persetujuan</b></p>
          </div>
          <div className="card !p-4">
            <h2 className="text-sm font-extrabold">Alur Persetujuan</h2>
            <ol className="mt-3 space-y-3 text-xs">
              {["Pengajuan oleh penyewa", "Persetujuan petugas", "Pembayaran & unggah bukti", "Terkonfirmasi"].map((item, index) => <li key={item} className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>{item}</li>)}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
