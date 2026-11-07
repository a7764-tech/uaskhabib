import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { roomSchema } from "@/lib/validators";
export async function GET() {
  return NextResponse.json(await prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  if ((await getUser())?.role !== "PETUGAS") return NextResponse.json({ error: "Hanya petugas" }, { status: 403 });
  const p = roomSchema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  return NextResponse.json(await prisma.room.create({ data: p.data }), { status: 201 });
}
