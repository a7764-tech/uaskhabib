import { get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const maxFileSize = 4 * 1024 * 1024;
const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function fileUrl(pathname: string) {
  return `/api/upload?pathname=${encodeURIComponent(pathname)}`;
}

export async function POST(req: Request) {
  if (!(await getUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Berkas kosong" }, { status: 400 });
  if (file.size > maxFileSize) return NextResponse.json({ error: "Maksimal 4 MB" }, { status: 400 });

  const extension = extname(file.name).toLowerCase();
  const contentType = contentTypes[extension];
  if (!contentType || file.type !== contentType) {
    return NextResponse.json({ error: "Format harus PDF/JPG/PNG" }, { status: 400 });
  }

  const pathname = `uploads/${randomUUID()}${extension}`;
  await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType,
  });
  return NextResponse.json({ url: fileUrl(pathname) });
}

export async function GET(req: Request) {
  const pathname = new URL(req.url).searchParams.get("pathname");
  if (!pathname || !/^uploads\/[0-9a-f-]{36}\.(pdf|jpe?g|png)$/i.test(pathname)) {
    return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });
  }

  const url = fileUrl(pathname);
  const roomImage = await prisma.room.findFirst({
    where: { imageUrl: url },
    select: { id: true },
  });

  let canRead = Boolean(roomImage);
  if (!canRead) {
    const user = await getUser();
    if (user) {
      const booking = await prisma.booking.findFirst({
        where: {
          ...(user.role === "PETUGAS" ? {} : { userId: user.id }),
          OR: [
            { documentUrl: url },
            { payment: { is: { proofUrl: url } } },
          ],
        },
        select: { id: true },
      });
      canRead = Boolean(booking);
    }
  }

  if (!canRead) return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
