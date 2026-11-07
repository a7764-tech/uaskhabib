import { prisma } from "@/lib/prisma";
import ExportButtons from "@/components/ExportButtons";
import StatusBadge from "@/components/StatusBadge";

type SearchParams = { from?: string; to?: string; purpose?: string; room?: string };
const purposeNames = { ORGANISASI: "Organisasi", AKADEMIK: "Akademik", UMUM: "Pribadi/Umum" };

export const dynamic = "force-dynamic";

export default async function Reports({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const now = new Date();
  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const from = query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from) ? query.from : defaultFrom;
  const to = query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to) ? query.to : defaultTo;
  const reportStart = new Date(`${from}T00:00:00.000Z`);
  const reportUntil = new Date(`${to}T00:00:00.000Z`);
  reportUntil.setUTCDate(reportUntil.getUTCDate() + 1);
  const paymentStart = new Date(`${from}T00:00:00+07:00`);
  const paymentUntil = new Date(`${to}T00:00:00+07:00`);
  paymentUntil.setDate(paymentUntil.getDate() + 1);
  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.booking.findMany({
      where: {
        date: { gte: reportStart, lt: reportUntil },
        ...(query.room ? { roomId: query.room } : {}),
        ...(query.purpose && ["ORGANISASI", "AKADEMIK", "UMUM"].includes(query.purpose) ? { purposeType: query.purpose as "ORGANISASI" | "AKADEMIK" | "UMUM" } : {}),
      },
      include: { room: true, user: true },
      orderBy: { startTime: "asc" },
    }),
  ]);
  const payments = await prisma.payment.findMany({
    where: {
      status: "VALID",
      bookingId: { in: bookings.map(booking => booking.id) },
      paidAt: { gte: paymentStart, lt: paymentUntil },
    },
    select: { amount: true, bookingId: true },
  });
  const approved = bookings.filter(booking => ["DISETUJUI", "TERKONFIRMASI", "SELESAI"].includes(booking.status));
  const income = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const rejected = bookings.filter(booking => ["DITOLAK", "DIBATALKAN"].includes(booking.status)).length;
  const roomSummary = rooms.map(room => {
    const records = approved.filter(booking => booking.roomId === room.id);
    const revenue = records.filter(booking => payments.some(payment => payment.bookingId === booking.id)).reduce((sum, booking) => sum + booking.totalPrice, 0);
    return { room, records, revenue };
  }).filter(item => item.records.length);
  const purposeSummary = Object.entries(purposeNames).map(([purpose, label]) => {
    const count = bookings.filter(booking => booking.purposeType === purpose).length;
    return { purpose, label, count, percent: bookings.length ? Math.round(count / bookings.length * 100) : 0 };
  });
  const headers = ["Kode", "Pemohon", "Kegiatan", "Ruangan", "Kepentingan", "Tanggal", "Jadwal", "Status", "Biaya"];
  const exportRows = bookings.map(booking => [
    booking.code,
    booking.user.name,
    booking.eventName,
    booking.room.name,
    purposeNames[booking.purposeType],
    booking.startTime.toLocaleDateString("id-ID"),
    `${booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}-${booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
    booking.status,
    booking.totalPrice,
  ]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Analisis penggunaan</p><h1 className="mt-1 text-2xl font-extrabold">Laporan Penggunaan Ruangan</h1><p className="mt-1 text-sm text-slate-500">Rekap pemesanan berdasarkan tanggal pemakaian, termasuk jadwal mendatang dalam periode.</p></div><ExportButtons head={headers} rows={exportRows} title="Laporan Penggunaan Ruangan" /></div>
      <form className="card mb-4 grid gap-3 !p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div><label className="lbl">Dari tanggal</label><input name="from" type="date" defaultValue={from} className="inp" /></div>
        <div><label className="lbl">Sampai tanggal</label><input name="to" type="date" defaultValue={to} className="inp" /></div>
        <div><label className="lbl">Kepentingan</label><select name="purpose" defaultValue={query.purpose} className="inp"><option value="">Semua</option><option value="ORGANISASI">Organisasi</option><option value="AKADEMIK">Akademik</option><option value="UMUM">Pribadi/Umum</option></select></div>
        <div><label className="lbl">Ruangan</label><select name="room" defaultValue={query.room} className="inp"><option value="">Semua ruangan</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
        <button className="btn self-end">Tampilkan</button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["▤", bookings.length, "Total pemesanan", "bg-sky-100"],
          ["✅", approved.length, "Terkonfirmasi / disetujui", "bg-emerald-100"],
          ["💰", `Rp${income.toLocaleString("id-ID")}`, "Total pendapatan", "bg-amber-100"],
          ["◉", rejected, "Ditolak / dibatalkan", "bg-violet-100"],
        ].map(([icon, value, label, tone]) => <div key={label as string} className="stat-card !min-h-[82px] !gap-2 !p-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base ${tone}`}>{icon}</span><div className="min-w-0"><b className="block truncate text-lg font-extrabold">{value}</b><span className="text-[10px] text-slate-500">{label}</span></div></div>)}
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <section className="card !p-4"><h2 className="text-sm font-extrabold">Frekuensi Penggunaan Ruangan</h2><div className="mt-4 space-y-3">{roomSummary.map(item => <div key={item.room.id} className="grid grid-cols-[125px_1fr_30px] items-center gap-2 text-[11px]"><span className="truncate">{item.room.name}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, item.records.length / Math.max(1, ...roomSummary.map(row => row.records.length)) * 100)}%` }} /></div><b className="text-right">{item.records.length}</b></div>)}{!roomSummary.length && <p className="text-xs text-slate-500">Belum ada data untuk periode ini.</p>}</div></section>
        <section className="card !p-4"><h2 className="text-sm font-extrabold">Penggunaan per Kepentingan</h2><div className="mt-4 space-y-3">{purposeSummary.map(item => <div key={item.purpose} className="grid grid-cols-[100px_1fr_38px] items-center gap-2 text-[11px]"><span>{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.percent}%` }} /></div><b className="text-right">{item.percent}%</b></div>)}</div></section>
      </div>
      <section className="card !p-0">
        <h2 className="p-4 text-sm font-extrabold">Rekap Pemesanan</h2>
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{["Kode", "Pemohon / Kegiatan", "Kepentingan", "Ruangan", "Tanggal & Jam", "Pendapatan", "Status"].map(title => <th key={title}>{title}</th>)}</tr></thead>
            <tbody>{bookings.map(booking => <tr key={booking.id}>
              <td className="font-bold">{booking.code}</td><td><b>{booking.user.name}</b><span className="mt-0.5 block text-[11px] text-slate-500">{booking.eventName}</span></td>
              <td><StatusBadge status={booking.purposeType} /></td><td>{booking.room.name}</td>
              <td>{booking.startTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}<span className="block text-[11px] text-slate-500">{booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></td>
              <td>{booking.status === "TERKONFIRMASI" || booking.status === "SELESAI" ? `Rp${booking.totalPrice.toLocaleString("id-ID")}` : "—"}</td><td><StatusBadge status={booking.status} /></td>
            </tr>)}
            {!bookings.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500">Tidak ada pemesanan pada periode dan filter ini.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
