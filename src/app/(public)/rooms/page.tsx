import { prisma } from "@/lib/prisma";
import RoomCard from "@/components/RoomCard";
import { at, ACTIVE } from "@/lib/booking";

export const dynamic = "force-dynamic";

type SearchParams = { date?: string; start?: string; end?: string; min?: string; type?: string; fac?: string };
const roomTypes = ["KELAS", "LAB", "AULA", "RAPAT"];

export default async function Rooms({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const validDate = !!params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date);
  const validHours = !!params.start && !!params.end && /^\d{2}:\d{2}$/.test(params.start) && /^\d{2}:\d{2}$/.test(params.end) && params.start < params.end;
  const busy = validDate && validHours ? {
    date: new Date(`${params.date}T00:00:00.000Z`),
    startTime: { lt: at(params.date!, params.end!) },
    endTime: { gt: at(params.date!, params.start!) },
    status: { in: [...ACTIVE] },
  } : undefined;
  const minCapacity = Number(params.min);
  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      capacity: { gte: Number.isFinite(minCapacity) && minCapacity > 0 ? minCapacity : 0 },
      ...(roomTypes.includes(params.type ?? "") ? { type: params.type as "KELAS" | "LAB" | "AULA" | "RAPAT" } : {}),
      ...(params.fac ? { facilities: { contains: params.fac, mode: "insensitive" } } : {}),
      ...(busy ? { bookings: { none: busy } } : {}),
    },
    orderBy: { capacity: "desc" },
  });

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow">Jelajahi fasilitas</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Daftar Ruangan</h1>
        <p className="mt-1 text-sm text-slate-500">{rooms.length} ruangan tersedia{params.date ? ` pada ${params.date}` : ""}{params.start && params.end ? `, ${params.start}–${params.end}` : ""}</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[235px_minmax(0,1fr)]">
        <form className="card space-y-3 !p-4">
          <div className="flex items-center justify-between"><b className="text-sm">Filter</b><a href="/rooms" className="text-[11px] font-bold text-teal-700">Reset</a></div>
          <div><label className="lbl">Tanggal</label><input name="date" type="date" defaultValue={params.date} className="inp" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="lbl">Mulai</label><input name="start" type="time" defaultValue={params.start} className="inp" /></div>
            <div><label className="lbl">Selesai</label><input name="end" type="time" defaultValue={params.end} className="inp" /></div>
          </div>
          <div>
            <label className="lbl">Jenis ruangan</label>
            <select name="type" defaultValue={params.type} className="inp">
              <option value="">Semua jenis</option><option value="KELAS">Ruang Kelas</option><option value="LAB">Laboratorium</option><option value="AULA">Aula</option><option value="RAPAT">Ruang Rapat</option>
            </select>
          </div>
          <div><label className="lbl">Kapasitas minimal</label><input name="min" type="number" min="1" defaultValue={params.min} placeholder="Contoh: 30 orang" className="inp" /></div>
          <div>
            <label className="lbl">Fasilitas</label>
            <select name="fac" defaultValue={params.fac} className="inp">
              <option value="">Semua fasilitas</option><option>Proyektor</option><option>AC</option><option>Sound system</option><option>Wi-Fi</option>
            </select>
          </div>
          <button className="btn w-full">Terapkan Filter</button>
        </form>
        <div>
          {rooms.length ? <div className="grid gap-4 sm:grid-cols-2">{rooms.map(room => <RoomCard key={room.id} r={room} />)}</div> : (
            <div className="card text-center">
              <div className="text-3xl">⌕</div>
              <h2 className="mt-2 font-bold">Ruangan tidak ditemukan</h2>
              <p className="mt-1 text-sm text-slate-500">Coba ubah tanggal atau filter pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
