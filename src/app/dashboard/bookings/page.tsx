import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import ApprovalButtons from "@/components/ApprovalButtons";

type SearchParams = { status?: string };
const tabs = [
  ["", "Semua"],
  ["MENUNGGU_PERSETUJUAN", "Menunggu"],
  ["DISETUJUI", "Disetujui"],
  ["TERKONFIRMASI", "Terkonfirmasi"],
  ["SELESAI", "Selesai"],
  ["DITOLAK", "Ditolak"],
];
const money = (value: number) => value.toLocaleString("id-ID");

export const dynamic = "force-dynamic";

export default async function BookingHistory({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const user = await getUser();
  if (!user || user.role !== "PENYEWA") redirect("/login");
  const selectedStatus = tabs.some(([status]) => status === query.status) ? query.status : undefined;
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, ...(selectedStatus ? { status: selectedStatus as "MENUNGGU_PERSETUJUAN" } : {}) },
    include: { room: true },
    orderBy: { startTime: "desc" },
  });
  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Area penyewa</p><h1 className="mt-1 text-2xl font-extrabold">Riwayat Pemesanan</h1><p className="mt-1 text-sm text-slate-500">Pantau status pengajuan dan pembayaran ruangan Anda.</p></div><Link href="/rooms" className="btn">＋ Pesan Ruangan Baru</Link></div>
      <div className="card !p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {tabs.map(([status, title]) => <Link key={title} href={status ? `/dashboard/bookings?status=${status}` : "/dashboard/bookings"} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${selectedStatus === status || (!selectedStatus && !status) ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 text-slate-600 hover:border-teal-400"}`}>{title}</Link>)}
        </div>
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{["Kode", "Ruangan / Kegiatan", "Kepentingan", "Tanggal & Jam", "Total (Rp)", "Status", "Aksi"].map(title => <th key={title}>{title}</th>)}</tr></thead>
            <tbody>{bookings.map(booking => <tr key={booking.id}>
              <td className="whitespace-nowrap font-bold">{booking.code}</td>
              <td><b>{booking.room.name}</b><span className="mt-0.5 block text-[11px] text-slate-500">{booking.eventName}</span></td>
              <td><StatusBadge status={booking.purposeType} /></td>
              <td className="whitespace-nowrap">{booking.startTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}<span className="block text-[11px] text-slate-500">{booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></td>
              <td>{money(booking.totalPrice)}</td>
              <td><StatusBadge status={booking.status} />{booking.rejectReason && <p className="mt-1 max-w-36 text-[10px] text-red-700">{booking.rejectReason}</p>}</td>
              <td className="space-y-1">
                {booking.status === "DISETUJUI" && <Link href={`/dashboard/bookings/${booking.id}/pay`} className="btn !min-h-8 !px-2.5 !py-1 text-[10px]">Unggah Bukti</Link>}
                {["MENUNGGU_PERSETUJUAN", "DISETUJUI", "MENUNGGU_VERIFIKASI"].includes(booking.status) && <ApprovalButtons id={booking.id} actions={[{ key: "batal", text: "Batalkan", danger: true }]} />}
              </td>
            </tr>)}
            {!bookings.length && <tr><td colSpan={7} className="py-9 text-center text-sm text-slate-500">Tidak ada pemesanan pada filter ini.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
