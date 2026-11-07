import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { bookingSchema } from "@/lib/validators";
import { ACTIVE, at, notify } from "@/lib/booking";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = user.role === "PETUGAS" ? {} : { userId: user.id };
  const bookings = await prisma.booking.findMany({
    where,
    include: { room: true, user: true, payment: true },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "PENYEWA") {
    return NextResponse.json({ error: "Hanya penyewa yang dapat mengajukan pemesanan" }, { status: 403 });
  }

  const parsed = bookingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const data = parsed.data;
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room?.isActive) return NextResponse.json({ error: "Ruangan tidak aktif" }, { status: 400 });
  if (data.participants > room.capacity) {
    return NextResponse.json({ error: `Kapasitas ruangan maksimal ${room.capacity} orang` }, { status: 400 });
  }
  if (data.purposeType !== "UMUM" && !data.documentUrl) {
    return NextResponse.json({ error: "Dokumen pendukung wajib dilampirkan" }, { status: 400 });
  }

  const startTime = at(data.date, data.startTime);
  const endTime = at(data.date, data.endTime);
  const totalPrice = Math.round(((endTime.getTime() - startTime.getTime()) / 3_600_000) * room.pricePerHour);
  const booking = await prisma.$transaction(async tx => {
    const lockKey = `${room.id}:${data.date}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    const conflict = await tx.booking.findFirst({
      where: {
        roomId: room.id,
        date: new Date(`${data.date}T00:00:00.000Z`),
        status: { in: [...ACTIVE] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (conflict) return null;
    return tx.booking.create({
      data: {
        code: `RK-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId: user.id,
        roomId: room.id,
        date: new Date(`${data.date}T00:00:00.000Z`),
        startTime,
        endTime,
        purpose: data.purpose,
        purposeType: data.purposeType,
        eventName: data.eventName,
        organizationName: data.organizationName,
        programStudy: data.programStudy,
        course: data.course,
        participants: data.participants,
        documentUrl: data.documentUrl,
        totalPrice,
      },
    });
  });

  if (!booking) return NextResponse.json({ error: "Jadwal ruangan sudah terisi pada waktu tersebut" }, { status: 409 });
  await notify(user.id, `Pengajuan ${booking.code} berhasil dikirim dan menunggu persetujuan petugas.`);
  const officers = await prisma.user.findMany({ where: { role: "PETUGAS", isActive: true }, select: { id: true } });
  await Promise.all(officers.map(officer => notify(officer.id, `Pengajuan baru ${booking.code} menunggu persetujuan.`)));
  return NextResponse.json(booking, { status: 201 });
}
