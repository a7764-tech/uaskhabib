import Link from "next/link";
import { Room } from "@prisma/client";
import RoomImage from "./RoomImage";

const roomType: Record<Room["type"], string> = {
  KELAS: "Ruang Kelas",
  LAB: "Laboratorium",
  AULA: "Aula",
  RAPAT: "Ruang Rapat",
};

export default function RoomCard({ r }: { r: Room }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_5px_18px_rgba(27,50,79,0.07)]">
      <Link href={`/rooms/${r.id}`} aria-label={`Lihat detail ${r.name}`} className="relative block h-44 overflow-hidden bg-slate-100">
        <RoomImage type={r.type} imageUrl={r.imageUrl} name={r.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">{roomType[r.type]}</span>
      </Link>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold">{r.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Kapasitas {r.capacity} orang</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Tersedia</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm font-extrabold">Rp{r.pricePerHour.toLocaleString("id-ID")} <span className="text-[11px] font-normal text-slate-500">/ jam</span></p>
          <Link href={`/rooms/${r.id}`} className="btn-o !min-h-8 !px-2.5 !py-1 text-[11px]">Detail</Link>
          <Link href={`/dashboard/bookings/new?room=${r.id}`} className="btn !min-h-8 !px-2.5 !py-1 text-[11px]">Sewa Ruang</Link>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">{roomType[r.type]} · {r.building}</p>
      </div>
    </article>
  );
}
