import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admin, deny } from "@/lib/guard";
import { roomSchema } from "@/lib/validators";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await admin())) return deny();
  const b = await req.json();
  if (Object.keys(b).length === 1 && "isActive" in b) {
    if (typeof b.isActive !== "boolean") return NextResponse.json({ error: "Status aktif tidak valid" }, { status: 400 });
    return NextResponse.json(await prisma.room.update({ where: { id }, data: { isActive: b.isActive } }));
  }
  const p = roomSchema.safeParse(b);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  return NextResponse.json(await prisma.room.update({ where: { id }, data: p.data }));
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await admin())) return deny();
  if (await prisma.booking.count({ where: { roomId: id } })) {
    await prisma.room.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, note: "Ruangan punya riwayat, dinonaktifkan." });
  }
  await prisma.room.delete({ where: { id } }); return NextResponse.json({ ok: true });
}
