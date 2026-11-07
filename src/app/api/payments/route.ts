import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { notify } from "@/lib/booking";
// UC-04: penyewa mengunggah bukti transfer setelah pengajuan disetujui
export async function POST(req: Request) {
  const u = await getUser(); if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "PENYEWA") return NextResponse.json({ error: "Hanya penyewa yang dapat mengirim bukti pembayaran" }, { status: 403 });
  const { bookingId, proofUrl, amount, paidAt, senderName } = await req.json();
  const b = await prisma.booking.findFirst({ where: { id: bookingId, userId: u.id, status: "DISETUJUI" } });
  if (!b || !proofUrl) return NextResponse.json({ error: "Pemesanan belum disetujui / bukti kosong" }, { status: 400 });
  if (!Number.isInteger(amount) || amount !== b.totalPrice) return NextResponse.json({ error: "Nominal transfer harus sama dengan total tagihan" }, { status: 400 });
  if (typeof senderName !== "string" || senderName.trim().length < 2) return NextResponse.json({ error: "Nama pengirim wajib diisi" }, { status: 400 });
  if (typeof paidAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return NextResponse.json({ error: "Tanggal transfer tidak valid" }, { status: 400 });
  const data = { proofUrl, amount, senderName: senderName.trim(), status: "MENUNGGU" as const, paidAt: new Date(`${paidAt}T00:00:00+07:00`), note: null };
  const [pay] = await prisma.$transaction([
    prisma.payment.upsert({ where: { bookingId }, create: { bookingId, ...data }, update: data }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: "MENUNGGU_VERIFIKASI" } })]);
  for (const a of await prisma.user.findMany({ where: { role: "PETUGAS", isActive: true } })) await notify(a.id, `Bukti bayar ${b.code} menunggu verifikasi.`);
  return NextResponse.json(pay, { status: 201 });
}
