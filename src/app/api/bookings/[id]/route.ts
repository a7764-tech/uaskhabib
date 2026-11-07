import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { ACTIVE, notify } from "@/lib/booking";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json().catch(() => null);
  const action = payload?.action;
  const reason = typeof payload?.rejectReason === "string" ? payload.rejectReason.trim() : "";
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Pemesanan tidak ditemukan" }, { status: 404 });

  if (action === "batal") {
    if (user.role !== "PETUGAS" && booking.userId !== user.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke pemesanan ini" }, { status: 403 });
    }
    if (["DITOLAK", "SELESAI", "DIBATALKAN", "TERKONFIRMASI"].includes(booking.status)) {
      return NextResponse.json({ error: "Pemesanan ini tidak dapat dibatalkan" }, { status: 400 });
    }
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "DIBATALKAN" } });
    await notify(booking.userId, `Pemesanan ${booking.code} dibatalkan.`);
    return NextResponse.json({ ok: true });
  }

  if (user.role !== "PETUGAS") {
    return NextResponse.json({ error: "Hanya petugas yang dapat memproses pengajuan" }, { status: 403 });
  }
  if (booking.status !== "MENUNGGU_PERSETUJUAN") {
    return NextResponse.json({ error: "Status pengajuan sudah berubah" }, { status: 409 });
  }
  if (action === "setuju") {
    const approved = await prisma.$transaction(async tx => {
      const lockKey = `${booking.roomId}:${booking.date.toISOString().slice(0, 10)}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: booking.id },
          roomId: booking.roomId,
          date: booking.date,
          status: { in: [...ACTIVE] },
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime },
        },
        select: { id: true },
      });
      if (conflict) return false;
      await tx.booking.update({ where: { id: booking.id }, data: { status: "DISETUJUI" } });
      return true;
    });
    if (!approved) return NextResponse.json({ error: "Jadwal bentrok dengan pemesanan yang sudah disetujui" }, { status: 409 });
    await notify(booking.userId, `Pengajuan ${booking.code} disetujui. Silakan unggah bukti pembayaran.`);
    return NextResponse.json({ ok: true });
  }
  if (action === "tolak") {
    if (!reason) return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "DITOLAK", rejectReason: reason } });
    await notify(booking.userId, `Pengajuan ${booking.code} ditolak: ${reason}`);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}
