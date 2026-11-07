import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoomCard from "@/components/RoomCard";

export const dynamic = "force-dynamic";

const purposes = [
  { type: "ORGANISASI", icon: "👥", title: "Kegiatan Organisasi", description: "Rapat, UKM, BEM/DPM, acara organisasi", tone: "bg-indigo-100" },
  { type: "AKADEMIK", icon: "🎓", title: "Kegiatan Akademik", description: "Kuliah tambahan, seminar, ujian, pelatihan", tone: "bg-sky-100" },
  { type: "UMUM", icon: "🎉", title: "Keperluan Pribadi / Umum", description: "Acara pribadi, instansi luar, masyarakat umum", tone: "bg-amber-100" },
];

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role === "PETUGAS") redirect("/admin");

  const rooms = await prisma.room.findMany({ where: { isActive: true }, take: 3, orderBy: { capacity: "desc" } });
  return (
    <div className="-mt-6">
      <section className="relative -mx-4 overflow-hidden bg-gradient-to-r from-[#12263f] via-[#145267] to-[#0c8b80] px-4 pb-14 pt-9 text-white md:rounded-b-[28px] md:px-8 md:pb-16 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-[38px]">
            Cari dan sewa ruang kampus dengan mudah
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-200">
            Lihat ketersediaan, pesan, dan pantau status pengajuan dalam satu tempat.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-3 text-[#142943] shadow-xl md:p-4">
            <form action="/rooms" className="grid gap-3 md:grid-cols-[1.05fr_1fr_1fr_1fr_auto]">
              <div><label className="lbl">Jenis ruangan</label><select name="type" className="inp"><option value="">Semua jenis</option><option value="KELAS">Ruang Kelas</option><option value="LAB">Laboratorium</option><option value="AULA">Aula</option><option value="RAPAT">Ruang Rapat</option></select></div>
              <div><label className="lbl">Tanggal</label><input name="date" type="date" className="inp" /></div>
              <div><label className="lbl">Jam mulai</label><input name="start" type="time" className="inp" /></div>
              <div><label className="lbl">Jumlah peserta</label><input name="min" type="number" min="1" placeholder="Contoh: 40" className="inp" /></div>
              <button className="btn self-end whitespace-nowrap">⌕&nbsp; Cari Ruangan</button>
            </form>
          </div>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-teal-50">
            <span>✓ Cek bentrok otomatis</span><span>✓ Pantau status pengajuan</span><span>✓ Pembayaran mudah</span>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-0 pb-12 pt-6">
        <section>
          <h2 className="mb-3 text-sm font-extrabold">Sewa Ruang untuk Kepentingan Apa?</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {purposes.map(purpose => (
              <Link key={purpose.type} href={`/dashboard/bookings/new?purposeType=${purpose.type}`} className="card group flex min-h-32 flex-col items-start !p-4 transition hover:-translate-y-0.5 hover:border-teal-200">
                <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${purpose.tone}`}>{purpose.icon}</span>
                <h3 className="mt-2 text-sm font-bold">{purpose.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{purpose.description}</p>
                <span className="mt-3 inline-flex rounded-lg bg-[#0c8b80] px-3 py-1.5 text-[11px] font-bold text-white">Sewa Ruang <span className="ml-1 transition group-hover:translate-x-0.5">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Ruangan Populer</h2>
            <Link href="/rooms" className="text-xs font-bold text-teal-700 hover:text-teal-900">Lihat semua ruangan →</Link>
          </div>
          {rooms.length ? <div className="grid gap-4 md:grid-cols-3">{rooms.map(room => <RoomCard key={room.id} r={room} />)}</div> : (
            <div className="card text-sm text-slate-500">Belum ada ruangan yang aktif.</div>
          )}
        </section>
      </div>
    </div>
  );
}
