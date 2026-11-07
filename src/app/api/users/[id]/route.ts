import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admin, deny } from "@/lib/guard";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const officer = await admin();
  if (!officer) return deny();
  if (officer.id === id) return NextResponse.json({ error: "Akun petugas yang sedang digunakan tidak dapat diubah di sini" }, { status: 400 });
  const payload = await req.json();
  if (payload.role !== undefined && !["PENYEWA", "PETUGAS"].includes(payload.role)) {
    return NextResponse.json({ error: "Peran tidak valid" }, { status: 400 });
  }
  if (payload.isActive !== undefined && typeof payload.isActive !== "boolean") {
    return NextResponse.json({ error: "Status aktif tidak valid" }, { status: 400 });
  }
  return NextResponse.json(await prisma.user.update({
    where: { id },
    data: { ...(payload.role !== undefined ? { role: payload.role } : {}), ...(payload.isActive !== undefined ? { isActive: !!payload.isActive } : {}) },
  }));
}
