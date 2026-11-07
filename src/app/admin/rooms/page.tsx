import { prisma } from "@/lib/prisma";
import RoomManagement from "@/components/RoomManagement";

export const dynamic = "force-dynamic";

export default async function RoomsAdmin() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3"><div><p className="eyebrow">Kelola fasilitas</p><h1 className="mt-1 text-2xl font-extrabold">Kelola Ruangan</h1><p className="mt-1 text-sm text-slate-500">Data ruangan, kapasitas, fasilitas, dan tarif.</p></div><a href="#room-form" className="btn">＋ Tambah Ruangan</a></div>
      <RoomManagement rooms={rooms} />
    </div>
  );
}
