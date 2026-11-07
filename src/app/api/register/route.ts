import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
export async function POST(req: Request) {
  const p = registerSchema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email: p.data.email } })) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  await prisma.user.create({ data: { ...p.data, password: await bcrypt.hash(p.data.password, 10) } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
