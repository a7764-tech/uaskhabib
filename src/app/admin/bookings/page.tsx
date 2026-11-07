import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import ApprovalButtons from "@/components/ApprovalButtons";

type SearchParams = { purpose?: string };
const purposes = [["", "Semua"], ["ORGANISASI", "Organisasi"], ["AKADEMIK", "Akademik"], ["UMUM", "Pribadi/Umum"]];

export const dynamic = "force-dynamic";

export default async function Approvals({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const purpose = purposes.some(([key]) => key === query.purpose) ? query.purpose : "";
  const allBookings = await prisma.booking.findMany({
    where: { status: "MENUNGGU_PERSETUJUAN", ...(purpose ? { purposeType: purpose as "ORGANISASI" } : {}) },
    include: { room: true, user: true },
    orderBy: { startTime: "asc" },
  });
  const bookings = purpose ? allBookings.filter(item => item.purposeType === purpose) : allBookings;
  return (
    <div>
      <div className="mb-5"><p className="eyebrow">Kelola pengajuan</p><h1 className="mt-1 text-2xl font-extrabold">Persetujuan Pengajuan</h1><p className="mt-1 text-sm text-slate-500">Tinjau detail pengajuan dari penyewa, lalu setujui atau tolak.</p></div>
      <div className="card">
        <div className="mb-4 flex flex-wrap gap-2">
          {purposes.map(([key, title]) => <a key={title} href={key ? `/admin/bookings?purpose=${key}` : "/admin/bookings"} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${purpose === key ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 text-slate-600 hover:border-teal-400"}`}>{title}{key ? ` (${allBookings.filter(item => item.purposeType === key).length})` : ` (${allBookings.length})`}</a>)}
        </div>
        <div className="divide-y divide-slate-100">
          {bookings.map(booking => (
            <article key={booking.id} className="flex flex-col gap-3 py-4 first:pt-1 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><b className="text-sm">{booking.user.name}</b><StatusBadge status={booking.purposeType} /></div>
                <p className="mt-1 text-sm font-semibold">{booking.eventName} · {booking.participants} orang</p>
                <p className="mt-1 text-xs text-slate-500">{booking.room.name} · {booking.startTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {booking.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}–{booking.endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="mt-1 max-w-2xl text-xs text-slate-600">{booking.purpose}</p>
                {booking.documentUrl && <a href={booking.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-teal-700">📎 Lihat dokumen pendukung</a>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="mr-2 text-sm font-extrabold">Rp{booking.totalPrice.toLocaleString("id-ID")}</span>
                <ApprovalButtons id={booking.id} actions={[{ key: "tolak", text: "Tolak", danger: true }, { key: "setuju", text: "Setujui" }]} />
              </div>
            </article>
          ))}
          {!bookings.length && <div className="py-10 text-center"><div className="text-3xl">✓</div><p className="mt-2 font-semibold">Semua pengajuan sudah ditinjau</p><p className="mt-1 text-sm text-slate-500">Pengajuan baru akan muncul di halaman ini.</p></div>}
        </div>
      </div>
    </div>
  );
}
