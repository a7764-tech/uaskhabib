import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ApprovalButtons from "@/components/ApprovalButtons";
import StatusBadge from "@/components/StatusBadge";

const money = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [pendingCount, paymentCount, confirmedCount, paid, rooms, purposeRows, pending] = await Promise.all([
    prisma.booking.count({ where: { status: "MENUNGGU_PERSETUJUAN" } }),
    prisma.payment.count({ where: { status: "MENUNGGU" } }),
    prisma.booking.count({ where: { status: "TERKONFIRMASI", startTime: { gte: monthStart } } }),
    prisma.payment.aggregate({ where: { status: "VALID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.room.findMany({ where: { isActive: true }, include: { bookings: { where: { startTime: { gte: monthStart }, status: { in: ["DISETUJUI", "TERKONFIRMASI"] } }, select: { id: true } } }, orderBy: { name: "asc" } }),
    prisma.booking.findMany({ where: { startTime: { gte: monthStart } }, select: { purposeType: true } }),
    prisma.booking.findMany({ where: { status: "MENUNGGU_PERSETUJUAN" }, include: { user: true, room: true }, orderBy: { startTime: "asc" }, take: 6 }),
  ]);
  const purposeLabels = { ORGANISASI: "Organisasi", AKADEMIK: "Akademik", UMUM: "Pribadi / Umum" };
  const purposeColors = { ORGANISASI: "bg-indigo-500", AKADEMIK: "bg-sky-500", UMUM: "bg-amber-500" };
  const totalPurposes = Math.max(1, purposeRows.length);
  const maxOccupancy = Math.max(1, ...rooms.map(room => room.bookings.length));
  const revenue = paid._sum.amount ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Ringkasan penyewaan ruang, {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Dashboard Petugas</h1></div>
        <Link href="/admin/reports" className="btn-o">⇩&nbsp; Ekspor Laporan</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["📥", pendingCount, "Pengajuan menunggu", "bg-amber-100"],
          ["💳", paymentCount, "Pembayaran perlu verifikasi", "bg-indigo-100"],
          ["✅", confirmedCount, "Terkonfirmasi bulan ini", "bg-emerald-100"],
          ["💰", revenue ? money(revenue) : "Rp0", "Pendapatan bulan ini", "bg-sky-100"],
        ].map(([icon, value, label, tone]) => <div key={label as string} className="stat-card"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${tone}`}>{icon}</span><div className="min-w-0"><b className="block truncate text-xl font-extrabold">{value}</b><span className="text-[11px] text-slate-500">{label}</span></div></div>)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card !p-4">
          <h2 className="text-sm font-extrabold">Okupansi per Ruangan</h2>
          <div className="mt-4 space-y-3">
            {rooms.map(room => <div key={room.id} className="grid grid-cols-[125px_1fr_34px] items-center gap-2 text-[11px]">
              <span className="truncate">{room.name}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(4, room.bookings.length / maxOccupancy * 100)}%` }} /></div><b className="text-right">{room.bookings.length}</b>
            </div>)}
            {!rooms.length && <p className="text-sm text-slate-500">Belum ada data ruangan.</p>}
          </div>
        </section>
        <section className="card !p-4">
          <h2 className="text-sm font-extrabold">Komposisi Kepentingan Sewa</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(purposeLabels).map(([key, label]) => {
              const count = purposeRows.filter(row => row.purposeType === key).length;
              return <div key={key} className="grid grid-cols-[100px_1fr_38px] items-center gap-2 text-[11px]">
                <span>{label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${purposeColors[key as keyof typeof purposeColors]}`} style={{ width: `${count / totalPurposes * 100}%` }} /></div><b className="text-right">{Math.round(count / totalPurposes * 100)}%</b>
              </div>;
            })}
          </div>
        </section>
      </div>
      <section className="card mt-4 !p-0">
        <div className="flex items-center justify-between gap-2 p-4"><div><h2 className="text-sm font-extrabold">Pengajuan Menunggu Persetujuan</h2><p className="mt-1 text-[11px] text-slate-500">Tinjau dan proses pengajuan terbaru.</p></div><Link href="/admin/bookings" className="text-xs font-bold text-teal-700">Lihat semua →</Link></div>
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{["Pemohon", "Kepentingan", "Kegiatan", "Ruangan", "Jadwal", "Status", "Aksi"].map(label => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>{pending.map(booking => <tr key={booking.id}>
              <td className="font-bold">{booking.user.name}</td><td><StatusBadge status={booking.purposeType} /></td><td>{booking.eventName}</td><td>{booking.room.name}</td>
              <td>{booking.startTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
              <td><StatusBadge status={booking.status} /></td><td><ApprovalButtons id={booking.id} actions={[{ key: "setuju", text: "Setujui" }, { key: "tolak", text: "Tolak", danger: true }]} /></td>
            </tr>)}
            {!pending.length && <tr><td colSpan={7} className="py-8 text-center text-slate-500">Tidak ada pengajuan yang menunggu.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
