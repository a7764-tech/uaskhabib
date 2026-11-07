import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import ApprovalButtons from "@/components/ApprovalButtons";

export const dynamic = "force-dynamic";

const activeStatuses: readonly string[] = ["MENUNGGU_PERSETUJUAN", "DISETUJUI", "MENUNGGU_VERIFIKASI", "TERKONFIRMASI"];
const money = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export default async function RenterDashboard() {
  const user = await getUser();
  if (!user || user.role !== "PENYEWA") redirect("/login");
  const [bookings, notifications] = await Promise.all([
    prisma.booking.findMany({ where: { userId: user.id }, include: { room: true, payment: true }, orderBy: { startTime: "desc" }, take: 30 }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const now = new Date();
  const upcoming = bookings.filter(item => item.startTime >= now && activeStatuses.includes(item.status)).sort((a, b) => +a.startTime - +b.startTime).slice(0, 3);
  const active = bookings.filter(item => activeStatuses.includes(item.status)).length;
  const waiting = bookings.filter(item => item.status === "MENUNGGU_PERSETUJUAN").length;
  const due = bookings.filter(item => item.status === "DISETUJUI").reduce((sum, item) => sum + item.totalPrice, 0);
  const completed = bookings.filter(item => item.status === "SELESAI").length;

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Halo, {user.name.split(" ")[0]}! 👋</h1><p className="mt-1 text-sm text-slate-500">Pantau pemesanan, tagihan, dan notifikasi Anda di sini.</p></div>
        <Link href="/rooms" className="btn">＋ Sewa Ruang</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["📅", active, "Pemesanan aktif", "bg-emerald-100"],
          ["⌛", waiting, "Menunggu persetujuan", "bg-amber-100"],
          ["💳", money(due), "Perlu dibayar", "bg-sky-100"],
          ["✅", completed, "Pemesanan selesai", "bg-violet-100"],
        ].map(([icon, value, label, tone]) => <div key={label as string} className="stat-card !min-h-[82px] !gap-2 !p-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base ${tone}`}>{icon}</span><div className="min-w-0"><b className="block truncate text-lg font-extrabold">{value}</b><span className="text-[10px] text-slate-500">{label}</span></div></div>)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card !p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold">📌 Jadwal Terdekat</h2><Link href="/dashboard/bookings" className="text-[11px] font-bold text-teal-700">Lihat riwayat</Link></div>
          <div className="space-y-3">
            {upcoming.map(booking => <div key={booking.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div><p className="text-xs font-bold">{booking.startTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p><p className="mt-1 text-[11px] text-slate-500">{booking.room.name} · {booking.eventName}</p></div>
              <StatusBadge status={booking.purposeType} />
            </div>)}
            {!upcoming.length && <p className="py-3 text-xs text-slate-500">Belum ada jadwal mendatang.</p>}
          </div>
        </section>
        <section className="card !p-4">
          <h2 className="mb-2 text-sm font-extrabold">🔔 Notifikasi</h2>
          <div className="divide-y divide-slate-100">
            {notifications.map(note => <div key={note.id} className="py-2.5 first:pt-1"><p className="text-xs leading-5">{note.message}</p><p className="mt-0.5 text-[10px] text-slate-400">{note.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></div>)}
            {!notifications.length && <p className="py-3 text-xs text-slate-500">Belum ada notifikasi baru.</p>}
          </div>
        </section>
      </div>

      <section className="card mt-4 !p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4"><div><h2 className="text-sm font-extrabold">Riwayat Pemesanan</h2><p className="mt-1 text-[11px] text-slate-500">Status terbaru dan tindakan yang dapat Anda lakukan.</p></div><Link href="/dashboard/bookings" className="text-xs font-bold text-teal-700">Lihat semua →</Link></div>
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{["Ruangan / Kegiatan", "Kepentingan", "Tanggal & Jam", "Total (Rp)", "Status", "Aksi"].map(label => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>{bookings.slice(0, 6).map(booking => <tr key={booking.id}>
              <td><b>{booking.room.name}</b><span className="mt-0.5 block text-[11px] text-slate-500">{booking.eventName}</span></td>
              <td><StatusBadge status={booking.purposeType} /></td>
              <td>{booking.startTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
              <td>{money(booking.totalPrice)}</td><td><StatusBadge status={booking.status} /></td>
              <td className="space-y-1">
                {booking.status === "DISETUJUI" && <Link href={`/dashboard/bookings/${booking.id}/pay`} className="btn !min-h-8 !px-2.5 !py-1 text-[10px]">Unggah Bukti</Link>}
                {["MENUNGGU_PERSETUJUAN", "DISETUJUI"].includes(booking.status) && <ApprovalButtons id={booking.id} actions={[{ key: "batal", text: "Batalkan", danger: true }]} />}
              </td>
            </tr>)}
            {!bookings.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Anda belum memiliki pemesanan.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
