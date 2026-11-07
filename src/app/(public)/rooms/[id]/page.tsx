import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { ACTIVE } from "@/lib/booking";
import RoomImage from "@/components/RoomImage";

export const dynamic = "force-dynamic";

const typeNames = { KELAS: "Ruang Kelas", LAB: "Laboratorium", AULA: "Aula", RAPAT: "Ruang Rapat" };
const hours = Array.from({ length: 10 }, (_, index) => index + 8);

export default async function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [room, user] = await Promise.all([
    prisma.room.findUnique({ where: { id } }),
    getUser(),
  ]);
  if (!room || !room.isActive) notFound();

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 5);
  const bookings = await prisma.booking.findMany({
    where: { roomId: room.id, startTime: { lt: sunday }, endTime: { gt: monday }, status: { in: [...ACTIVE] } },
    select: { eventName: true, startTime: true, endTime: true },
  });
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  const bookLink = user?.role === "PENYEWA" ? `/dashboard/bookings/new?room=${room.id}` : "/login";

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500"><Link href="/" className="hover:text-teal-700">Beranda</Link> / <Link href="/rooms" className="hover:text-teal-700">Ruangan</Link> / {room.name}</p>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div>
          <div className="h-56 overflow-hidden rounded-3xl bg-slate-100">
            <RoomImage type={room.type} imageUrl={room.imageUrl} name={room.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div><p className="eyebrow">{typeNames[room.type]} · {room.building}</p><h1 className="mt-1 text-2xl font-extrabold">{room.name}</h1><p className="mt-1 text-sm text-slate-500">Kapasitas hingga {room.capacity} orang · Lantai {room.floor}</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">Aktif</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {room.facilities.split(",").filter(Boolean).map(facility => <span key={facility} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">{facility.trim()}</span>)}
          </div>
          <section className="card mt-5 !p-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="font-extrabold">Kalender Ketersediaan</h2><p className="mt-1 text-xs text-slate-500">Jadwal ruang untuk minggu ini</p></div>
              <div className="flex gap-3 text-[11px] text-slate-500"><span>● Tersedia</span><span className="text-teal-700">● Terpakai</span></div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[590px]">
                <div className="grid grid-cols-[48px_repeat(5,minmax(80px,1fr))] gap-1">
                  <span />
                  {days.map(day => <span key={day.toISOString()} className="pb-2 text-center text-[11px] font-bold text-slate-600">{day.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" })}</span>)}
                  {hours.map(hour => (
                    <div key={hour} className="contents">
                      <span className="py-2 text-[10px] text-slate-400">{String(hour).padStart(2, "0")}:00</span>
                      {days.map(day => {
                        const slotStart = new Date(day); slotStart.setHours(hour, 0, 0, 0);
                        const slotEnd = new Date(slotStart); slotEnd.setHours(hour + 1);
                        const booking = bookings.find(item => item.startTime < slotEnd && item.endTime > slotStart);
                        return <div key={`${day.toISOString()}-${hour}`} title={booking?.eventName ?? "Tersedia"} className={`min-h-8 rounded-md border ${booking ? "border-teal-100 bg-teal-50" : "border-slate-100 bg-slate-50"}`}>
                          {booking && <span className="block truncate px-1 py-2 text-center text-[9px] font-semibold text-teal-800">{booking.eventName}</span>}
                        </div>;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <div className="card mt-4">
            <h2 className="font-extrabold">Informasi penggunaan</h2>
            <p className="mt-2 text-sm text-slate-600">Ruangan wajib dikembalikan dalam kondisi bersih. Pembayaran dilakukan setelah pengajuan disetujui petugas.</p>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="card">
            <h2 className="font-extrabold">Pesan Ruangan Ini</h2>
            <p className="mt-3 text-2xl font-extrabold text-teal-700">Rp{room.pricePerHour.toLocaleString("id-ID")} <span className="text-xs font-medium text-slate-500">/ jam</span></p>
            <div className="mt-4 space-y-2 border-y border-slate-100 py-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Kapasitas</span><b>{room.capacity} orang</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Jam operasional</span><b>07:00–17:00</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Jenis</span><b>{typeNames[room.type]}</b></div>
            </div>
            <Link href={bookLink} className="btn mt-4 w-full">Sewa Ruang</Link>
            <p className="mt-2 text-center text-[11px] text-slate-500">Jadwal diperiksa otomatis sebelum pengajuan disimpan.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
