import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PayForm from "@/components/PayForm";
import StatusBadge from "@/components/StatusBadge";

const money = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

export const dynamic = "force-dynamic";

export default async function Pay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || user.role !== "PENYEWA") redirect("/login");
  const booking = await prisma.booking.findFirst({ where: { id, userId: user.id }, include: { room: true, payment: true } });
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-3xl pb-20 md:pb-0">
      <p className="mb-4 text-xs text-slate-500"><Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link> / <Link href="/dashboard/bookings" className="hover:text-teal-700">Riwayat Pemesanan</Link> / Pembayaran</p>
      <div className="mb-5"><p className="eyebrow">Pembayaran manual</p><h1 className="mt-1 text-2xl font-extrabold">Pembayaran Pemesanan</h1><p className="mt-1 text-sm text-slate-500">Transfer sesuai total biaya, lalu unggah bukti pembayaran untuk diverifikasi petugas.</p></div>
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <section className="card">
            <h2 className="font-extrabold">1. Rincian Tagihan</h2>
            <p className="mt-3 text-lg font-bold">{booking.eventName}</p>
            <div className="mt-2 flex items-center justify-between"><span className="text-sm text-slate-500">Kepentingan</span><StatusBadge status={booking.purposeType} /></div>
            <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Ruangan</dt><dd className="font-semibold">{booking.room.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Jadwal</dt><dd className="text-right font-semibold">{booking.startTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}<br />{booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3"><dt className="font-bold">Total tagihan</dt><dd className="text-lg font-extrabold text-teal-700">{money(booking.totalPrice)}</dd></div>
            </dl>
          </section>
          <section className="card">
            <h2 className="font-extrabold">2. Rekening Tujuan</h2>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-xs font-black text-blue-700 shadow-sm">BRI</span>
              <div><p className="text-xs text-slate-500">Bank BRI</p><p className="font-extrabold tracking-wide">1234-01-567890-53</p><p className="text-[11px] text-slate-500">Rekening pembayaran resmi</p></div>
            </div>
          </section>
          <section className="card">
            <h2 className="mb-3 font-extrabold">3. Unggah Bukti Transfer</h2>
            {booking.status === "DISETUJUI" ? <PayForm bookingId={booking.id} dueAmount={booking.totalPrice} /> : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold">Status pemesanan: <StatusBadge status={booking.status} /></p>
                {booking.payment && <p className="mt-2 text-slate-600">Bukti pembayaran dikirim pada {booking.payment.paidAt.toLocaleDateString("id-ID")} dan sedang diproses.</p>}
                {booking.payment?.note && <p className="mt-2 text-red-700">{booking.payment.note}</p>}
              </div>
            )}
          </section>
        </div>
        <aside className="card !p-4">
          <h2 className="text-sm font-extrabold">Status Pemesanan</h2>
          <ol className="mt-4 space-y-4 text-xs">
            {["Pengajuan disetujui", "Unggah bukti bayar", "Verifikasi petugas", "Terkonfirmasi"].map((item, index) => <li key={item} className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${index < (booking.status === "DISETUJUI" ? 1 : booking.status === "MENUNGGU_VERIFIKASI" ? 2 : 4) ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>{item}</li>)}
          </ol>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">Ruangan resmi terpesan setelah pembayaran diverifikasi petugas.</p>
        </aside>
      </div>
    </div>
  );
}
