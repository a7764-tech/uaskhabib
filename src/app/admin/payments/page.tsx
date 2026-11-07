import { prisma } from "@/lib/prisma";
import ApiButton from "@/components/ApiButton";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Payments() {
  const [pending, confirmed, rejected] = await Promise.all([
    prisma.payment.findMany({ where: { status: "MENUNGGU" }, include: { booking: { include: { room: true, user: true } } }, orderBy: { paidAt: "asc" } }),
    prisma.payment.count({ where: { status: "VALID" } }),
    prisma.payment.count({ where: { status: "DITOLAK" } }),
  ]);
  return (
    <div>
      <div className="mb-5"><p className="eyebrow">Verifikasi manual</p><h1 className="mt-1 text-2xl font-extrabold">Verifikasi Pembayaran</h1><p className="mt-1 text-sm text-slate-500">Periksa bukti transfer dan nominal sebelum mengonfirmasi pemesanan.</p></div>
      <div className="mb-4 flex flex-wrap gap-2"><span className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-bold text-white">Menunggu Verifikasi ({pending.length})</span><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">Terkonfirmasi ({confirmed})</span><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">Ditolak ({rejected})</span></div>
      {pending.length ? <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div className="card !p-0">
          <div className="table-wrap">
            <table className="table-base !min-w-[590px]">
              <thead><tr>{["Pemesan", "Kegiatan", "Tagihan", "Dibayar", "Status", "Bukti"].map(title => <th key={title}>{title}</th>)}</tr></thead>
              <tbody>{pending.map(payment => <tr key={payment.id}>
                <td className="font-bold">{payment.booking.user.name}<span className="mt-0.5 block text-[10px] font-normal text-slate-500">{payment.senderName ?? "—"}</span></td>
                <td>{payment.booking.eventName}<span className="mt-0.5 block text-[10px] text-slate-500">{payment.booking.room.name}</span></td>
                <td>{payment.booking.totalPrice.toLocaleString("id-ID")}</td><td>{payment.amount.toLocaleString("id-ID")}</td>
                <td><StatusBadge status={payment.status} /></td>
                <td><a href={payment.proofUrl} target="_blank" rel="noreferrer" className="font-bold text-teal-700">Lihat bukti ↗</a></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <aside className="card">
          <p className="eyebrow">Paling lama menunggu</p>
          <h2 className="mt-1 text-lg font-extrabold">{pending[0].booking.user.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{pending[0].booking.eventName} · {pending[0].booking.room.name}</p>
          <div className="my-4 space-y-2 border-y border-slate-100 py-3 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Tagihan</span><b>Rp{pending[0].booking.totalPrice.toLocaleString("id-ID")}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Dibayar</span><b>Rp{pending[0].amount.toLocaleString("id-ID")}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Tanggal transfer</span><b>{pending[0].paidAt.toLocaleDateString("id-ID")}</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Nominal</span><StatusBadge status={pending[0].amount === pending[0].booking.totalPrice ? "VALID" : "DITOLAK"} /></div>
          </div>
          <a href={pending[0].proofUrl} target="_blank" rel="noreferrer" className="mb-4 grid min-h-36 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500 hover:bg-slate-200">🧾 Buka bukti transfer</a>
          <p className="mb-2 text-[11px] text-slate-500">Catatan penolakan harus menyertakan alasan untuk penyewa.</p>
          <div className="flex gap-2"><ApiButton url={`/api/payments/${pending[0].id}`} body={{ action: "valid" }} text="Validasi" /><ApiButton url={`/api/payments/${pending[0].id}`} body={{ action: "tolak" }} reasonKey="note" text="Tolak" danger /></div>
        </aside>
      </div> : <div className="card py-12 text-center"><div className="text-3xl">✓</div><h2 className="mt-2 font-bold">Tidak ada pembayaran yang menunggu</h2><p className="mt-1 text-sm text-slate-500">Bukti pembayaran baru akan muncul di halaman ini.</p></div>}
    </div>
  );
}
