import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { admin, deny } from "@/lib/guard";

const staffSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  if (!(await admin())) return deny();
  const parsed = staffSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      ...parsed.data,
      email,
      password: await bcrypt.hash(parsed.data.password, 12),
      role: "PETUGAS",
    },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
