import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admin, deny } from "@/lib/guard";
import { notify } from "@/lib/booking";
// UC-09: admin memvalidasi / menolak bukti pembayaran
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await admin(); if (!a) return deny();
  const { action, note } = await req.json();
  const pay = await prisma.payment.findUnique({ where: { id }, include: { booking: true } });
  if (!pay || pay.status !== "MENUNGGU") return NextResponse.json({ error: "Pembayaran tidak dapat diproses" }, { status: 400 });
  if (!["valid", "tolak"].includes(action)) return NextResponse.json({ error: "Aksi pembayaran tidak dikenal" }, { status: 400 });
  const ok = action === "valid";
  if (ok && pay.amount !== pay.booking.totalPrice) return NextResponse.json({ error: "Nominal transfer tidak sesuai dengan tagihan" }, { status: 400 });
  if (!ok && (typeof note !== "string" || !note.trim())) return NextResponse.json({ error: "Catatan penolakan wajib" }, { status: 400 });
  await prisma.$transaction([
    prisma.payment.update({ where: { id: pay.id }, data: { status: ok ? "VALID" : "DITOLAK", verifiedBy: a.id, note: ok ? null : note.trim() } }),
    prisma.booking.update({ where: { id: pay.bookingId }, data: { status: ok ? "TERKONFIRMASI" : "DISETUJUI" } })]);
  await notify(pay.booking.userId, ok ? `Pembayaran ${pay.booking.code} valid, ruangan terkonfirmasi.` : `Pembayaran ${pay.booking.code} ditolak: ${note}. Unggah ulang bukti.`);
  return NextResponse.json({ ok: true });
}
